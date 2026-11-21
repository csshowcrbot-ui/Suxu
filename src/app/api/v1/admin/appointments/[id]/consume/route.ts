import { NextRequest, NextResponse } from "next/server";
import { computeSha256, getDb } from "@/lib/db";
import { executeFifoDeduction } from "@/lib/engine";

/**
 * POST /api/v1/admin/appointments/[id]/consume
 * 核銷預約與扣除堂數 + 觸發 FIFO 耗材批次自動扣減 + 數位簽章 SHA-256 稽核
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = getDb();
  const body = await request.json();

  const {
    package_id,
    signature_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    operator_staff_id = "staff-anna",
  } = body;

  const pkg = db.member_packages.find((p) => p.id === package_id);
  if (!pkg) {
    return NextResponse.json(
      { success: false, message: "找不到指定的療程方案券" },
      { status: 404 }
    );
  }

  if (pkg.remaining_quota <= 0) {
    return NextResponse.json(
      { success: false, message: "此療程方案剩餘堂數為 0，無法核銷" },
      { status: 400 }
    );
  }

  const operator =
    db.staff.find((s) => s.id === operator_staff_id) || db.staff[0];
  const member =
    db.members.find((m) => m.id === pkg.member_id) || db.members[0];

  // 1. 扣減療程堂數
  pkg.remaining_quota -= 1;
  pkg.last_consumed_at = db.referenceDate.replace(/-/g, "/");
  pkg.last_operator_name = operator.name;

  // 2. 若關聯預約存在，更新預約狀態為 COMPLETED
  const appointment = db.appointments.find((a) => a.id === id);
  if (appointment) {
    appointment.status = "COMPLETED";
  }

  // 3. 觸發先進先出 (FIFO) 耗材自動扣減邏輯
  const treatmentId = appointment ? appointment.treatment_id : pkg.treatment_id;
  const { deductions, warnings } = executeFifoDeduction(db, treatmentId);

  // 4. 計算顧客電子簽名與同意書之 SHA-256 防竄改雜湊碼
  const nowStr = `${db.referenceDate} ${new Date().toTimeString().slice(0, 5)}`;
  const sha256_hash = computeSha256(
    `${id}|${pkg.id}|${member.id}|${operator.id}|${signature_base64}|${nowStr}`
  );

  const consumptionRecord = {
    id: `con-${Date.now()}`,
    appointment_id: id,
    package_id: pkg.id,
    package_no: pkg.package_no,
    member_id: member.id,
    member_name: member.full_name,
    treatment_name: pkg.treatment_name,
    consumed_quota: 1,
    operator_staff_id: operator.id,
    operator_name: operator.name,
    customer_signature_url: signature_base64,
    sha256_hash,
    fifo_deductions: deductions,
    consumed_at: nowStr,
  };

  db.package_consumptions.unshift(consumptionRecord);

  // 同步寫入會員合規簽署檔案
  member.consent_records.unshift({
    id: `cs-consume-${Date.now()}`,
    title: `${pkg.treatment_name} 單次核銷簽署確認單 (${pkg.package_no})`,
    signed_at: nowStr,
    sha256_hash,
    signature_data_url: signature_base64,
    questionnaire: {
      has_retinoids_use: false,
      is_pregnant: false,
      recent_sun_exposure: false,
    },
  });

  return NextResponse.json({
    success: true,
    consumption: consumptionRecord,
    remaining_quota: pkg.remaining_quota,
    fifo_deductions: deductions,
    inventory_warnings: warnings,
    sha256_hash,
  });
}

