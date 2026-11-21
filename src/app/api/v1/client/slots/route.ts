import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/engine";

/**
 * GET /api/v1/client/slots
 * 查詢指定日期、美容師與療程項目的可預約空檔 (含三維資源零衝突檢驗)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const treatment_id =
    searchParams.get("treatment_id") || "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
  const date = searchParams.get("date") || "2026-03-12";
  const staff_id = searchParams.get("staff_id") || undefined;

  const available_slots = getAvailableSlotsForDate({
    treatmentId: treatment_id,
    date,
    staffId: staff_id,
  });

  return NextResponse.json({
    success: true,
    date,
    treatment_id,
    staff_id: staff_id || null,
    available_slots,
  });
}

