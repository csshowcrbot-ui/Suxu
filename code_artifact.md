# 醫美工作室預約與營運管理系統 (Technical Architecture & Engineering Specification)

本文件定義系統架構、關聯式資料庫綱要（Database Schema）、關鍵業務邏輯（預約防衝突、FIFO 耗材核銷）、RESTful API 規格及 LINE Bot 自動化任務排程之工程實作標準。

---

## 1. 系統技術堆疊 (Tech Stack)

| 層級 | 推薦技術 | 選擇考量 |
| :--- | :--- | :--- |
| **顧客端前端** | Vue 3 (Vite) 或 Next.js / Tailwind CSS / Pinia | 極輕量、支援 LINE LIFF 快速喚起、首屏秒開 |
| **後台管理端** | Next.js (React) / Shadcn UI / Tailwind CSS | 豐富的資料表格、日曆甘特圖與權限控制生態 |
| **後端服務 (API)** | Node.js (NestJS) 或 Go | 強型別（TypeScript/Go）、模組化結構、容易維護複雜業務邏輯 |
| **資料庫 (RDBMS)** | PostgreSQL 16+ | 嚴格的 ACID 交易保護（防止超賣、重疊預約）、JSONB 支援彈性表單 |
| **快取與任務隊列** | Redis 7+ / BullMQ | 高速預約鎖定（Distributed Lock）、分鐘級定時排程引擎 |
| **物件儲存 (Storage)** | AWS S3 / Cloudflare R2 | 存放術前術後照片、數位簽名 PDF、耗材發票 |
| **第三方通訊** | LINE Messaging API / LIFF SDK 2.x | 身份綁定、推播 Flex Message 與 Rich Menu 切換 |

---

## 2. 系統拓撲架構 (System Architecture)

```
[ 顧客手機 (LINE LIFF) ]       [ 後台工作人員 (Desktop/Tablet) ]
           │                                 │
           ▼                                 ▼
   [ Cloudflare CDN / WAF / SSL (Reverse Proxy) ]
                     │
                     ▼
             [ API Gateway / Nginx ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [ API Application Service ]  [ Worker / Scheduler Service ]
  (NestJS Core Server)         (BullMQ Task Consumer)
         │           │                   │
         │           └──────────┐        │
         ▼                      ▼        ▼
  [ PostgreSQL 16 ]         [ Redis Cluster ]
  (Orders/Booking/CRM)      (Locking / Session / Queue)
                                │
                                ▼
                   [ LINE Messaging API / S3 ]
```

---

## 3. 資料庫設計 (Database Schema / ERD)

本系統核心資料庫使用 PostgreSQL，以下為關鍵實體表格定義：

