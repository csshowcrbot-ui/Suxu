# 沐光美學診所 MUKO CLINIC — 預約與營運管理系統

> **全預約制・獨立包廂診療 ｜ 電子病歷・療程核銷・耗材批號・LINE 術後關懷整合管理系統**

本專案為專為醫美工作室、輕醫美診所與皮膚管理中心打造的全方位預約與營運管理平台，採日式私密美學設計語彙（和紙白、墨茶色、香檳白金），整合 **顧客端（LINE LIFF 線上預約與票夾）** 與 **後台管理端（RWD 營運管理系統）**，並支援雙端即時同步連動檢視。

---

## 核心功能一覽

### 1. 雙身分登入入口 (`LoginView`)
- **診所人員登入（後台管理端）**：支援帳號密碼驗證、密碼顯示切換，並內建多角色一鍵體驗帳號（系統管理員、主治醫師、皮膚管理師、諮詢顧問）。
- **貴賓會員入口（顧客端 LINE LIFF）**：支援「LINE 帳號一鍵快速登入」與「手機號碼 + 生日月日驗證登入」。
- 登入後依角色自動導向對應工作區，並於頂部導覽列顯示目前登入身分與安全登出按鈕。

### 2. 顧客端 LINE LIFF 介面 (`ClientLiffView`)
- **線上預約**：即時選擇療程項目、指定操作師與日期時段，並與後台三維防呆引擎即時連動查詢空檔；滿檔時支援一鍵登記智慧候位。
- **我的療程票夾**：查看剩餘儲值金、進行中療程包套堂數，並出示專屬核銷 QR Code。
- **術前健康評估與數位同意書**：內建過敏史與禁忌症問卷，搭配手寫簽名板（`SignaturePad`）產生 SHA-256 數位簽署存證。
- **術後關懷與通知**：檢視預約確認通知、術後第 3／7 天關懷提醒，並支援回報「確認出席」或「紅腫不適」即時通報櫃檯。

### 3. 後台營運管理系統 (`AdminDashboardView`)
1. **營運儀表板（Overview）**：當日預約流、即時營收統計、耗材效期與安全庫存預警總覽。
2. **會員病歷與檔案（Member CRM）**：
   - 支援於會員詳情頁頂部與會員名簿總覽頁進行**即時會員搜尋**（可依姓名、電話、會員編號、標籤、偏好操作師篩選）。
   - 提供個資脫敏權限切換（一般人員／店長權限）、新增會員建檔、療程堂數核銷（連動手寫簽名與 FIFO 耗材扣帳）、消費紀錄與同意書憑證檢視。
3. **療程買賣與結帳（POS）**：
   - 支援可搜尋客戶選單、複合式付款（儲值金扣款、信用卡、現金、LINE Pay／轉帳）、訂金扣抵與多品項結算。
   - 內建諮詢顧問與操作老師之業績抽成比例拆分。
4. **預約排程看板（Schedule Board）**：
   - **三視圖即時切換**：
     - **日視圖（Daily Timeline）**：當日預約摘要指標與時間軸詳情清單。
     - **週視圖（Weekly Calendar）**：本週七日行事曆總覽，標註今日與每日預約筆數。
     - **包廂視圖（Room Gantt）**：獨立包廂與儀器甘特排程表，自動標示 15 分鐘清消緩衝與設備鎖定狀態。
   - **三維零衝突防呆引擎**：改期、換包廂或快速代客預約時，自動檢驗「操作師、獨立包廂、雷射機台」三維資源不衝突。
   - **獨立診療包廂管理**：支援新增獨立包廂與刪除包廂（內建有效預約防呆攔截）。
   - **診所操作老師與醫師團隊管理**：支援新增操作老師／醫師／諮詢顧問，以及啟用或暫停排班狀態。
   - **智慧候位清單**：取消預約時自動回收未發送 LINE 任務，並推播限時 15 分鐘優先認領通知給候補顧客。
