import crypto from "crypto";

export interface Member {
  id: string;
  member_code: string;
  line_user_id: string;
  full_name: string;
  phone: string;
  gender: string;
  age: number;
  birthday: string;
  wallet_balance: number;
  total_spent: number;
  preferred_staff_id: string;
  preferred_staff_name: string;
  tags: string[];
  medical_notes: {
    allergies: string;
    laser_experience: string;
    has_retinoids_use: boolean;
    is_pregnant: boolean;
    recent_sun_exposure: boolean;
    special_notes: string;
  };
  skin_logs: SkinLog[];
  consent_records: ConsentRecord[];
}

export interface SkinLog {
  id: string;
  date_before: string;
  date_after: string;
  treatment_name: string;
  operator_name: string;
  pore_score_before: number;
  pore_score_after: number;
  pigment_score_before: number;
  pigment_score_after: number;
  hydration_before: number;
  hydration_after: number;
  summary: string;
}

export interface ConsentRecord {
  id: string;
  title: string;
  signed_at: string;
  sha256_hash: string;
  signature_data_url: string;
  questionnaire: {
    has_retinoids_use: boolean;
    is_pregnant: boolean;
    recent_sun_exposure: boolean;
  };
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  type: "ROOM" | "MACHINE";
  sub_type?: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  phone: string;
  role: "ADMIN" | "DOCTOR" | "BEAUTICIAN" | "CONSULTANT";
  is_active: boolean;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  type: "TREATMENT" | "PRODUCT" | "CONSUMABLE";
  duration_min: number;
  buffer_min: number;
  price: number;
  trial_price?: number;
  package_sessions?: number;
  safety_stock?: number;
  unit: string;
  required_resource_type: string | null;
  description: string;
}

export interface InventoryBatch {
  id: string;
  item_id: string;
  item_name: string;
  unit: string;
  safety_stock: number;
  batch_no: string;
  expiry_date: string;
  stock_quantity: number;
  cost_price: number;
  created_at: string;
}

export interface TreatmentBOM {
  id: string;
  treatment_id: string;
  inventory_item_id: string;
  inventory_item_name: string;
  deduct_quantity: number;
  unit: string;
}

export interface MemberPackage {
  id: string;
  package_no: string;
  member_id: string;
  treatment_id: string;
  treatment_name: string;
  total_quota: number;
  remaining_quota: number;
  last_consumed_at: string;
  last_operator_name: string;
  expire_at: string;
}