```sql
-- 1. 會員主檔
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(64) UNIQUE,
    full_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(10),
    birthday DATE,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00, -- 儲值金
    medical_notes JSONB, -- 過敏史、酸類與雷射經驗、特殊禁忌症
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 空間與設備資源（用於防呆衝突排程）
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'ROOM' (包廂) 或 'MACHINE' (特定儀器如皮秒、海菲秀)
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. 員工主檔
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'DOCTOR', 'BEAUTICIAN', 'CONSULTANT'
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. 療程項目與零售品項
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'TREATMENT' (療程), 'PRODUCT' (零售耗材)
    duration_min INT DEFAULT 60, -- 療程所需時間（分）
    buffer_min INT DEFAULT 15,   -- 術後清消緩衝時間（分）
    price NUMERIC(10, 2) NOT NULL,
    required_resource_type VARCHAR(20) -- 綁定設備需求 (例如: 'MACHINE_PICOWAY')
);

-- 5. 耗材庫存批號（支援先進先出 FIFO 與效期預警）
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id),
    batch_no VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL,
    cost_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 療程消耗耗材配方（BOM: 結案時自動扣庫存）
CREATE TABLE treatment_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID REFERENCES items(id),
    inventory_item_id UUID REFERENCES items(id),
    deduct_quantity INT NOT NULL DEFAULT 1
);

-- 7. 顧客已購療程堂數包 (Treatment Packages)
CREATE TABLE member_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    treatment_id UUID REFERENCES items(id),
    total_quota INT NOT NULL,     -- 總購買堂數
    remaining_quota INT NOT NULL, -- 剩餘堂數
    expire_at DATE,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 預約記錄主表
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_no VARCHAR(32) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id),
    staff_id UUID REFERENCES staff(id),       -- 指定操作美容師/醫師
    treatment_id UUID REFERENCES items(id),
    room_id UUID REFERENCES resources(id),    -- 指定包廂
    machine_id UUID REFERENCES resources(id), -- 指定設備 (可為空)
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED',   -- 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 療程核銷履歷
CREATE TABLE package_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    package_id UUID REFERENCES member_packages(id),
    consumed_quota INT DEFAULT 1,
    operator_staff_id UUID REFERENCES staff(id),
    customer_signature_url TEXT, -- 顧客數位簽署圖檔
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. 關鍵核心業務邏輯與演算法

### 4.1 三維資源「零衝突」預約檢查演算法

預約醫美療程需要鎖定：**人員（美容師）、空間（獨立包廂）、機台（雷射儀器）**。任一資源在目標時間區間（含前後消毒緩衝時間 $buffer\_min$）重疊皆不可預約。

* **演算法驗證條件 (PostgreSQL 衝突查詢)**：
  給定請求時間區間 $[T_{start}, T_{end}]$，檢查目標資源是否已存在重疊的有效預約：
  
  $$\text{Overlap Condition: } (\text{start\_time} < T_{end}) \land (\text{end\_time} > T_{start})$$

* **高並發（Concurrency）防重覆寫入機制**：
  使用 Redis 分散式鎖（Redlock），以資源 ID 為 Key，TTL 設為 10 秒：
  ```
  Key: lock:appointment:staff:{staff_id}:{YYYYMMDD}
  Key: lock:appointment:resource:{machine_id}:{YYYYMMDD}
  ```
  在資料庫層級使用 `SERIALIZABLE` 隔離層級或搭配資料庫排他鎖 `SELECT ... FOR UPDATE` 確保極端情況下不會超額排程。

### 4.2 耗材先進先出（FIFO）自動扣減邏輯

當單筆預約核銷完成（Status -> `COMPLETED`）時觸發資料庫交易：

1. 根據療程 ID 查詢 `treatment_bom` 獲取所需耗材與數量 $Q_{need}$。
2. 查詢該品項之 `inventory_batches`：
   ```sql
   SELECT * FROM inventory_batches 
   WHERE item_id = :item_id AND stock_quantity > 0 AND expiry_date >= CURRENT_DATE
   ORDER BY expiry_date ASC, created_at ASC 
   FOR UPDATE;
   ```
3. 依序遞減各批次庫存直至 $Q_{need} = 0$。若所有未過期批次總量不足，寫入警報日誌並標註管理端通知。

---

## 5. API 介面規格設計 (RESTful API)

### 5.1 顧客端 (LINE LIFF Client)

#### `GET /api/v1/client/slots`
查詢指定日期、美容師與療程項目的可預約空檔。
* **Request Query**:
  * `treatment_id`: UUID
  * `date`: YYYY-MM-DD
  * `staff_id`: UUID (選填，不指定則由系統自動分配)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "date": "2026-03-15",
    "available_slots": [
      { "start_time": "13:00", "end_time": "14:15", "available": true },
      { "start_time": "14:30", "end_time": "15:45", "available": false, "reason": "STAFF_UNAVAILABLE" },
      { "start_time": "16:00", "end_time": "17:15", "available": true }
    ]
  }
  ```

#### `POST /api/v1/client/appointments`
送出預約申請。
* **Request Header**: `Authorization: Bearer <LIFF_JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "treatment_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "staff_id": "3c90c3cc-0d44-4b50-8888-88d000888888",
    "start_time": "2026-03-15T13:00:00+08:00",
    "health_questionnaire": {
      "has_retinoids_use": false,
      "is_pregnant": false,
      "recent_sun_exposure": false
    }
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "appointment_id": "7a3fa0b1-...",
    "appointment_no": "APT-20260315-0012",
    "status": "CONFIRMED"
  }
  ```

---

### 5.2 後台管理端 (Admin POS & Operations)