5. **耗材庫存與批號管理（Inventory & Lot）**：
   - 支援 **FIFO 先進先出** 批號管理、到期前 60 天效期預警、安全庫存不足警示與盤點匯出 CSV。
   - **新增產品／耗材／療程品項**：可自由建立醫療耗材（選填首批入庫批號）、零售產品與美學療程。
   - **療程標準耗材配方（Treatment BOM）**：支援新增、調整與移除各療程的自動扣減耗材配方，並即時顯示**個別耗材費用小計**、**單堂耗材費用合計**與**療程定價／單堂均價**。
6. **LINE 自動化排程引擎（LINE Concierge）**：管理行前提醒、術後追蹤推播與顧客異常回饋電訪警報。

---

## 技術堆疊

| 類別 | 技術與套件 |
| :--- | :--- |
| **前端框架** | Next.js 15 (`15.1.11`, App Router) + React 19 + TypeScript 5 |
| **樣式與設計系統** | Tailwind CSS 3.4 + Lucide React Icons |
| **字型系統** | `Noto Sans TC`、`Noto Serif TC`、`Cormorant Garamond` |
| **資料層與排程引擎** | 記憶體狀態資料庫（`src/lib/db.ts`，支援一鍵重置範例資料）＋ 附完整 PostgreSQL Schema（`database/schema.sql`）與 Docker Compose（PostgreSQL 16 + Redis 7） |

---

## 專案目錄結構

```text
Suxu/
├── src/
│   ├── app/
│   │   ├── layout.tsx                              # 根版面與 Google Fonts / Hydration 設定
│   │   ├── globals.css                             # 全域樣式與日式卡片樣式 (.jp-card)
│   │   ├── page.tsx                                # 主入口（登入狀態管理、雙端切換與通知橫幅）
│   │   └── api/v1/
│   │       ├── state/route.ts                      # 系統狀態查詢與各項後台管理操作 API
│   │       ├── client/slots/route.ts               # 顧客端即時空檔查詢 API
│   │       ├── client/appointments/route.ts        # 顧客端／代客建立預約 API
│   │       └── admin/
│   │           ├── orders/checkout/route.ts        # POS 複合結帳開單 API
│   │           └── appointments/[id]/consume/route.ts # 療程堂數核銷與 FIFO 耗材扣帳 API
│   ├── components/
│   │   ├── LoginView.tsx                           # 診所人員／貴賓會員雙模式登入畫面
│   │   ├── AdminDashboardView.tsx                  # 後台管理端六大營運模組
│   │   ├── ClientLiffView.tsx                      # 顧客端 LINE LIFF 行動端介面
│   │   ├── MemberSearchSelect.tsx                  # 可即時搜尋之會員下拉選單元件
│   │   └── SignaturePad.tsx                        # 數位同意書手寫簽名板
│   └── lib/
│       ├── db.ts                                   # 系統型別定義與初始範例資料庫
│       └── engine.ts                               # 三維排程防呆引擎、個資脫敏與效期計算
├── backend/
│   └── appointment-scheduler.service.ts            # 排程服務參考實作
├── database/
│   └── schema.sql                                  # PostgreSQL 資料庫結構定義
├── docker-compose.yml                              # PostgreSQL + Redis + App 容器編排檔
├── ui_ux.md                                        # UI/UX 設計規範與線框文件
├── tailwind.config.ts                              # 日式美學色彩與字型 Token 設定
└── package.json
```

---

## 快速開始（本機開發）

### 環境需求
- Node.js `>= 18.18`（建議使用 Node.js 20 LTS）
- npm `>= 9`

### 安裝與啟動
```bash
# 1. 安裝相依套件
npm install

# 2. 啟動開發伺服器
npm run dev
```

