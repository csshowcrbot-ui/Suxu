import {
  Appointment,
  CatalogItem,
  computeSha256,
  DatabaseState,
  getDb,
  InventoryBatch,
} from "./db";

export function timeToMinutes(hhmm: string): number {
  const clean = hhmm.includes("T") ? hhmm.split("T")[1].slice(0, 5) : hhmm.slice(0, 5);
  const [h, m] = clean.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function maskPhone(phone: string, isStoreManager: boolean): string {
  if (isStoreManager) return phone;
  // Format 0912-345-678 -> 0912-***-678
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}-***-${digits.slice(7)}`;
  }
  return phone.replace(/(\d{4})-?\d{3}-?(\d{3})/, "$1-***-$2");
}

export interface SlotCheckResult {
  start_time: string;
  end_time: string;
  buffer_end_time: string;
  available: boolean;
  reason?: "STAFF_UNAVAILABLE" | "ROOM_UNAVAILABLE" | "MACHINE_UNAVAILABLE";
  reason_label?: string;
  allocated_room_id?: string;
  allocated_room_name?: string;
  allocated_machine_id?: string | null;
  allocated_machine_name?: string | null;
  allocated_staff_id?: string;
  allocated_staff_name?: string;
}

/**
 * 4.1 三維資源「零衝突」預約檢查演算法
 * Overlap Condition: (existing.start < T_end_with_buffer) AND (existing.buffer_end > T_start)
 */
export function evaluateSlot3DConflict(
  db: DatabaseState,
  params: {
    date: string;
    startTime: string;
    treatment: CatalogItem;
    staffId?: string;
    preferredRoomId?: string;
    excludeAppointmentId?: string;
  }
): SlotCheckResult {
  const startMin = timeToMinutes(params.startTime);
  const treatmentEndMin = startMin + (params.treatment.duration_min || 60);
  const totalEndMin = treatmentEndMin + (params.treatment.buffer_min || 15);

  const startStr = minutesToTime(startMin);
  const endStr = minutesToTime(treatmentEndMin);
  const bufferEndStr = minutesToTime(totalEndMin);

  // Active appointments on the same date
  const activeApts = db.appointments.filter(
    (a) =>
      a.date === params.date &&
      a.status !== "CANCELLED" &&
      a.status !== "NO_SHOW" &&
      a.id !== params.excludeAppointmentId
  );

  const isOverlapping = (apt: Appointment) => {
    const aptStart = timeToMinutes(apt.start_time);
    const aptEndWithBuffer = timeToMinutes(apt.buffer_end_time || apt.end_time);
    return aptStart < totalEndMin && aptEndWithBuffer > startMin;
  };

  const overlappingApts = activeApts.filter(isOverlapping);

  // 1. 檢查人員 (Staff)
  const candidateStaff = params.staffId
    ? db.staff.filter((s) => s.id === params.staffId && s.is_active)
    : db.staff.filter((s) => s.is_active && (s.role === "BEAUTICIAN" || s.role === "DOCTOR"));

  const freeStaff = candidateStaff.find(
    (s) => !overlappingApts.some((apt) => apt.staff_id === s.id)
  );

  if (!freeStaff) {
    return {
      start_time: startStr,
      end_time: bufferEndStr,
      buffer_end_time: bufferEndStr,
      available: false,
      reason: "STAFF_UNAVAILABLE",
      reason_label: "指定操作師該時段已有預約或清消緩衝中",
    };
  }

  // 2. 檢查空間 (獨立包廂 Room)
  const activeRooms = params.preferredRoomId
    ? db.resources.filter((r) => r.type === "ROOM" && r.is_active && r.id === params.preferredRoomId)
    : db.resources.filter((r) => r.type === "ROOM" && r.is_active);

  const freeRoom = activeRooms.find(
    (r) => !overlappingApts.some((apt) => apt.room_id === r.id)
  );

  if (!freeRoom) {
    return {
      start_time: startStr,
      end_time: bufferEndStr,
      buffer_end_time: bufferEndStr,
      available: false,
      reason: "ROOM_UNAVAILABLE",
      reason_label: "所有獨立包廂於該時段皆已滿載",
    };
  }

  // 3. 檢查機台設備 (Machine)
  let allocatedMachineId: string | null = null;
  let allocatedMachineName: string | null = null;

  if (params.treatment.required_resource_type) {
    const matchingMachines = db.resources.filter(
      (r) =>
        r.type === "MACHINE" &&
        r.is_active &&
        r.sub_type === params.treatment.required_resource_type
    );

    const freeMachine = matchingMachines.find(
      (m) => !overlappingApts.some((apt) => apt.machine_id === m.id)
    );

    if (!freeMachine) {
      return {
        start_time: startStr,
        end_time: bufferEndStr,
        buffer_end_time: bufferEndStr,
        available: false,
        reason: "MACHINE_UNAVAILABLE",
        reason_label: "專用雷射/海菲秀儀器於該時段已被借調鎖定",
      };
    }

    allocatedMachineId = freeMachine.id;
    allocatedMachineName = freeMachine.name;
  }

  return {
    start_time: startStr,
    end_time: endStr,
    buffer_end_time: bufferEndStr,
    available: true,
    allocated_staff_id: freeStaff.id,
    allocated_staff_name: freeStaff.name,
    allocated_room_id: freeRoom.id,
    allocated_room_name: freeRoom.name,
    allocated_machine_id: allocatedMachineId,
    allocated_machine_name: allocatedMachineName,
  };
}

export function getAvailableSlotsForDate(params: {
  treatmentId: string;
  date: string;
  staffId?: string;
}): SlotCheckResult[] {
  const db = getDb();
  const treatment =
    db.items.find((i) => i.id === params.treatmentId) ||
    db.items.find((i) => i.type === "TREATMENT")!;

  const candidateStarts = ["11:00", "13:00", "13:30", "14:30", "15:00", "16:30", "18:00"];
  return candidateStarts.map((slotStart) =>
    evaluateSlot3DConflict(db, {
      date: params.date,
      startTime: slotStart,
      treatment,
      staffId: params.staffId,
    })
  );
}

/**
 * Redis Redlock 分散式鎖模擬 (TTL = 10 秒)
 * Key: lock:appointment:staff:{staff_id}:{YYYYMMDD}
 * Key: lock:appointment:resource:{machine_id}:{YYYYMMDD}
 */
export function acquireRedlock(
  db: DatabaseState,
  keys: string[],
  ttlMs = 10000
): { acquired: boolean; lockKeys: string[] } {
  const now = Date.now();
  // Clean expired locks
  for (const k of Object.keys(db.redis_locks)) {
    if (db.redis_locks[k] < now) {
      delete db.redis_locks[k];
    }
  }
  for (const key of keys) {
    if (db.redis_locks[key] && db.redis_locks[key] >= now) {
      return { acquired: false, lockKeys: [] };
    }
  }
  for (const key of keys) {
    db.redis_locks[key] = now + ttlMs;
  }
  return { acquired: true, lockKeys: keys };
}

export function releaseRedlock(db: DatabaseState, keys: string[]) {
  for (const key of keys) {
    delete db.redis_locks[key];
  }
}

/**
 * 4.2 耗材先進先出（FIFO）自動扣減邏輯
 * ORDER BY expiry_date ASC, created_at ASC FOR UPDATE
 */
export function executeFifoDeduction(
  db: DatabaseState,
  treatmentId: string
): {
  deductions: {
    batch_no: string;
    item_name: string;
    deducted: number;
    remaining_in_batch: number;
  }[];
  warnings: string[];
} {
  const bomList = db.treatment_bom.filter((b) => b.treatment_id === treatmentId);
  const deductions: {
    batch_no: string;
    item_name: string;
    deducted: number;
    remaining_in_batch: number;
  }[] = [];
  const warnings: string[] = [];
  const currentDate = db.referenceDate;

  for (const bom of bomList) {
    let qNeed = bom.deduct_quantity;

    // 查詢未過期且有庫存之批號，並依 expiry_date ASC, created_at ASC 排序
    const eligibleBatches: InventoryBatch[] = db.inventory_batches
      .filter(
        (b) =>
          b.item_id === bom.inventory_item_id &&
          b.stock_quantity > 0 &&
          b.expiry_date >= currentDate
      )
      .sort((a, b) => {
        const expDiff = a.expiry_date.localeCompare(b.expiry_date);
        if (expDiff !== 0) return expDiff;
        return a.created_at.localeCompare(b.created_at);
      });

    for (const batch of eligibleBatches) {
      if (qNeed <= 0) break;
      const take = Math.min(batch.stock_quantity, qNeed);
      batch.stock_quantity -= take;
      qNeed -= take;

      deductions.push({
        batch_no: batch.batch_no,
        item_name: batch.item_name,
        deducted: take,
        remaining_in_batch: batch.stock_quantity,
      });

      if (batch.stock_quantity <= batch.safety_stock) {
        warnings.push(
          `耗材【${batch.item_name}】批號 ${batch.batch_no} 庫存剩餘 ${batch.stock_quantity} ${batch.unit}，已達安全庫存預警值 (${batch.safety_stock} ${batch.unit})！`
        );
      }
    }

    if (qNeed > 0) {
      warnings.push(
        `警報：耗材【${bom.inventory_item_name}】未過期批次庫存不足，尚缺 ${qNeed} ${bom.unit}！已寫入異常稽核日誌。`
      );
    }
  }

  return { deductions, warnings };
}

/**
 * 計算庫存批號狀態 (充足 / 需補貨 / 即將到期 / 已過期)
 * 到期前 60 天自動標註橘黃色警告
 */
export function getBatchStatus(
  batch: InventoryBatch,
  referenceDateStr = "2026-03-12"
): {
  code: "EXPIRED" | "EXPIRING_SOON" | "LOW_STOCK" | "SUFFICIENT";
  label: string;
  daysUntilExpiry: number;
} {
  const refTime = new Date(referenceDateStr).getTime();
  const expTime = new Date(batch.expiry_date).getTime();
  const daysUntilExpiry = Math.ceil((expTime - refTime) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return { code: "EXPIRED", label: "已過期", daysUntilExpiry };
  }
  if (daysUntilExpiry <= 30) {
    return { code: "EXPIRING_SOON", label: "即將到期", daysUntilExpiry };
  }
  if (batch.stock_quantity < batch.safety_stock) {
    return { code: "LOW_STOCK", label: "需補貨", daysUntilExpiry };
  }
  if (daysUntilExpiry <= 60) {
    return { code: "EXPIRING_SOON", label: "效期預警", daysUntilExpiry };
  }
  return { code: "SUFFICIENT", label: "充足", daysUntilExpiry };
}

export { computeSha256 };