#### `POST /api/v1/admin/orders/checkout`
現場建立訂單與核銷結帳。
* **Request Body**:
  ```json
  {
    "member_id": "UUID",
    "items": [
      { "item_id": "UUID", "quantity": 1, "custom_price": 12000 }
    ],
    "payments": [
      { "method": "WALLET", "amount": 5000 },
      { "method": "CREDIT_CARD", "amount": 7000 }
    ],
    "sales_split": [
      { "staff_id": "UUID", "percentage": 50 },
      { "staff_id": "UUID", "percentage": 50 }
    ]
  }
  ```

#### `POST /api/v1/admin/appointments/{id}/consume`
核銷預約與扣除堂數。
* **Request Body**:
  ```json
  {
    "package_id": "UUID",
    "signature_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "operator_staff_id": "UUID"
  }
  ```

---

## 6. LINE Bot 自動化任務排程引擎架構

使用 **BullMQ + Redis** 實作可靠的時間戳佇列（Delayed Job Queue），防止單一伺服器重啟造成通知遺失。

```
[ 預約建立 (APT-001) ]
       │
       ├──► 任務 A: 立即發送 [預約成功通知] ──► LINE Push API
       │
       ├──► 任務 B: 預約前 24 小時 [防爽約提醒 + 確認按鈕] (Delay Job)
       │
       ├──► 任務 C: 術後第 3 天 [修復關懷 + 滿意度調查問卷] (Delay Job)
       │
       └──► 任務 D: 術後第 21 天 [療程維護提醒] (Delay Job)
```

### 關鍵程式實作範例 (NestJS / BullMQ 任務定義)

```typescript
// appointment-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AppointmentSchedulerService {
  constructor(@InjectQueue('line-notification') private notificationQueue: Queue) {}

  async scheduleAppointmentNotifications(appointment: any) {
    const startTime = new Date(appointment.start_time).getTime();
    const now = Date.now();

    // 1. 24小時前提醒 (提早 86400 秒)
    const reminderDelay = startTime - 24 * 60 * 60 * 1000 - now;
    if (reminderDelay > 0) {
      await this.notificationQueue.add(
        'SEND_PRE_TREATMENT_REMINDER',
        { appointmentId: appointment.id, memberId: appointment.member_id },
        { delay: reminderDelay, jobId: `pre-remind-${appointment.id}` }
      );
    }

    // 2. 術後 3 天修護關懷 (療程結束後 3 * 86400 秒)
    const postCareDelay = startTime + 3 * 24 * 60 * 60 * 1000 - now;
    await this.notificationQueue.add(
      'SEND_POST_TREATMENT_CARE',
      { appointmentId: appointment.id, memberId: appointment.member_id },
      { delay: postCareDelay, jobId: `post-care-${appointment.id}` }
    );
  }

  async cancelScheduledNotifications(appointmentId: string) {
    // 預約取消時，自動移除尚未執行的延遲任務
    const job = await this.notificationQueue.getJob(`pre-remind-${appointmentId}`);
    if (job) await job.remove();
  }
}
```

---

## 7. 隱私安全與合規機制 (Data Privacy & Compliance)

1. **病歷與術前術後照片隱私加密**：
   * 術前/術後對比照片上傳至 S3/R2 時，強制啟用 `SSE-S3` 或 `SSE-KMS` 伺服器端靜態加密。
   * 照片 URL 不使用公開路徑，前端必須透過具有短時效性（15 分鐘）的 `Presigned URL` 讀取。
2. **個資去識別化（Data Masking）**：
   * 後台非店長權限者，列表頁手機號碼一律脫敏顯示（例：`0912-***-678`）。
3. **醫療法規合規留存**：
   * 顧客線上簽署的術前健康告知書與同意書，核銷當下即時轉為 PDF 並計算 SHA-256 雜湊碼存入稽核記錄（Audit Log），以防事後篡改。

---

## 8. 專案部署與 CI/CD 策略

* **Containerization**：全系統包含 API、Worker、前端採 Docker 容器化打包。
* **CI/CD Pipeline**：GitHub Actions 自動化測試（單元測試、排程防衝突 Integration Test）、自動發佈映像檔至 AWS ECR / GCP Artifact Registry。
* **監控日誌**：串接 Sentry 捕獲前端/後端錯誤，搭配 Prometheus + Grafana 監控 API 延遲與 Redis 佇列健康狀態。