啟動後請於瀏覽器開啟：[http://localhost:3000](http://localhost:3000)

> **Windows PowerShell 提示**：若系統執行原則（ExecutionPolicy）封鎖 `npm.ps1`，可使用 `cmd /c "npm run dev"` 啟動。

### 常用指令
```bash
npm run dev     # 啟動本機開發伺服器 (http://localhost:3000)
npm run build   # 建置正式環境檔案並執行型別檢查
npm run start   # 啟動正式環境伺服器
npm run lint    # 執行 ESLint 程式碼檢查
```

---

## 預設體驗帳號

### 診所人員（後台管理端）
所有體驗帳號預設密碼皆為 **`muko2026`**（登入畫面亦提供一鍵帶入按鈕）：

| 顯示身分 | 登入帳號 | 角色權限 |
| :--- | :--- | :--- |
| 系統管理員 | `admin@muko.tw` | 診所營運總監（`ADMIN`） |
| Leo 醫師 | `leo@muko.tw` | 雷射微整主治醫師（`DOCTOR`） |
| Anna 老師 | `anna@muko.tw` | 首席皮膚管理師（`BEAUTICIAN`） |
| Vivian 顧問 | `vivian@muko.tw` | 資深醫美諮詢師（`CONSULTANT`） |

### 貴賓會員（顧客端 LINE LIFF）
- **LINE 一鍵登入**：直接以 VIP 會員 **林雅婷（`M-20260312`）** 進入顧客端。
- **手機驗證登入**：手機 `0912-345-678` ／ 生日月日 `0518`。

---

## API 端點說明

| 方法 | 路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/state` | 取得完整系統即時狀態（會員、預約、包廂、人員、庫存、配方、訂單、LINE 任務） |
| `POST` | `/api/v1/state` | 依 `action` 執行管理操作：`RESET_DEMO`、`CREATE_MEMBER`、`UPDATE_MEMBER`、`RESCHEDULE_APPOINTMENT`、`CANCEL_APPOINTMENT`、`ADD_WAITLIST`、`ADD_INVENTORY_BATCH`、`CREATE_CATALOG_ITEM`、`ADD_TREATMENT_BOM`、`DELETE_TREATMENT_BOM`、`CREATE_STAFF`、`TOGGLE_STAFF_ACTIVE`、`CREATE_ROOM`、`DELETE_ROOM`、`TRIGGER_LINE_JOB` |
| `GET` | `/api/v1/client/slots` | 查詢指定日期、療程與操作師之三維可用時段 |
| `POST` | `/api/v1/client/appointments` | 建立預約（含三維資源鎖定與衝突檢核） |
| `POST` | `/api/v1/admin/orders/checkout` | POS 複合結帳開單與業績抽成計算 |
| `POST` | `/api/v1/admin/appointments/[id]/consume` | 核銷療程堂數並依 Treatment BOM 執行 FIFO 耗材自動扣帳 |

---

## 部署至 Railway 與 LINE Login 設定

### Railway 部署
1. 將本儲存庫推送至 GitHub。
2. 於 [Railway](https://railway.app/) 建立新專案並連結此 GitHub 儲存庫。
3. Railway 會自動偵測 Next.js 專案並執行 `npm run build` 與 `npm run start`。

### 串接正式 LINE 帳號登入（選配）
若要將登入畫面的「使用 LINE 帳號一鍵登入」從體驗模式切換為正式 LINE OAuth / LIFF 授權：
1. 前往 [LINE Developers Console](https://developers.line.biz/console/) 建立 **LINE Login** Channel 並將狀態切換為 **Published**。
2. 於 **LINE Login → Callback URL** 填入 `https://<您的Railway網域>/api/auth/line/callback`（或在 **LIFF** 頁籤建立 LIFF App）。
3. 於 Railway 環境變數（Variables）設定：
   ```env
   LINE_CHANNEL_ID=您的_Channel_ID
   LINE_CHANNEL_SECRET=您的_Channel_Secret
   NEXT_PUBLIC_APP_URL=https://您的Railway網域
   NEXT_PUBLIC_LINE_LIFF_ID=您的_LIFF_ID
   ```

---

## 設計系統規範（Design Tokens）

- **主色（Primary）**：日式香檳白金 `#B89B72`（`roseGold`）
- **輔助色（Secondary）**：墨茶色 `#2C2A29`（`graphite`）
- **背景底色（Background）**：和紙白 `#FAF8F5`（`ivory`）與純白 `#FFFFFF`
- **狀態色**：抹茶青磁 `#5B7A63`（成功）、琥珀茶 `#C2844F`（警告）、茜紅 `#B55A52`（錯誤）、LINE 品牌綠 `#06C755`

---

© 2026 沐光美學診所 MUKO CLINIC Aesthetics.
