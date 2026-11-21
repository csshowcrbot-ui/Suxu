import { NextRequest, NextResponse } from "next/server";
import { computeSha256, getDb } from "@/lib/db";
import {
  acquireRedlock,
  evaluateSlot3DConflict,
  releaseRedlock,
} from "@/lib/engine";

/**
 * POST /api/v1/client/appointments
 * 送出預約申請 (含 Redis 分散式鎖防併發 + 三維資源衝突檢查 + LINE BullMQ 4階段關懷排程)
 */
export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const {
    member_id = "m-101",
    treatment_id,
    staff_id,
    room_id,
    start_time,
    notes = "",
    signature_data_url = "",
    health_questionnaire = {
      has_retinoids_use: false,
      is_pregnant: false,
      recent_sun_exposure: false,
    },
  } = body;

  const member = db.members.find((m) => m.id === member_id) || db.members[0];
  const treatment =
    db.items.find((i) => i.id === treatment_id) ||
    db.items.find((i) => i.type === "TREATMENT")!;

  // Parse start_time (supports ISO '2026-03-15T13:00:00+08:00' or '2026-03-12 13:00' or '13:00')
  let dateStr = db.referenceDate;
  let hhmm = "13:00";

  if (typeof start_time === "string") {
    if (start_time.includes("T")) {
      dateStr = start_time.slice(0, 10);
      hhmm = start_time.split("T")[1].slice(0, 5);
    } else if (start_time.includes(" ")) {
      const parts = start_time.split(" ");
      dateStr = parts[0];
      hhmm = parts[1].slice(0, 5);
    } else {
      hhmm = start_time.slice(0, 5);
      if (body.date) dateStr = body.date;
    }
  }

  const compactDate = dateStr.replace(/-/g, "");
  const lockKeys = [
    `lock:appointment:staff:${staff_id || "auto"}:${compactDate}`,
    `lock:appointment:resource:${treatment.required_resource_type || "room"}:${compactDate}`,
  ];

  const lock = acquireRedlock(db, lockKeys, 10000);
  if (!lock.acquired) {
    return NextResponse.json(
      {
        success: false,
        error: "CONCURRENT_LOCK_CONFLICT",
        message: "該資源正在被其他連線鎖定預約中，請稍候再試。",
      },
      { status: 409 }
    );
  }

  try {
    const slotEval = evaluateSlot3DConflict(db, {
      date: dateStr,
      startTime: hhmm,
      treatment,
      staffId: staff_id || undefined,
      preferredRoomId: room_id || undefined,
    });

    if (!slotEval.available) {
      return NextResponse.json(
        {
          success: false,
          error: slotEval.reason,
          message: slotEval.reason_label || "該時段資源已滿或衝突",
        },
        { status: 409 }
      );
    }

    const seq = String(db.appointments.length + 12).padStart(4, "0");
    const appointment_no = `APT-${compactDate}-${seq}`;
    const appointment_id = `apt-${Date.now()}`;

    const newAppointment = {
      id: appointment_id,
      appointment_no,
      member_id: member.id,
      member_name: member.full_name,
      staff_id: slotEval.allocated_staff_id!,
      staff_name: slotEval.allocated_staff_name!,
      treatment_id: treatment.id,
      treatment_name: treatment.name,
      room_id: slotEval.allocated_room_id!,
      room_name: slotEval.allocated_room_name!,
      machine_id: slotEval.allocated_machine_id || null,
      machine_name: slotEval.allocated_machine_name || null,
      date: dateStr,
      start_time: slotEval.start_time,
      end_time: slotEval.end_time,
      buffer_end_time: slotEval.buffer_end_time,
      status: "CONFIRMED" as const,
      health_questionnaire,
      notes,
      created_at: new Date().toISOString(),
    };

    db.appointments.push(newAppointment);

    // 若有簽署術前健康評估，計算 SHA-256 存入會員合規留存記錄
    if (health_questionnaire) {
      const hashPayload = JSON.stringify({
        member_id: member.id,
        appointment_no,
        health_questionnaire,
        signature_data_url: signature_data_url || "LIFF_DIGITAL_SIGNATURE",
        timestamp: newAppointment.created_at,
      });
      member.consent_records.unshift({
        id: `cs-${Date.now()}`,
        title: `${treatment.name} - 術前健康告知與同意書 (${appointment_no})`,
        signed_at: `${dateStr} ${slotEval.start_time}`,
        sha256_hash: computeSha256(hashPayload),
        signature_data_url: signature_data_url || "SIGNED_VIA_LIFF",
        questionnaire: health_questionnaire,
      });
    }

    // 排入 BullMQ LINE 自動化 4 階段任務
    db.line_jobs.unshift(
      {
        id: `job-a-${Date.now()}`,
        job_id: `confirm-${appointment_id}`,
        type: "SEND_BOOKING_CONFIRMED",
        label: "任務 A：立即發送 [預約成功通知]",
        appointment_id,
        appointment_no,
        member_id: member.id,
        member_name: member.full_name,
        scheduled_for: "立即發送 (Immediate)",
        status: "SENT",
        message_preview: `【沐光美學】${member.full_name}您好，預約成功！單號 ${appointment_no}，時間：${dateStr} ${slotEval.start_time}，項目：${treatment.name}（${slotEval.allocated_room_name} / ${slotEval.allocated_staff_name}）。`,
      },
      {
        id: `job-b-${Date.now() + 1}`,
        job_id: `pre-remind-${appointment_id}`,
        type: "SEND_PRE_TREATMENT_REMINDER",
        label: "任務 B：預約前 24 小時 [防爽約提醒 + 確認按鈕]",
        appointment_id,
        appointment_no,
        member_id: member.id,
        member_name: member.full_name,
        scheduled_for: `${dateStr} 前 24 小時 (Delay Job)`,
        status: "SCHEDULED",
        message_preview: `【行前 24H 提醒】${member.full_name}您好，明日 ${slotEval.start_time} 為您的「${treatment.name}」療程，請停用酸類並注意防曬。請點擊【確認出席】或【改期取消】。`,
      },
      {
        id: `job-c-${Date.now() + 2}`,
        job_id: `post-care-${appointment_id}`,
        type: "SEND_POST_TREATMENT_CARE",
        label: "任務 C：術後第 3 天 [修復關懷 + 滿意度調查問卷]",
        appointment_id,
        appointment_no,
        member_id: member.id,
        member_name: member.full_name,
        scheduled_for: `${dateStr} + 3 天 (Delay Job)`,
        status: "SCHEDULED",
        message_preview: `【術後第 3 天關懷】${member.full_name}您好，術後黃金修護期請多敷保濕面膜！請問目前膚況如何？點擊回饋【退紅良好】或【紅腫不適需電訪】。`,
      },
      {
        id: `job-d-${Date.now() + 3}`,
        job_id: `maint-21d-${appointment_id}`,
        type: "SEND_MAINTENANCE_DAY21",
        label: "任務 D：術後第 21 天 [膠原蛋白最佳維持期提醒]",
        appointment_id,
        appointment_no,
        member_id: member.id,
        member_name: member.full_name,
        scheduled_for: `${dateStr} + 21 天 (Delay Job)`,
        status: "SCHEDULED",
        message_preview: `【術後 21 天維護提醒】${member.full_name}您好，膠原蛋白最佳維持期到了！點此預約下期維護療程。`,
      }
    );

    return NextResponse.json(
      {
        success: true,
        appointment_id,
        appointment_no,
        status: "CONFIRMED",
        appointment: newAppointment,
      },
      { status: 201 }
    );
  } finally {
    releaseRedlock(db, lockKeys);
  }
}