export interface Appointment {
  id: string;
  appointment_no: string;
  member_id: string;
  member_name: string;
  staff_id: string;
  staff_name: string;
  treatment_id: string;
  treatment_name: string;
  room_id: string;
  room_name: string;
  machine_id: string | null;
  machine_name: string | null;
  date: string; // YYYY-MM-DD
  start_time: string; // ISO or HH:mm
  end_time: string; // HH:mm (treatment end)
  buffer_end_time: string; // HH:mm (including disinfection buffer)
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  health_questionnaire?: {
    has_retinoids_use: boolean;
    is_pregnant: boolean;
    recent_sun_exposure: boolean;
  };
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface PackageConsumption {
  id: string;
  appointment_id: string;
  package_id: string;
  package_no: string;
  member_id: string;
  member_name: string;
  treatment_name: string;
  consumed_quota: number;
  operator_staff_id: string;
  operator_name: string;
  customer_signature_url: string;
  sha256_hash: string;
  fifo_deductions: {
    batch_no: string;
    item_name: string;
    deducted: number;
    remaining_in_batch: number;
  }[];
  consumed_at: string;
}

export interface OrderRecord {
  id: string;
  order_no: string;
  member_id: string;
  member_name: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  items: {
    item_id: string;
    name: string;
    quantity: number;
    custom_price: number;
  }[];
  payments: {
    method: "WALLET" | "CREDIT_CARD" | "CASH" | "LINE_PAY";
    amount: number;
  }[];
  sales_split: {
    staff_id: string;
    staff_name: string;
    percentage: number;
    commission_amount: number;
  }[];
  created_at: string;
}

export interface LineNotificationJob {
  id: string;
  job_id: string;
  type:
    | "SEND_BOOKING_CONFIRMED"
    | "SEND_PRE_TREATMENT_REMINDER"
    | "SEND_POST_TREATMENT_CARE"
    | "SEND_MAINTENANCE_DAY21"
    | "SEND_WAITLIST_RELEASE"
    | "SEND_POS_RECEIPT";
  label: string;
  appointment_id?: string;
  appointment_no?: string;
  member_id: string;
  member_name: string;
  scheduled_for: string;
  status: "SENT" | "SCHEDULED" | "CANCELLED" | "ALERT_CALLBACK";
  message_preview: string;
  customer_feedback?: string;
}

export interface WaitlistEntry {
  id: string;
  member_id: string;
  member_name: string;
  treatment_id: string;
  treatment_name: string;
  staff_id: string;
  staff_name: string;
  date: string;
  slot_time: string;
  status: "WAITING" | "NOTIFIED_15M" | "CLAIMED";
  created_at: string;
}

export interface DatabaseState {
  referenceDate: string; // Default '2026-03-12' to match wireframe & allow date switching
  members: Member[];
  resources: Resource[];
  staff: Staff[];
  items: CatalogItem[];
  inventory_batches: InventoryBatch[];
  treatment_bom: TreatmentBOM[];
  member_packages: MemberPackage[];
  appointments: Appointment[];
  package_consumptions: PackageConsumption[];
  orders: OrderRecord[];
  line_jobs: LineNotificationJob[];
  waitlist: WaitlistEntry[];
  redis_locks: Record<string, number>;
}

const initialData: DatabaseState = {
  referenceDate: "2026-03-12",
  members: [
    {
      id: "m-101",
      member_code: "M-20260312",
      line_user_id: "U881290a7b1f09",
      full_name: "林雅婷",
      phone: "0912-345-678",
      gender: "女性",
      age: 29,
      birthday: "1997-05-18",
      wallet_balance: 12500,
      total_spent: 78000,
      preferred_staff_id: "staff-anna",
      preferred_staff_name: "Anna 老師",
      tags: ["易反黑", "怕痛", "主推水光針"],
      medical_notes: {
        allergies: "對高濃度酒精保養品微泛紅，無麻藥過敏史",
        laser_experience: "2026/01、2026/02 已施作蜂巢皮秒 2 次，術後退紅正常",
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
        special_notes: "敷麻時間建議滿 25 分鐘，額頭部位能量調降 10%",
      },
      skin_logs: [
        {
          id: "skin-01",
          date_before: "2026/01/15 術前",
          date_after: "2026/01/22 術後7天",
          treatment_name: "皮秒雷射蜂巢聚焦方案 (第 1 堂)",
          operator_name: "Anna 老師",
          pore_score_before: 62,
          pore_score_after: 86,
          pigment_score_before: 58,
          pigment_score_after: 84,
          hydration_before: 49,
          hydration_after: 82,
          summary: "兩頰毛孔細緻度提升 38%，顴骨淺層曬斑明顯淡化，角質保水度大幅回升。",
        },
        {
          id: "skin-02",
          date_before: "2026/02/10 術前",
          date_after: "2026/02/17 術後7天",
          treatment_name: "皮秒雷射蜂巢聚焦方案 (第 2 堂)",
          operator_name: "Anna 老師",
          pore_score_before: 79,
          pore_score_after: 92,
          pigment_score_before: 76,
          pigment_score_after: 91,
          hydration_before: 74,
          hydration_after: 89,
          summary: "鼻翼兩側粉刺與毛孔收斂穩定，膚色均勻透亮，無反黑跡象。",
        },
      ],
      consent_records: [
        {
          id: "cs-101",
          title: "皮秒蜂巢雷射術前健康評估與知情同意書",
          signed_at: "2026/02/10 12:50",
          sha256_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
          signature_data_url: "SIGNED_BY_LIN_YA_TING",
          questionnaire: {
            has_retinoids_use: false,
            is_pregnant: false,
            recent_sun_exposure: false,
          },
        },
      ],
    },
    {
      id: "m-102",
      member_code: "M-20260218",
      line_user_id: "U992310b4c2d11",
      full_name: "王心如",
      phone: "0933-812-904",
      gender: "女性",
      age: 34,
      birthday: "1992-09-14",
      wallet_balance: 26000,
      total_spent: 112000,
      preferred_staff_id: "staff-leo",
      preferred_staff_name: "Leo 醫師",
      tags: ["VIP高單", "定期保養", "皮秒蜂巢"],
      medical_notes: {
        allergies: "無已知過敏史",
        laser_experience: "定期每個月施作皮秒與緊緻保養",
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
        special_notes: "偏好安靜獨立包廂，術後需加強冰敷鎮定",
      },
      skin_logs: [
        {
          id: "skin-03",
          date_before: "2026/02/01 術前",
          date_after: "2026/02/08 術後7天",
          treatment_name: "蜂巢皮秒撫紋美白",
          operator_name: "Leo 醫師",
          pore_score_before: 70,
          pore_score_after: 90,
          pigment_score_before: 68,
          pigment_score_after: 88,
          hydration_before: 65,
          hydration_after: 85,
          summary: "眼周細紋與暗沉改善明顯，膠原飽滿度佳。",
        },
      ],
      consent_records: [],
    },
    {
      id: "m-103",
      member_code: "M-20260105",
      line_user_id: "U771209c8d3e44",
      full_name: "趙小萱",
      phone: "0958-221-109",
      gender: "女性",
      age: 26,
      birthday: "2000-02-20",
      wallet_balance: 3200,
      total_spent: 19800,
      preferred_staff_id: "staff-mika",
      preferred_staff_name: "Mika 老師",
      tags: ["油痘肌", "藻針煥膚"],
      medical_notes: {
        allergies: "無",
        laser_experience: "以酸類與藻針代謝粉刺為主",
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
        special_notes: "下巴閉鎖性粉刺較多，術後搭配舒緩鎮定凍膜",
      },
      skin_logs: [],
      consent_records: [],
    },
    {
      id: "m-104",
      member_code: "M-20260301",
      line_user_id: "U660198e2f1a08",
      full_name: "張家豪",
      phone: "0920-667-331",
      gender: "男性",
      age: 31,
      birthday: "1995-11-03",
      wallet_balance: 8000,
      total_spent: 32000,
      preferred_staff_id: "staff-anna",
      preferred_staff_name: "Anna 老師",
      tags: ["毛孔粗大", "海菲秀"],
      medical_notes: {
        allergies: "無",
        laser_experience: "首次體驗海菲秀毛孔調理",
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
        special_notes: "T字部位出油旺盛，加強渦旋吸淨",
      },
      skin_logs: [],
      consent_records: [],
    },
  ],
  resources: [
    {
      id: "room-1",
      code: "RM-VIP01",
      name: "包廂 1 (VIP海菲秀)",
      type: "ROOM",
      is_active: true,
    },
    {
      id: "room-2",
      code: "RM-LASER02",
      name: "包廂 2 (雷射專用)",
      type: "ROOM",
      is_active: true,
    },
    {
      id: "room-3",
      code: "RM-CARE03",
      name: "包廂 3 (美容美睫)",
      type: "ROOM",
      is_active: true,
    },
    {
      id: "mac-picoway",
      code: "EQ-PICO-A",
      name: "皮秒機台 A",
      type: "MACHINE",
      sub_type: "MACHINE_PICOWAY",
      is_active: true,
    },
    {
      id: "mac-hydra",
      code: "EQ-HYDRA-A",
      name: "海菲秀機台 A",
      type: "MACHINE",
      sub_type: "MACHINE_HYDRAFACIAL",
      is_active: true,
    },
    {
      id: "mac-meso",
      code: "EQ-MESO-A",
      name: "水光微針儀 A",
      type: "MACHINE",
      sub_type: "MACHINE_MESO",
      is_active: true,
    },
  ],
  staff: [
    {
      id: "staff-anna",
      name: "Anna 老師",
      title: "首席皮膚管理師",
      phone: "0911-222-333",
      role: "BEAUTICIAN",
      is_active: true,
    },
    {
      id: "staff-leo",
      name: "Leo 醫師",
      title: "雷射微整主治醫師",
      phone: "0911-555-666",
      role: "DOCTOR",
      is_active: true,
    },
    {
      id: "staff-mika",
      name: "Mika 老師",
      title: "高階煥膚護理師",
      phone: "0911-777-888",
      role: "BEAUTICIAN",
      is_active: true,
    },
    {
      id: "staff-vivian",
      name: "Vivian 顧問",
      title: "資深醫美諮詢師",
      phone: "0911-999-000",
      role: "CONSULTANT",
      is_active: true,
    },
  ],
  items: [
    {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      sku: "TRT-HYDRA-03",
      name: "海菲秀深層水潤方案 (3堂)",
      category: "深層毛孔與補水",
      type: "TREATMENT",
      duration_min: 75,
      buffer_min: 15,
      price: 12000,
      trial_price: 1999,
      package_sessions: 3,
      unit: "堂",
      required_resource_type: "MACHINE_HYDRAFACIAL",
      description: "專利渦旋水飛梭探頭溫和代謝老廢角質、黑頭粉刺，同時導入高濃度保濕玻尿酸精華。",
    },
    {
      id: "trt-picoway-06",
      sku: "TRT-PICO-06",
      name: "皮秒雷射蜂巢聚焦方案 (6堂)",
      category: "雷射光療淨白",
      type: "TREATMENT",
      duration_min: 60,
      buffer_min: 15,
      price: 28800,
      trial_price: 3999,
      package_sessions: 6,
      unit: "堂",
      required_resource_type: "MACHINE_PICOWAY",
      description: "雙波長蜂巢聚焦透鏡擊碎深淺層黑色素，刺激真皮層膠原蛋白新生，改善毛孔與凹疤。",
    },
    {
      id: "trt-meso-04",
      sku: "TRT-MESO-04",
      name: "無創水光微針亮白方案 (4堂)",
      category: "水光注射保養",
      type: "TREATMENT",
      duration_min: 60,
      buffer_min: 15,
      price: 16800,
      trial_price: 2999,
      package_sessions: 4,
      unit: "堂",
      required_resource_type: "MACHINE_MESO",
      description: "定量定層導入小分子保濕玻尿酸與傳明酸原液，立即改善乾燥暗沉肌。",
    },
    {
      id: "trt-algae-01",
      sku: "TRT-ALGAE-01",
      name: "極淨藻針煥膚調理",
      category: "煥膚抗痘管理",
      type: "TREATMENT",
      duration_min: 60,
      buffer_min: 15,
      price: 2200,
      trial_price: 1680,
      package_sessions: 1,
      unit: "堂",
      required_resource_type: null,
      description: "微晶海綿骨針深入毛囊吸附多餘油脂，加速老廢角質更新，改善油痘粉刺肌。",
    },
    {
      id: "prd-mask-box",
      sku: "PRD-MASK-01",
      name: "術後保濕修護面膜 (1盒)",
      category: "居家醫美保養",
      type: "PRODUCT",
      duration_min: 0,
      buffer_min: 0,
      price: 800,
      unit: "盒",
      required_resource_type: null,
      description: "無酒精、無香料醫療級生物纖維修護面膜，雷射術後退紅必備。",
    },
    {
      id: "inv-ha",
      sku: "INV-HA-10ML",
      name: "保濕玻尿酸原液",
      category: "醫療級原液耗材",
      type: "CONSUMABLE",
      duration_min: 0,
      buffer_min: 0,
      price: 1200,
      safety_stock: 15,
      unit: "瓶",
      required_resource_type: null,
      description: "高純度無菌小分子玻尿酸導入安瓶",
    },
    {
      id: "inv-btx",
      sku: "INV-BTX-100U",
      name: "緊緻肉毒 100U",
      category: "微整針劑耗材",
      type: "CONSUMABLE",
      duration_min: 0,
      buffer_min: 0,
      price: 6500,
      safety_stock: 5,
      unit: "瓶",
      required_resource_type: null,
      description: "原廠冷鏈保存 100U 肉毒桿菌素凍晶注射劑",
    },
    {
      id: "inv-gel",
      sku: "INV-GEL-500G",
      name: "舒緩鎮定凍膜",
      category: "術後敷料耗材",
      type: "CONSUMABLE",
      duration_min: 0,
      buffer_min: 0,
      price: 450,
      safety_stock: 20,
      unit: "盒",
      required_resource_type: null,
      description: "含維生素 B5 與積雪草萃取之術後冰鎮修護凍膜",
    },
    {
      id: "inv-needle",
      sku: "INV-ND-STERILE",
      name: "無菌專用微針組",
      category: "拋棄式無菌耗材",
      type: "CONSUMABLE",
      duration_min: 0,
      buffer_min: 0,
      price: 350,
      safety_stock: 30,
      unit: "組",
      required_resource_type: null,
      description: "單次拋棄式 EO 滅菌微針探頭組",
    },
  ],
  inventory_batches: [
    {
      id: "batch-1",
      item_id: "inv-ha",
      item_name: "保濕玻尿酸原液",
      unit: "瓶",
      safety_stock: 15,
      batch_no: "HA-202511-01",
      expiry_date: "2026-04-15",
      stock_quantity: 12,
      cost_price: 480,
      created_at: "2025-11-10T09:00:00+08:00",
    },
    {
      id: "batch-2",
      item_id: "inv-btx",
      item_name: "緊緻肉毒 100U",
      unit: "瓶",
      safety_stock: 5,
      batch_no: "BTX-99420",
      expiry_date: "2026-03-30",
      stock_quantity: 5,
      cost_price: 3800,
      created_at: "2025-10-05T09:00:00+08:00",
    },
    {
      id: "batch-3",
      item_id: "inv-gel",
      item_name: "舒緩鎮定凍膜",
      unit: "盒",
      safety_stock: 20,
      batch_no: "CL-88210",
      expiry_date: "2027-08-10",
      stock_quantity: 48,
      cost_price: 190,
      created_at: "2026-01-12T09:00:00+08:00",
    },
    {
      id: "batch-4",
      item_id: "inv-needle",
      item_name: "無菌專用微針組",
      unit: "組",
      safety_stock: 30,
      batch_no: "ND-00412",
      expiry_date: "2028-01-01",
      stock_quantity: 80,
      cost_price: 120,
      created_at: "2026-01-20T09:00:00+08:00",
    },
  ],
  treatment_bom: [
    {
      id: "bom-1",
      treatment_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      inventory_item_id: "inv-ha",
      inventory_item_name: "保濕玻尿酸原液",
      deduct_quantity: 1,
      unit: "瓶",
    },
    {
      id: "bom-2",
      treatment_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      inventory_item_id: "inv-gel",
      inventory_item_name: "舒緩鎮定凍膜",
      deduct_quantity: 1,
      unit: "盒",
    },
    {
      id: "bom-3",
      treatment_id: "trt-picoway-06",
      inventory_item_id: "inv-ha",
      inventory_item_name: "保濕玻尿酸原液",
      deduct_quantity: 1,
      unit: "瓶",
    },
    {
      id: "bom-4",
      treatment_id: "trt-picoway-06",
      inventory_item_id: "inv-gel",
      inventory_item_name: "舒緩鎮定凍膜",
      deduct_quantity: 1,
      unit: "盒",
    },
    {
      id: "bom-5",
      treatment_id: "trt-meso-04",
      inventory_item_id: "inv-ha",
      inventory_item_name: "保濕玻尿酸原液",
      deduct_quantity: 1,
      unit: "瓶",
    },
    {
      id: "bom-6",
      treatment_id: "trt-meso-04",
      inventory_item_id: "inv-needle",
      inventory_item_name: "無菌專用微針組",
      deduct_quantity: 1,
      unit: "組",
    },
    {
      id: "bom-7",
      treatment_id: "trt-algae-01",
      inventory_item_id: "inv-gel",
      inventory_item_name: "舒緩鎮定凍膜",
      deduct_quantity: 1,
      unit: "盒",
    },
  ],
  member_packages: [
    {
      id: "pkg-8812",
      package_no: "PKG-8812",
      member_id: "m-101",
      treatment_id: "trt-picoway-06",
      treatment_name: "皮秒雷射蜂巢聚焦方案",
      total_quota: 6,
      remaining_quota: 4,
      last_consumed_at: "2026/02/10",
      last_operator_name: "Anna 老師",
      expire_at: "2027/02/10",
    },
    {
      id: "pkg-8905",
      package_no: "PKG-8905",
      member_id: "m-101",
      treatment_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      treatment_name: "海菲秀深層水潤方案",
      total_quota: 3,
      remaining_quota: 2,
      last_consumed_at: "2026/02/25",
      last_operator_name: "Anna 老師",
      expire_at: "2026/12/31",
    },
    {
      id: "pkg-8701",
      package_no: "PKG-8701",
      member_id: "m-102",
      treatment_id: "trt-picoway-06",
      treatment_name: "皮秒雷射蜂巢聚焦方案",
      total_quota: 6,
      remaining_quota: 5,
      last_consumed_at: "2026/02/18",
      last_operator_name: "Leo 醫師",
      expire_at: "2027/02/18",
    },
  ],
  appointments: [
    {
      id: "apt-001",
      appointment_no: "APT-20260312-0001",
      member_id: "m-101",
      member_name: "林雅婷",
      staff_id: "staff-anna",
      staff_name: "Anna 老師",
      treatment_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      treatment_name: "海菲秀深層毛孔調理 (水潤護理)",
      room_id: "room-1",
      room_name: "包廂 1 (VIP海菲秀)",
      machine_id: "mac-hydra",
      machine_name: "海菲秀機台 A",
      date: "2026-03-12",
      start_time: "13:00",
      end_time: "14:30",
      buffer_end_time: "14:45",
      status: "IN_PROGRESS",
      health_questionnaire: {
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
      },
      notes: "T字加強清潔，術後敷保濕生物纖維面膜",
      created_at: "2026-03-10T10:15:00+08:00",
    },
    {
      id: "apt-002",
      appointment_no: "APT-20260312-0002",
      member_id: "m-102",
      member_name: "王心如",
      staff_id: "staff-leo",
      staff_name: "Leo 醫師",
      treatment_id: "trt-picoway-06",
      treatment_name: "蜂巢皮秒撫紋美白",
      room_id: "room-2",
      room_name: "包廂 2 (雷射專用)",
      machine_id: "mac-picoway",
      machine_name: "皮秒機台 A",
      date: "2026-03-12",
      start_time: "13:00",
      end_time: "14:00",
      buffer_end_time: "14:15",
      status: "CONFIRMED",
      health_questionnaire: {
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
      },
      notes: "指定使用皮秒機台 A，加強雙頰毛孔聚焦探頭",
      created_at: "2026-03-09T14:20:00+08:00",
    },
    {
      id: "apt-003",
      appointment_no: "APT-20260312-0003",
      member_id: "m-103",
      member_name: "趙小萱",
      staff_id: "staff-mika",
      staff_name: "Mika 老師",
      treatment_id: "trt-algae-01",
      treatment_name: "極淨藻針煥膚調理",
      room_id: "room-3",
      room_name: "包廂 3 (美容美睫)",
      machine_id: null,
      machine_name: null,
      date: "2026-03-12",
      start_time: "14:30",
      end_time: "15:30",
      buffer_end_time: "15:45",
      status: "CONFIRMED",
      health_questionnaire: {
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
      },
      notes: "下巴閉鎖粉刺代謝",
      created_at: "2026-03-10T18:00:00+08:00",
    },
    {
      id: "apt-004",
      appointment_no: "APT-20260312-0004",
      member_id: "m-104",
      member_name: "張家豪",
      staff_id: "staff-anna",
      staff_name: "Anna 老師",
      treatment_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      treatment_name: "海菲秀深層毛孔調理 (水潤護理)",
      room_id: "room-1",
      room_name: "包廂 1 (VIP海菲秀)",
      machine_id: "mac-hydra",
      machine_name: "海菲秀機台 A",
      date: "2026-03-12",
      start_time: "15:00",
      end_time: "16:15",
      buffer_end_time: "16:30",
      status: "CONFIRMED",
      health_questionnaire: {
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
      },
      notes: "鼻頭黑頭粉刺深層吸淨",
      created_at: "2026-03-11T09:30:00+08:00",
    },
  ],
  package_consumptions: [
    {
      id: "con-01",
      appointment_id: "apt-prev-01",
      package_id: "pkg-8812",
      package_no: "PKG-8812",
      member_id: "m-101",
      member_name: "林雅婷",
      treatment_name: "皮秒雷射蜂巢聚焦方案",
      consumed_quota: 1,
      operator_staff_id: "staff-anna",
      operator_name: "Anna 老師",
      customer_signature_url: "SIGNED_BASE64_VERIFIED",
      sha256_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      fifo_deductions: [
        {
          batch_no: "HA-202511-01",
          item_name: "保濕玻尿酸原液",
          deducted: 1,
          remaining_in_batch: 12,
        },
        {
          batch_no: "CL-88210",
          item_name: "舒緩鎮定凍膜",
          deducted: 1,
          remaining_in_batch: 48,
        },
      ],
      consumed_at: "2026-02-10 14:25",
    },
  ],
  orders: [
    {
      id: "ord-20260312-01",
      order_no: "ORD-20260312-0081",
      member_id: "m-101",
      member_name: "林雅婷",
      subtotal: 13600,
      discount: 1000,
      total_amount: 12600,
      items: [
        {
          item_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          name: "海菲秀深層水潤方案 (3堂)",
          quantity: 1,
          custom_price: 12000,
        },
        {
          item_id: "prd-mask-box",
          name: "術後保濕修護面膜 (1盒)",
          quantity: 2,
          custom_price: 1600,
        },
      ],
      payments: [
        { method: "WALLET", amount: 5000 },
        { method: "CREDIT_CARD", amount: 7600 },
      ],
      sales_split: [
        {
          staff_id: "staff-vivian",
          staff_name: "Vivian 顧問",
          percentage: 50,
          commission_amount: 6300,
        },
        {
          staff_id: "staff-anna",
          staff_name: "Anna 老師",
          percentage: 50,
          commission_amount: 6300,
        },
      ],
      created_at: "2026-03-12 11:40",
    },
  ],
  line_jobs: [
    {
      id: "job-1",
      job_id: "confirm-apt-001",
      type: "SEND_BOOKING_CONFIRMED",
      label: "任務 A：預約成功通知 (Flex Message)",
      appointment_id: "apt-001",
      appointment_no: "APT-20260312-0001",
      member_id: "m-101",
      member_name: "林雅婷",
      scheduled_for: "2026-03-10 10:15",
      status: "SENT",
      message_preview:
        "【沐光美學】雅婷您好，您已成功預約 2026/03/12 13:00「海菲秀深層毛孔調理」，操作師：Anna 老師（VIP海菲秀包廂 1）。",
    },
    {
      id: "job-2",
      job_id: "pre-remind-apt-001",
      type: "SEND_PRE_TREATMENT_REMINDER",
      label: "任務 B：行前 24H 防爽約互動提醒",
      appointment_id: "apt-001",
      appointment_no: "APT-20260312-0001",
      member_id: "m-101",
      member_name: "林雅婷",
      scheduled_for: "2026-03-11 13:00",
      status: "SENT",
      message_preview:
        "【明日預約提醒】雅婷您好，提醒您明日 13:00 預約療程。術前 3 天請停用 A 酸/果酸產品並加強防曬。請點擊下方按鈕【確認出席】或【改期取消】。",
      customer_feedback: "已點擊【確認出席】",
    },
    {
      id: "job-3",
      job_id: "post-care-apt-001",
      type: "SEND_POST_TREATMENT_CARE",
      label: "任務 C：術後第 3 天修復關懷與問卷",
      appointment_id: "apt-001",
      appointment_no: "APT-20260312-0001",
      member_id: "m-101",
      member_name: "林雅婷",
      scheduled_for: "2026-03-15 13:00",
      status: "SCHEDULED",
      message_preview:
        "【術後第3天關懷】雅婷您好，做完海菲秀後目前膚況還順利嗎？請持續加強純保濕與防曬。若有任何微紅不適請點選【紅腫不適需諮詢】，護理師將立即致電關心您！",
    },
    {
      id: "job-4",
      job_id: "maint-21d-apt-001",
      type: "SEND_MAINTENANCE_DAY21",
      label: "任務 D：術後第 21 天膠原蛋白最佳維持期提醒",
      appointment_id: "apt-001",
      appointment_no: "APT-20260312-0001",
      member_id: "m-101",
      member_name: "林雅婷",
      scheduled_for: "2026-04-02 13:00",
      status: "SCHEDULED",
      message_preview:
        "【黃金保養週期提醒】雅婷您好，距離上次保養已滿 21 天，目前正是角質代謝與膠原維持的最佳時機！您尚有 4 堂療程餘額，點此立即一鍵預約下期時段。",
    },
  ],
  waitlist: [
    {
      id: "wl-01",
      member_id: "m-103",
      member_name: "趙小萱",
      treatment_id: "trt-picoway-06",
      treatment_name: "蜂巢皮秒撫紋美白",
      staff_id: "staff-leo",
      staff_name: "Leo 醫師",
      date: "2026-03-12",
      slot_time: "13:00",
      status: "WAITING",
      created_at: "2026-03-11 16:40",
    },
  ],
  redis_locks: {},
};

// Singleton global store for hot-reload persistence in dev/server mode
const globalForDb = globalThis as unknown as {
  __LIGHT_CLINIC_DB__?: DatabaseState;
};

export function getDb(): DatabaseState {
  if (!globalForDb.__LIGHT_CLINIC_DB__) {
    globalForDb.__LIGHT_CLINIC_DB__ = structuredClone(initialData);
  }
  return globalForDb.__LIGHT_CLINIC_DB__;
}

export function resetDb(): DatabaseState {
  globalForDb.__LIGHT_CLINIC_DB__ = structuredClone(initialData);
  return globalForDb.__LIGHT_CLINIC_DB__;
}

export function computeSha256(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

