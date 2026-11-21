-- =============================================================================
-- 沐光美學 Light Clinic - 醫美工作室預約與營運管理系統
-- PostgreSQL 16+ Database Schema & Initial Seed Data
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 會員主檔 (Members)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code VARCHAR(20) UNIQUE NOT NULL,
    line_user_id VARCHAR(64) UNIQUE,
    full_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(10),
    birthday DATE,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00, -- 儲值金
    total_spent NUMERIC(12, 2) DEFAULT 0.00,    -- 累積消費額
    preferred_staff_id UUID,
    tags JSONB DEFAULT '[]'::jsonb,             -- 標籤如 ["易反黑", "怕痛", "主推水光針"]
    medical_notes JSONB DEFAULT '{}'::jsonb,    -- 過敏史、酸類與雷射經驗、特殊禁忌症
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 空間與設備資源（用於防呆衝突排程）(Resources: ROOM / MACHINE)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'ROOM' (包廂) 或 'MACHINE' (特定儀器如皮秒、海菲秀)
    sub_type VARCHAR(30),      -- 例如 'MACHINE_PICOWAY', 'MACHINE_HYDRAFACIAL'
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. 員工主檔 (Staff)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    title VARCHAR(50),
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'DOCTOR', 'BEAUTICIAN', 'CONSULTANT'
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. 療程項目與零售品項 (Items)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'TREATMENT' (療程), 'PRODUCT' (零售耗材), 'CONSUMABLE' (醫療耗材)
    duration_min INT DEFAULT 60, -- 療程所需時間（分）
    buffer_min INT DEFAULT 15,   -- 術後清消緩衝時間（分）
    price NUMERIC(10, 2) NOT NULL,
    trial_price NUMERIC(10, 2),
    package_sessions INT DEFAULT 1,
    safety_stock INT DEFAULT 10,
    unit VARCHAR(10) DEFAULT '次',
    required_resource_type VARCHAR(30), -- 綁定設備需求 (例如: 'MACHINE_PICOWAY')
    description TEXT
);

-- 5. 耗材庫存批號（支援先進先出 FIFO 與效期預警）(Inventory Batches)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    batch_no VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL,
    cost_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 療程消耗耗材配方（BOM: 結案時自動扣庫存）(Treatment BOM)
CREATE TABLE IF NOT EXISTS treatment_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID REFERENCES items(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    deduct_quantity INT NOT NULL DEFAULT 1
);

-- 7. 顧客已購療程堂數包 (Treatment Packages)
CREATE TABLE IF NOT EXISTS member_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_no VARCHAR(30) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES items(id),
    treatment_name VARCHAR(100) NOT NULL,
    total_quota INT NOT NULL,     -- 總購買堂數
    remaining_quota INT NOT NULL, -- 剩餘堂數
    last_consumed_at DATE,
    last_operator_name VARCHAR(50),
    expire_at DATE,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 預約記錄主表 (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_no VARCHAR(32) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id),
    staff_id UUID REFERENCES staff(id),       -- 指定操作美容師/醫師
    treatment_id UUID REFERENCES items(id),
    room_id UUID REFERENCES resources(id),    -- 指定包廂
    machine_id UUID REFERENCES resources(id), -- 指定設備 (可為空)
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    buffer_end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 含術後清消緩衝結束時間
    status VARCHAR(20) DEFAULT 'CONFIRMED',   -- 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    health_questionnaire JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 療程核銷履歷與防竄改簽章稽核 (Package Consumptions & Compliance Audit)
CREATE TABLE IF NOT EXISTS package_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    package_id UUID REFERENCES member_packages(id),
    consumed_quota INT DEFAULT 1,
    operator_staff_id UUID REFERENCES staff(id),
    customer_signature_url TEXT,      -- 顧客數位簽署圖檔 (Base64 / Presigned S3 URL)
    consent_sha256_hash VARCHAR(64),  -- SHA-256 雜湊碼防事後篡改
    fifo_deductions JSONB DEFAULT '[]'::jsonb, -- 自動扣減的耗材批號明細
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 訂單與業績拆分主表 (POS Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(32) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    items JSONB NOT NULL,
    payments JSONB NOT NULL,
    sales_split JSONB NOT NULL,
    receipt_pushed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 智慧候位清單 (Waitlist Engine)
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    treatment_id UUID REFERENCES items(id),
    preferred_staff_id UUID REFERENCES staff(id),
    target_date DATE NOT NULL,
    preferred_slot VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'WAITING', -- 'WAITING', 'NOTIFIED_15MIN', 'CLAIMED', 'EXPIRED'
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引優化：加速三維資源衝突檢查與 FIFO 效期排序
CREATE INDEX IF NOT EXISTS idx_appointments_time_range ON appointments (start_time, buffer_end_time) WHERE status NOT IN ('CANCELLED', 'NO_SHOW');
CREATE INDEX IF NOT EXISTS idx_inventory_fifo ON inventory_batches (item_id, expiry_date ASC, created_at ASC) WHERE stock_quantity > 0;

