import { NextRequest, NextResponse } from "next/server";
import { getDb, resetDb } from "@/lib/db";
import { evaluateSlot3DConflict } from "@/lib/engine";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    success: true,
    data: db,
  });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { action } = body;

  if (action === "RESET_DEMO") {
    const fresh = resetDb();
    return NextResponse.json({ success: true, data: fresh });
  }

  // 1. 拖拉排程改期 / 更換包廂或操作師 (含三維零衝突防呆檢驗)
  if (action === "RESCHEDULE_APPOINTMENT") {
    const { appointment_id, new_start_time, new_room_id, new_staff_id } = body;
    const apt = db.appointments.find((a) => a.id === appointment_id);
    if (!apt) {
      return NextResponse.json(
        { success: false, message: "找不到該筆預約" },
        { status: 404 }
      );
    }

    const treatment =
      db.items.find((i) => i.id === apt.treatment_id) ||
      db.items.find((i) => i.type === "TREATMENT")!;

    const check = evaluateSlot3DConflict(db, {
      date: apt.date,
      startTime: new_start_time || apt.start_time,
      treatment,
      staffId: new_staff_id || apt.staff_id,
      preferredRoomId: new_room_id || apt.room_id,
      excludeAppointmentId: apt.id,
    });

    if (!check.available) {
      return NextResponse.json(
        {
          success: false,
          error: check.reason,
          message: `排程防呆攔截：${check.reason_label}`,
        },
        { status: 409 }
      );
    }

    apt.start_time = check.start_time;
    apt.end_time = check.end_time;
    apt.buffer_end_time = check.buffer_end_time;
    apt.room_id = check.allocated_room_id!;
    apt.room_name = check.allocated_room_name!;
    apt.staff_id = check.allocated_staff_id!;
    apt.staff_name = check.allocated_staff_name!;

    return NextResponse.json({
      success: true,
      message: `已成功將 ${apt.member_name} 的預約移至 ${apt.start_time} (${apt.room_name})`,
      appointment: apt,
    });
  }

  // 2. 取消預約 -> 自動移除 BullMQ 尚未執行的延遲任務 + 觸發候補清單限時 15 分鐘認領通知
  if (action === "CANCEL_APPOINTMENT") {
    const { appointment_id, reason = "顧客臨時改期" } = body;
    const apt = db.appointments.find((a) => a.id === appointment_id);
    if (!apt) {
      return NextResponse.json(
        { success: false, message: "找不到該筆預約" },
        { status: 404 }
      );
    }

    apt.status = "CANCELLED";
    apt.cancellation_reason = reason;

    // 取消尚未執行的 BullMQ 延遲推播
    for (const job of db.line_jobs) {
      if (job.appointment_id === apt.id && job.status === "SCHEDULED") {
        job.status = "CANCELLED";
      }
    }

    // 智慧候位引擎：檢查是否有候補名單並推播限時 15 分鐘認領通知
    const matchingWaitlist = db.waitlist.filter(
      (w) => w.date === apt.date && w.status === "WAITING"
    );
    for (const wl of matchingWaitlist.slice(0, 3)) {
      wl.status = "NOTIFIED_15M";
      db.line_jobs.unshift({
        id: `job-wl-${Date.now()}-${wl.id}`,
        job_id: `waitlist-claim-${wl.id}`,
        type: "SEND_WAITLIST_RELEASE",
        label: "智慧候位釋出：限時 15 分鐘認領通知",
        member_id: wl.member_id,
        member_name: wl.member_name,
        scheduled_for: "立即發送 (限時 15m)",
        status: "SENT",
        message_preview: `【候補名額釋出通知】${wl.member_name}您好！您登記候補的 ${apt.date} ${apt.start_time}「${wl.treatment_name}」剛剛釋出 1 個名額，系統已為您保留 15 分鐘，請立即點擊認領預約！`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        matchingWaitlist.length > 0
          ? `預約已取消，已自動清除未發送之排程任務，並向 ${matchingWaitlist.length} 位候補顧客發送 LINE 限時 15 分鐘認領推播！`
          : "預約已取消，並已自動回收佇列中尚未發送之 LINE 延遲通知任務。",
    });
  }

  // 3. 進貨入庫 (+ 進貨入庫)
  if (action === "ADD_INVENTORY_BATCH") {
    const { item_id, batch_no, expiry_date, stock_quantity, cost_price } = body;
    const item = db.items.find((i) => i.id === item_id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: "找不到指定的耗材品項" },
        { status: 404 }
      );
    }

    const newBatch = {
      id: `batch-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      unit: item.unit || "瓶",
      safety_stock: item.safety_stock || 10,
      batch_no,
      expiry_date,
      stock_quantity: Number(stock_quantity) || 10,
      cost_price: Number(cost_price) || 500,
      created_at: new Date().toISOString(),
    };

    db.inventory_batches.unshift(newBatch);
    return NextResponse.json({
      success: true,
      batch: newBatch,
    });
  }

  // 4. 顧客登記智慧候位 (Waitlist)
  if (action === "ADD_WAITLIST") {
    const { member_id, treatment_id, staff_id, date, slot_time } = body;
    const member = db.members.find((m) => m.id === member_id) || db.members[0];
    const treatment =
      db.items.find((i) => i.id === treatment_id) || db.items[0];
    const staff = db.staff.find((s) => s.id === staff_id) || db.staff[0];

    const entry = {
      id: `wl-${Date.now()}`,
      member_id: member.id,
      member_name: member.full_name,
      treatment_id: treatment.id,
      treatment_name: treatment.name,
      staff_id: staff.id,
      staff_name: staff.name,
      date: date || db.referenceDate,
      slot_time,
      status: "WAITING" as const,
      created_at: `${db.referenceDate} ${new Date().toTimeString().slice(0, 5)}`,
    };

    db.waitlist.unshift(entry);
    return NextResponse.json({
      success: true,
      waitlist: entry,
    });
  }

  // 5. LINE 任務排程操作 (立即觸發推播 / 模擬顧客點擊「紅腫不適」或「確認出席」)
  if (action === "TRIGGER_LINE_JOB") {
    const { job_id, feedback_type } = body;
    const job = db.line_jobs.find((j) => j.id === job_id);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "找不到該排程任務" },
        { status: 404 }
      );
    }

    if (feedback_type === "DISCOMFORT_ALERT") {
      job.status = "ALERT_CALLBACK";
      job.customer_feedback = "⚠️ 顧客回報【紅腫不適】，已觸發櫃檯主動電訪警報！";
    } else if (feedback_type === "CONFIRM_ATTENDANCE") {
      job.status = "SENT";
      job.customer_feedback = "✅ 顧客已點擊【確認出席】";
    } else {
      job.status = "SENT";
    }

    return NextResponse.json({
      success: true,
      job,
    });
  }

  // 6. 更新會員備註或標籤
  if (action === "UPDATE_MEMBER") {
    const { member_id, tags, special_notes, wallet_topup } = body;
    const member = db.members.find((m) => m.id === member_id);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "找不到該會員" },
        { status: 404 }
      );
    }
    if (Array.isArray(tags)) member.tags = tags;
    if (typeof special_notes === "string") {
      member.medical_notes.special_notes = special_notes;
    }
    if (Number(wallet_topup) > 0) {
      member.wallet_balance += Number(wallet_topup);
    }
    return NextResponse.json({
      success: true,
      member,
    });
  }

  // 7. 新增會員病歷與檔案
  if (action === "CREATE_MEMBER") {
    const {
      full_name,
      phone,
      gender = "女性",
      age = 28,
      birthday = "1998-01-01",
      wallet_balance = 0,
      preferred_staff_id,
      tags = [],
      allergies = "無已知藥物過敏",
      laser_experience = "初次來院諮詢",
      special_notes = "",
    } = body;

    if (!full_name || !phone) {
      return NextResponse.json(
        { success: false, message: "請填寫會員姓名與聯絡電話" },
        { status: 400 }
      );
    }

    // 檢查電話是否重複
    const phoneExists = db.members.some((m) => m.phone === phone);
    if (phoneExists) {
      return NextResponse.json(
        { success: false, message: "此手機號碼已註冊過會員資料" },
        { status: 400 }
      );
    }

    const staffObj =
      db.staff.find((s) => s.id === preferred_staff_id) || db.staff[0];
    const memberId = `m-${Date.now()}`;
    const seq = String(db.members.length + 1).padStart(3, "0");
    const memberCode = `M-${db.referenceDate.replace(/-/g, "")}${seq}`;

    const newMember = {
      id: memberId,
      member_code: memberCode,
      line_user_id: `U${Math.random().toString(16).slice(2, 14)}`,
      full_name,
      phone,
      gender,
      age: Number(age) || 28,
      birthday: birthday || "1998-01-01",
      wallet_balance: Number(wallet_balance) || 0,
      total_spent: 0,
      preferred_staff_id: staffObj ? staffObj.id : "staff-anna",
      preferred_staff_name: staffObj ? staffObj.name : "Anna 老師",
      tags: Array.isArray(tags) ? tags : [],
      medical_notes: {
        allergies: allergies || "無已知藥物過敏",
        laser_experience: laser_experience || "初次來院諮詢",
        has_retinoids_use: false,
        is_pregnant: false,
        recent_sun_exposure: false,
        special_notes: special_notes || "新客建檔，初次施作前建議詳細評估膚質",
      },
      skin_logs: [],
      consent_records: [],
    };

    db.members.unshift(newMember);

    // 發送一則新會員建檔歡迎 LINE 任務 (立即發送)
    db.line_jobs.unshift({
      id: `job-welcome-${Date.now()}`,
      job_id: `welcome-${memberCode}`,
      type: "SEND_BOOKING_CONFIRMED",
      label: "新會員建檔歡迎 (LINE 會員綁定確認)",
      member_id: memberId,
      member_name: full_name,
      scheduled_for: "立即發送",
      status: "SENT",
      message_preview: `【沐光美學】${full_name} 貴賓您好，歡迎加入沐光美學診所！您的會員編號為 ${memberCode}，電子病歷檔案已建立完成，可於 LINE 中隨時查詢專屬療程與預約時段。`,
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `已成功建立會員【${full_name}】檔案（會員卡號：${memberCode}）`,
    });
  }

  // 8. 新增產品 / 耗材 / 療程品項
  if (action === "CREATE_CATALOG_ITEM") {
    const {
      name,
      type = "CONSUMABLE",
      category = "醫療耗材",
      unit = "瓶",
      price = 0,
      safety_stock = 10,
      duration_min = 60,
      buffer_min = 15,
      package_sessions,
      description = "",
      initial_batch_no,
      initial_expiry_date,
      initial_quantity,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "請輸入品項名稱" },
        { status: 400 }
      );
    }

    const prefix =
      type === "TREATMENT" ? "TRT" : type === "PRODUCT" ? "PRD" : "CON";
    const sku = `${prefix}-${Date.now().toString().slice(-6)}`;
    const newItemId = `${prefix.toLowerCase()}-${Date.now()}`;

    const newItem = {
      id: newItemId,
      sku,
      name: String(name).trim(),
      category: String(category || (type === "PRODUCT" ? "術後修護保養" : type === "TREATMENT" ? "美學療程" : "醫療耗材")).trim(),
      type: type as "TREATMENT" | "PRODUCT" | "CONSUMABLE",
      duration_min: type === "TREATMENT" ? Number(duration_min) || 60 : 0,
      buffer_min: type === "TREATMENT" ? Number(buffer_min) || 15 : 0,
      price: Number(price) || 0,
      package_sessions:
        type === "TREATMENT" && Number(package_sessions) > 0
          ? Number(package_sessions)
          : undefined,
      safety_stock: Number(safety_stock) || 10,
      unit: String(unit || "瓶").trim(),
      required_resource_type: null,
      description: String(description || "").trim(),
    };

    db.items.push(newItem);

    // 若為耗材且填寫初始進貨數量，同步建立首批庫存批號
    if (
      type === "CONSUMABLE" &&
      Number(initial_quantity) > 0 &&
      initial_batch_no
    ) {
      db.inventory_batches.unshift({
        id: `batch-${Date.now()}`,
        item_id: newItem.id,
        item_name: newItem.name,
        unit: newItem.unit,
        safety_stock: newItem.safety_stock || 10,
        batch_no: String(initial_batch_no).trim(),
        expiry_date: initial_expiry_date || "2027-12-31",
        stock_quantity: Number(initial_quantity),
        cost_price: Number(price) || 500,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      item: newItem,
      message: `已成功新增品項【${newItem.name}】（${sku}）`,
    });
  }

  // 9. 新增或更新療程標準耗材配方 (Treatment BOM)
  if (action === "ADD_TREATMENT_BOM") {
    const { treatment_id, inventory_item_id, deduct_quantity } = body;
    const treatment = db.items.find(
      (i) => i.id === treatment_id && i.type === "TREATMENT"
    );
    const consumable = db.items.find(
      (i) => i.id === inventory_item_id && i.type === "CONSUMABLE"
    );

    if (!treatment) {
      return NextResponse.json(
        { success: false, message: "找不到指定的療程項目" },
        { status: 404 }
      );
    }
    if (!consumable) {
      return NextResponse.json(
        { success: false, message: "找不到指定的耗材品項" },
        { status: 404 }
      );
    }

    const qty = Number(deduct_quantity);
    if (!qty || qty <= 0) {
      return NextResponse.json(
        { success: false, message: "每次核銷扣減數量必須大於 0" },
        { status: 400 }
      );
    }

    const existing = db.treatment_bom.find(
      (b) =>
        b.treatment_id === treatment.id &&
        b.inventory_item_id === consumable.id
    );

    if (existing) {
      existing.deduct_quantity = qty;
      return NextResponse.json({
        success: true,
        bom: existing,
        message: `已更新【${treatment.name}】的配方：${consumable.name} × ${qty}${consumable.unit}`,
      });
    }

    const newBom = {
      id: `bom-${Date.now()}`,
      treatment_id: treatment.id,
      inventory_item_id: consumable.id,
      inventory_item_name: consumable.name,
      deduct_quantity: qty,
      unit: consumable.unit || "瓶",
    };

    db.treatment_bom.push(newBom);
    return NextResponse.json({
      success: true,
      bom: newBom,
      message: `已為【${treatment.name}】新增耗材配方：${consumable.name} × ${qty}${consumable.unit}`,
    });
  }

  // 10. 刪除單一療程耗材配方項目
  if (action === "DELETE_TREATMENT_BOM") {
    const { bom_id } = body;
    const idx = db.treatment_bom.findIndex((b) => b.id === bom_id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "找不到指定的配方項目" },
        { status: 404 }
      );
    }
    const [removed] = db.treatment_bom.splice(idx, 1);
    return NextResponse.json({
      success: true,
      message: `已移除配方項目：${removed.inventory_item_name}`,
    });
  }

  // 11. 新增操作老師 / 醫師 / 診所人員
  if (action === "CREATE_STAFF") {
    const {
      name,
      title = "皮膚管理師",
      phone = "",
      role = "BEAUTICIAN",
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "請輸入操作老師姓名" },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();
    const duplicated = db.staff.some((s) => s.name === trimmedName);
    if (duplicated) {
      return NextResponse.json(
        { success: false, message: "此人員姓名已存在於系統中" },
        { status: 400 }
      );
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      name: trimmedName,
      title: String(title || "皮膚管理師").trim(),
      phone: String(phone || "0900-000-000").trim(),
      role: role as "ADMIN" | "DOCTOR" | "BEAUTICIAN" | "CONSULTANT",
      is_active: true,
    };

    db.staff.push(newStaff);
    return NextResponse.json({
      success: true,
      staff: newStaff,
      message: `已成功新增人員【${newStaff.name}】（${newStaff.title}）`,
    });
  }

  // 12. 切換操作老師排班啟用狀態
  if (action === "TOGGLE_STAFF_ACTIVE") {
    const { staff_id } = body;
    const staff = db.staff.find((s) => s.id === staff_id);
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "找不到指定的診所人員" },
        { status: 404 }
      );
    }
    staff.is_active = !staff.is_active;
    return NextResponse.json({
      success: true,
      staff,
      message: staff.is_active
        ? `已重新啟用【${staff.name}】排班與預約`
        : `已暫停【${staff.name}】排班與預約`,
    });
  }

  // 13. 新增獨立診療包廂
  if (action === "CREATE_ROOM") {
    const { name, code } = body;
    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "請輸入包廂名稱" },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();
    const duplicated = db.resources.some(
      (r) => r.type === "ROOM" && r.name === trimmedName
    );
    if (duplicated) {
      return NextResponse.json(
        { success: false, message: "此包廂名稱已存在" },
        { status: 400 }
      );
    }

    const existingRoomCount = db.resources.filter(
      (r) => r.type === "ROOM"
    ).length;
    const roomCode =
      code && String(code).trim()
        ? String(code).trim().toUpperCase()
        : `RM-${String(existingRoomCount + 1).padStart(2, "0")}`;

    const newRoom = {
      id: `room-${Date.now()}`,
      code: roomCode,
      name: trimmedName,
      type: "ROOM" as const,
      is_active: true,
    };

    db.resources.push(newRoom);
    return NextResponse.json({
      success: true,
      room: newRoom,
      message: `已成功新增獨立包廂【${newRoom.name}】（${newRoom.code}）`,
    });
  }

  // 14. 刪除獨立診療包廂（含有效預約防呆檢查）
  if (action === "DELETE_ROOM") {
    const { room_id } = body;
    const rooms = db.resources.filter((r) => r.type === "ROOM");
    if (rooms.length <= 1) {
      return NextResponse.json(
        { success: false, message: "系統至少須保留 1 間獨立包廂，無法刪除" },
        { status: 400 }
      );
    }

    const idx = db.resources.findIndex(
      (r) => r.id === room_id && r.type === "ROOM"
    );
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "找不到指定的包廂" },
        { status: 404 }
      );
    }

    const activeApts = db.appointments.filter(
      (a) => a.room_id === room_id && a.status !== "CANCELLED"
    );
    if (activeApts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `此包廂尚有 ${activeApts.length} 筆有效預約，請先改期換包廂或取消預約後再刪除`,
        },
        { status: 409 }
      );
    }

    const [removed] = db.resources.splice(idx, 1);
    return NextResponse.json({
      success: true,
      message: `已成功刪除包廂【${removed.name}】`,
    });
  }

  return NextResponse.json(
    { success: false, message: "未知的操作指令" },
    { status: 400 }
  );
}

