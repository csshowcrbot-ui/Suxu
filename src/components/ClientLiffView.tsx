"use client";

import React, { useState, useEffect } from "react";
import { QrCode, X } from "lucide-react";
import { DatabaseState } from "@/lib/db";
import { SlotCheckResult } from "@/lib/engine";
import SignaturePad from "./SignaturePad";

interface ClientLiffViewProps {
  db: DatabaseState;
  onRefresh: () => Promise<void>;
  toast: (msg: string, type?: "success" | "warning" | "error") => void;
}

type LiffTab = "HOME" | "BOOKING" | "WALLET" | "CARE_REMINDERS";

export default function ClientLiffView({
  db,
  onRefresh,
  toast,
}: ClientLiffViewProps) {
  const [activeTab, setActiveTab] = useState<LiffTab>("HOME");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("m-101");

  const currentMember =
    db.members.find((m) => m.id === selectedMemberId) || db.members[0];
  const memberPackages = db.member_packages.filter(
    (p) => p.member_id === currentMember.id
  );
  const totalRemainingQuota = memberPackages.reduce(
    (sum, p) => sum + p.remaining_quota,
    0
  );
  const treatments = db.items.filter((i) => i.type === "TREATMENT");

  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(
    treatments[0]?.id || "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("staff-anna");
  const [selectedDate, setSelectedDate] = useState<string>("2026-03-12");
  const [slots, setSlots] = useState<SlotCheckResult[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("13:30");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const [showQuestionnaireSheet, setShowQuestionnaireSheet] =
    useState<boolean>(false);
  const [hasRetinoids, setHasRetinoids] = useState<boolean>(false);
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [recentSun, setRecentSun] = useState<boolean>(false);
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{
    appointment_no: string;
    treatment_name: string;
    date: string;
    time: string;
    staff_name: string;
    room_name: string;
  } | null>(null);

  const [qrModalPkg, setQrModalPkg] = useState<{
    id: string;
    package_no: string;
    treatment_name: string;
    remaining_quota: number;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const q = new URLSearchParams({
          treatment_id: selectedTreatmentId,
          date: selectedDate,
          staff_id: selectedStaffId,
        });
        const res = await fetch(`/api/v1/client/slots?${q.toString()}`);
        const data = await res.json();
        if (!ignore && data.available_slots) {
          setSlots(data.available_slots);
          const firstAvail = data.available_slots.find(
            (s: SlotCheckResult) => s.available
          );
          if (firstAvail) {
            setSelectedSlot(firstAvail.start_time);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    }
    fetchSlots();
    return () => {
      ignore = true;
    };
  }, [selectedTreatmentId, selectedDate, selectedStaffId, db.appointments]);

  const handleStartBooking = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId);
    setActiveTab("BOOKING");
  };

  const handleSubmitAppointment = async () => {
    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/v1/client/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer LIFF_JWT_${currentMember.line_user_id}`,
        },
        body: JSON.stringify({
          member_id: currentMember.id,
          treatment_id: selectedTreatmentId,
          staff_id: selectedStaffId,
          date: selectedDate,
          start_time: `${selectedDate}T${selectedSlot}:00+08:00`,
          notes: bookingNotes,
          signature_data_url: signatureUrl || "LIFF_DIGITAL_SIGNATURE",
          health_questionnaire: {
            has_retinoids_use: hasRetinoids,
            is_pregnant: isPregnant,
            recent_sun_exposure: recentSun,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.message || "預約未完成，請重新選擇時段", "error");
        return;
      }

      setShowQuestionnaireSheet(false);
      setBookingSuccessModal({
        appointment_no: data.appointment_no,
        treatment_name: data.appointment.treatment_name,
        date: data.appointment.date,
        time: `${data.appointment.start_time} - ${data.appointment.end_time}`,
        staff_name: data.appointment.staff_name,
        room_name: data.appointment.room_name,
      });
      toast(`預約已確認（單號 ${data.appointment_no}）`, "success");
      await onRefresh();
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleJoinWaitlist = async (slotTime: string) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_WAITLIST",
        member_id: currentMember.id,
        treatment_id: selectedTreatmentId,
        staff_id: selectedStaffId,
        date: selectedDate,
        slot_time: slotTime,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`已登記 ${selectedDate} ${slotTime} 候補釋出通知`, "success");
      await onRefresh();
    }
  };

  const handleLineInteractiveFeedback = async (
    jobId: string,
    feedbackType: "CONFIRM_ATTENDANCE" | "DISCOMFORT_ALERT"
  ) => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TRIGGER_LINE_JOB",
        job_id: jobId,
        feedback_type: feedbackType,
      }),
    });
    const data = await res.json();
    if (data.success) {
      if (feedbackType === "DISCOMFORT_ALERT") {
        toast("已收到您的術後反應，專責護理師將立即致電與您聯繫", "warning");
      } else {
        toast("感謝您的出席確認，屆時敬候光臨", "success");
      }
      await onRefresh();
    }
  };

  const calendarDays = [
    { date: "2026-03-10", dayLabel: "週二", num: "10" },
    { date: "2026-03-11", dayLabel: "週三", num: "11" },
    { date: "2026-03-12", dayLabel: "週四", num: "12" },
    { date: "2026-03-13", dayLabel: "週五", num: "13" },
    { date: "2026-03-14", dayLabel: "週六", num: "14" },
  ];

  const memberAppointments = db.appointments.filter(
    (a) => a.member_id === currentMember.id
  );
  const memberJobs = db.line_jobs.filter(
    (j) => j.member_id === currentMember.id
  );

  return (
    <div className="mx-auto max-w-[420px] bg-ivory min-h-[790px] border border-[#D8D0C5] shadow-[0_12px_40px_-12px_rgba(44,42,41,0.12)] overflow-hidden flex flex-col relative">
      {/* Top Japanese Clinic Style Header in Traditional Chinese */}
      <div className="bg-white border-b border-[#E6E0D6] px-6 pt-5 pb-4">
        <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-graphite/50 mb-3">
          <span className="font-display uppercase">
            LINE VIP PASS • {currentMember.member_code}
          </span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-ivory text-graphite text-[11px] px-2 py-0.5 border border-[#DED7CC] focus:outline-none tracking-wider"
          >
            {db.members.map((m) => (
              <option key={m.id} value={m.id}>
                切換貴賓：{m.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] text-roseGold-dark font-display uppercase">
              MUKO DERMATOLOGY & AESTHETICS
            </div>
            <h1 className="text-lg font-serif font-medium text-graphite mt-0.5 tracking-widest">
              沐光美學診所
            </h1>
            <p className="text-xs text-graphite/65 mt-1.5 tracking-wider">
              {currentMember.full_name} 貴賓 ｜ 剩餘療程{" "}
              <span className="font-serif font-semibold text-graphite underline underline-offset-4 decoration-roseGold">
                {totalRemainingQuota} 堂
              </span>{" "}
              ｜ 儲值金 NT${currentMember.wallet_balance.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("WALLET")}
            className="p-2.5 border border-[#DED7CC] bg-ivory text-graphite hover:border-roseGold transition"
            title="出示會員憑證"
          >
            <QrCode className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-6">
        {/* ==================== TAB 1: HOME (診所首頁) ==================== */}
        {activeTab === "HOME" && (
          <>
            {/* 4 Minimalist Entry Cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("BOOKING")}
                className="jp-card p-4 text-left hover:border-roseGold transition group"
              >
                <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase">
                  01 / RESERVATION
                </div>
                <div className="text-sm font-serif font-medium text-graphite mt-1 group-hover:text-roseGold-dark transition">
                  線上預約
                </div>
                <div className="text-[11px] text-graphite/50 mt-0.5">
                  全預約制・即時空檔查詢
                </div>
              </button>

              <button
                onClick={() => setActiveTab("WALLET")}
                className="jp-card p-4 text-left hover:border-roseGold transition group"
              >
                <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase">
                  02 / TICKET & PASS
                </div>
                <div className="text-sm font-serif font-medium text-graphite mt-1 group-hover:text-roseGold-dark transition">
                  我的療程票夾
                </div>
                <div className="text-[11px] text-graphite/50 mt-0.5">
                  目前持有 {totalRemainingQuota} 堂療程
                </div>
              </button>

              <button
                onClick={() => setActiveTab("CARE_REMINDERS")}
                className="jp-card p-4 text-left hover:border-roseGold transition group col-span-2"
              >
                <div className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase">
                  03 / AFTERCARE
                </div>
                <div className="text-sm font-serif font-medium text-graphite mt-1 group-hover:text-roseGold-dark transition">
                  術後關懷與通知
                </div>
                <div className="text-[11px] text-graphite/50 mt-0.5">
                  出席確認與居家修護指引
                </div>
              </button>
            </div>

            {/* Next Scheduled Visit Card */}
            {memberAppointments.filter((a) => a.status !== "CANCELLED").length >
              0 && (
              <div className="border border-roseGold/50 bg-white p-4 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-2">
                  <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase">
                    UPCOMING APPOINTMENT
                  </span>
                  <span className="text-[11px] font-serif text-status-success tracking-widest">
                    ● 預約已確認
                  </span>
                </div>
                {(() => {
                  const latest = memberAppointments.find(
                    (a) => a.status !== "CANCELLED"
                  )!;
                  return (
                    <div className="text-xs space-y-1 pt-0.5">
                      <div className="font-serif font-medium text-sm text-graphite">
                        {latest.treatment_name}
                      </div>
                      <div className="text-graphite/70 tracking-wider">
                        日期時段：{latest.date.replace(/-/g, ".")} ｜{" "}
                        {latest.start_time} – {latest.end_time}
                      </div>
                      <div className="text-graphite/60 tracking-wider">
                        專屬安排：{latest.staff_name}（{latest.room_name}）
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Treatment Menu */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-[#E6E0D6] pb-2">
                <div>
                  <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                    TREATMENT MENU
                  </span>
                  <h2 className="text-base font-serif font-medium text-graphite">
                    精選皮膚管理與光療項目
                  </h2>
                </div>
                <span className="text-[11px] text-graphite/50 font-serif">
                  獨立包廂制
                </span>
              </div>

              {treatments.map((trt) => (
                <div
                  key={trt.id}
                  className="jp-card p-4 space-y-3 hover:border-roseGold/70 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] tracking-widest text-roseGold-dark font-serif">
                        {trt.category}
                      </span>
                      <h3 className="text-sm font-serif font-medium text-graphite mt-0.5">
                        {trt.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-graphite/45 block tracking-wider">
                        初次體驗價
                      </span>
                      <span className="text-base font-display font-semibold text-graphite">
                        NT${(trt.trial_price || trt.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-graphite/65 leading-relaxed">
                    {trt.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#EFEAE2]">
                    <span className="text-[11px] text-graphite/50 tracking-wider">
                      所需時間 {trt.duration_min} 分鐘（含包廂清消 {trt.buffer_min}{" "}
                      分鐘）
                    </span>
                    <button
                      onClick={() => handleStartBooking(trt.id)}
                      className="px-4 py-1.5 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                    >
                      預約此療程
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== TAB 2: BOOKING (線上預約) ==================== */}
        {activeTab === "BOOKING" && (
          <div className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#E6E0D6] pb-3">
              <div>
                <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                  RESERVATION SCHEDULE
                </span>
                <h2 className="text-base font-serif font-medium text-graphite">
                  選擇預約時段與指定操作師
                </h2>
              </div>
              <button
                onClick={() => setActiveTab("HOME")}
                className="text-xs text-graphite/55 hover:text-graphite font-serif tracking-wider"
              >
                返回療程列表
              </button>
            </div>

            {/* Step 01: Treatment */}
            <div className="space-y-1.5">
              <label className="text-xs font-serif text-graphite flex items-center gap-2">
                <span className="text-[10px] font-display tracking-widest text-roseGold-dark">
                  STEP 01
                </span>
                選擇療程項目
              </label>
              <select
                value={selectedTreatmentId}
                onChange={(e) => setSelectedTreatmentId(e.target.value)}
                className="w-full border border-[#D8D0C5] bg-white px-3.5 py-2.5 text-xs text-graphite focus:outline-none focus:border-roseGold"
              >
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（施作 {t.duration_min}分鐘）
                  </option>
                ))}
              </select>
            </div>

            {/* Step 02: Staff */}
            <div className="space-y-1.5">
              <label className="text-xs font-serif text-graphite flex items-center gap-2">
                <span className="text-[10px] font-display tracking-widest text-roseGold-dark">
                  STEP 02
                </span>
                指定醫師或皮膚管理師
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full border border-[#D8D0C5] bg-white px-3.5 py-2.5 text-xs text-graphite focus:outline-none focus:border-roseGold"
              >
                {db.staff
                  .filter(
                    (s) => s.role === "BEAUTICIAN" || s.role === "DOCTOR"
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Step 03: Calendar Strip */}
            <div className="jp-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif text-graphite">2026年 3月</span>
                <span className="text-[10px] text-graphite/50 tracking-wider">
                  獨立包廂・專用儀器 即時防衝突檢核
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                {calendarDays.map((d) => {
                  const active = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`py-2.5 border transition ${
                        active
                          ? "border-graphite bg-graphite text-ivory"
                          : "border-[#E6E0D6] bg-ivory/60 text-graphite hover:border-roseGold"
                      }`}
                    >
                      <div className="text-[10px] opacity-65 font-serif">
                        {d.dayLabel}
                      </div>
                      <div className="text-sm font-display font-semibold mt-0.5">
                        {d.num}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Slots */}
            <div className="jp-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif text-graphite">
                  可預約時段（○ 可預約 ／ × 已額滿）
                </span>
                {loadingSlots && (
                  <span className="text-[11px] text-graphite/45">
                    查詢空檔中...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {slots.map((slot) => {
                  const isSelected =
                    slot.available && selectedSlot === slot.start_time;
                  if (slot.available) {
                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        onClick={() => setSelectedSlot(slot.start_time)}
                        className={`p-3 border text-left transition ${
                          isSelected
                            ? "border-graphite bg-graphite text-ivory"
                            : "border-[#D8D0C5] bg-white text-graphite hover:border-roseGold"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-display font-semibold tracking-wider">
                            {slot.start_time}
                          </span>
                          <span
                            className={`text-[11px] font-serif ${
                              isSelected
                                ? "text-roseGold-light"
                                : "text-roseGold-dark"
                            }`}
                          >
                            ○ 可預約
                          </span>
                        </div>
                        <div
                          className={`text-[10px] mt-1 ${
                            isSelected ? "text-ivory/75" : "text-graphite/50"
                          }`}
                        >
                          {slot.allocated_room_name?.split(" ")[0]}
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={slot.start_time}
                      className="p-3 border border-[#EAE4DA] bg-[#F5F2EC] text-graphite/45 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-display">
                          {slot.start_time}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleJoinWaitlist(slot.start_time)}
                          className="text-[10px] px-2 py-0.5 border border-roseGold/60 bg-white text-graphite hover:bg-roseGold/15 transition font-serif"
                        >
                          候補登記
                        </button>
                      </div>
                      <div className="text-[10px] text-graphite/45 mt-1 truncate">
                        ×{" "}
                        {slot.reason === "MACHINE_UNAVAILABLE"
                          ? "專用儀器使用中"
                          : slot.reason === "STAFF_UNAVAILABLE"
                          ? "操作師施作或清消中"
                          : "包廂已滿"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-serif text-graphite">
                特殊需求或膚況備註（選填）
              </label>
              <textarea
                rows={2}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="例：鼻翼毛孔加強清潔、希望延長敷麻時間..."
                className="w-full border border-[#D8D0C5] bg-white p-3 text-xs text-graphite focus:outline-none focus:border-roseGold"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowQuestionnaireSheet(true)}
              className="w-full py-3.5 bg-graphite text-ivory font-serif text-xs tracking-[0.18em] hover:bg-roseGold-dark transition"
            >
              下一步：填寫術前健康評估與簽署
            </button>
          </div>
        )}

        {/* ==================== TAB 3: WALLET (會員憑證與療程票夾) ==================== */}
        {activeTab === "WALLET" && (
          <div className="space-y-5">
            {/* Minimalist Member Card */}
            <div className="bg-white border border-[#D5CBBF] p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between border-b border-[#EAE4DA] pb-3.5">
                <div>
                  <span className="text-[10px] font-display tracking-[0.24em] text-roseGold-dark uppercase block">
                    MEMBER IDENTIFICATION CARD
                  </span>
                  <h2 className="text-lg font-serif font-medium text-graphite mt-1 tracking-widest">
                    {currentMember.full_name}{" "}
                    <span className="text-xs font-normal text-graphite/60">
                      貴賓
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-graphite/45 block">
                    會員卡號
                  </span>
                  <span className="text-xs font-display tracking-widest text-graphite">
                    {currentMember.member_code}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-graphite/50 block font-serif">
                    儲值金餘額
                  </span>
                  <span className="text-base font-display font-semibold text-graphite mt-0.5 block">
                    NT${currentMember.wallet_balance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-graphite/50 block font-serif">
                    剩餘療程總堂數
                  </span>
                  <span className="text-base font-serif font-semibold text-roseGold-dark mt-0.5 block">
                    {totalRemainingQuota} 堂
                  </span>
                </div>
              </div>

              {/* Clean Barcode */}
              <div className="pt-2 border-t border-[#EAE4DA] text-center">
                <div className="h-7 w-full bg-[repeating-linear-gradient(90deg,#2C2A29,#2C2A29_1px,transparent_1px,transparent_4px,#2C2A29_4px,#2C2A29_6px,transparent_6px,transparent_9px)] opacity-80" />
                <div className="text-[10px] font-display tracking-[0.28em] text-graphite/60 mt-1.5">
                  {currentMember.member_code}
                </div>
              </div>
            </div>

            {/* Active Treatment Courses */}
            <div className="space-y-3">
              <div className="border-b border-[#E6E0D6] pb-1.5">
                <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                  ACTIVE COURSES
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite">
                  已購療程方案與核銷履歷
                </h3>
              </div>

              {memberPackages.map((pkg) => (
                <div key={pkg.id} className="jp-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-display tracking-widest text-graphite/50">
                        NO. {pkg.package_no}
                      </span>
                      <h4 className="text-sm font-serif font-medium text-graphite mt-0.5">
                        {pkg.treatment_name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setQrModalPkg(pkg)}
                      className="px-3 py-1 border border-[#D8D0C5] bg-ivory text-graphite text-[11px] font-serif hover:border-roseGold transition"
                    >
                      出示核銷碼
                    </button>
                  </div>

                  {/* Minimalist square session indicators */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: pkg.total_quota }).map((_, idx) => {
                      const used = idx < pkg.total_quota - pkg.remaining_quota;
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 flex-1 ${
                            used ? "bg-[#DED7CC]" : "bg-roseGold"
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-graphite/65 pt-1 border-t border-[#F1ECE4]">
                    <span>
                      總堂數 {pkg.total_quota} 堂 ／ 已核銷{" "}
                      {pkg.total_quota - pkg.remaining_quota} 堂 ／{" "}
                      <b className="text-graphite font-serif">
                        剩餘 {pkg.remaining_quota} 堂
                      </b>
                    </span>
                    <span className="text-[11px] text-graphite/45">
                      上次核銷: {pkg.last_consumed_at}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Signed Consents */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-serif text-graphite/75 tracking-wider">
                數位同意書與電子簽署副本
              </h3>
              {currentMember.consent_records.map((cs) => (
                <div key={cs.id} className="jp-subcard p-3 text-xs space-y-1">
                  <div className="font-serif text-graphite">{cs.title}</div>
                  <div className="text-[11px] text-graphite/55">
                    簽署時戳：{cs.signed_at}
                  </div>
                  <div className="font-mono text-[10px] text-graphite/40 truncate">
                    憑證雜湊: {cs.sha256_hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CARE & REMINDERS (術後關懷與通知) ==================== */}
        {activeTab === "CARE_REMINDERS" && (
          <div className="space-y-4">
            <div className="border-b border-[#E6E0D6] pb-2">
              <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                CONCIERGE MESSAGES
              </span>
              <h2 className="text-base font-serif font-medium text-graphite">
                出席確認與術後保養關懷通知
              </h2>
            </div>

            <div className="space-y-3">
              {memberJobs.map((job) => (
                <div key={job.id} className="jp-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-2">
                    <span className="text-xs font-serif font-medium text-graphite">
                      {job.label}
                    </span>
                    <span className="text-[10px] text-graphite/45">
                      {job.scheduled_for}
                    </span>
                  </div>

                  <p className="text-xs text-graphite/80 leading-relaxed">
                    {job.message_preview}
                  </p>

                  {job.customer_feedback && (
                    <div className="text-[11px] font-serif text-status-success pt-1">
                      ● {job.customer_feedback}
                    </div>
                  )}

                  {job.type === "SEND_PRE_TREATMENT_REMINDER" && (
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleLineInteractiveFeedback(
                            job.id,
                            "CONFIRM_ATTENDANCE"
                          )
                        }
                        className="flex-1 py-2 bg-graphite text-ivory text-xs font-serif tracking-widest hover:bg-roseGold-dark transition"
                      >
                        確認出席
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("BOOKING")}
                        className="flex-1 py-2 border border-[#D8D0C5] text-graphite text-xs font-serif tracking-widest hover:bg-ivory transition"
                      >
                        改期或取消
                      </button>
                    </div>
                  )}

                  {job.type === "SEND_POST_TREATMENT_CARE" && (
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleLineInteractiveFeedback(
                            job.id,
                            "CONFIRM_ATTENDANCE"
                          )
                        }
                        className="flex-1 py-2 border border-status-success/50 text-status-success text-xs font-serif tracking-wider hover:bg-status-success/5 transition"
                      >
                        膚況退紅良好
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleLineInteractiveFeedback(
                            job.id,
                            "DISCOMFORT_ALERT"
                          )
                        }
                        className="flex-1 py-2 border border-status-error/50 text-status-error text-xs font-serif tracking-wider hover:bg-status-error/5 transition"
                      >
                        紅腫不適（請護理師致電）
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== BOTTOM SHEET: 術前健康評估與電子同意書 ==================== */}
      {showQuestionnaireSheet && (
        <div className="absolute inset-0 bg-graphite/40 z-30 flex flex-col justify-end animate-fadeIn">
          <div className="bg-white border-t border-[#D8D0C5] p-5 space-y-4 max-h-[88%] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE4DA] pb-3">
              <div>
                <span className="text-[10px] font-display tracking-[0.2em] text-roseGold-dark uppercase block">
                  PRE-TREATMENT CONSENT
                </span>
                <h3 className="text-sm font-serif font-medium text-graphite">
                  術前健康評估與同意書簽署（{selectedDate} {selectedSlot}）
                </h3>
              </div>
              <button
                onClick={() => setShowQuestionnaireSheet(false)}
                className="p-1 text-graphite/50 hover:text-graphite"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-3 jp-subcard cursor-pointer">
                <span className="text-graphite/85">
                  1. 近一週內是否使用外用 A 酸、果酸或去角質產品？
                </span>
                <input
                  type="checkbox"
                  checked={hasRetinoids}
                  onChange={(e) => setHasRetinoids(e.target.checked)}
                  className="accent-graphite w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 jp-subcard cursor-pointer">
                <span className="text-graphite/85">
                  2. 目前是否處於懷孕、備孕或哺乳階段？
                </span>
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="accent-graphite w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 jp-subcard cursor-pointer">
                <span className="text-graphite/85">
                  3. 近兩週內是否有強烈戶外日曬或曬傷？
                </span>
                <input
                  type="checkbox"
                  checked={recentSun}
                  onChange={(e) => setRecentSun(e.target.checked)}
                  className="accent-graphite w-4 h-4"
                />
              </label>
            </div>

            <SignaturePad
              height={110}
              label="顧客親筆簽署欄（電子病歷同意書封存）"
              onChange={(url) => setSignatureUrl(url)}
            />

            <button
              type="button"
              disabled={submittingBooking}
              onClick={handleSubmitAppointment}
              className="w-full py-3.5 bg-graphite text-ivory font-serif text-xs tracking-[0.2em] hover:bg-roseGold-dark transition disabled:opacity-50"
            >
              {submittingBooking ? "正在保留預約時段..." : "同意並確認送出預約"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== BOOKING SUCCESS MODAL ==================== */}
      {bookingSuccessModal && (
        <div className="absolute inset-0 bg-graphite/45 z-40 flex items-center justify-center p-5">
          <div className="bg-white border border-[#D8D0C5] p-6 w-full space-y-4 text-center shadow-xl">
            <span className="text-[10px] font-display tracking-[0.25em] text-roseGold-dark uppercase block">
              RESERVATION CONFIRMED
            </span>
            <h3 className="text-base font-serif font-medium text-graphite">
              已完成您的預約登記
            </h3>
            <div className="text-xs text-left jp-subcard p-3.5 space-y-1.5 text-graphite/80">
              <div>
                預約單號：
                <b className="font-mono">{bookingSuccessModal.appointment_no}</b>
              </div>
              <div>療程項目：{bookingSuccessModal.treatment_name}</div>
              <div>
                預約時間：{bookingSuccessModal.date} {bookingSuccessModal.time}
              </div>
              <div>
                專屬安排：{bookingSuccessModal.staff_name} ／{" "}
                {bookingSuccessModal.room_name}
              </div>
            </div>
            <button
              onClick={() => {
                setBookingSuccessModal(null);
                setActiveTab("CARE_REMINDERS");
              }}
              className="w-full py-2.5 bg-graphite text-ivory text-xs font-serif tracking-widest"
            >
              查看預約與關懷通知
            </button>
          </div>
        </div>
      )}

      {/* ==================== QR MODAL ==================== */}
      {qrModalPkg && (
        <div className="absolute inset-0 bg-graphite/45 z-40 flex items-center justify-center p-6">
          <div className="bg-white border border-[#D8D0C5] p-6 w-full space-y-4 text-center shadow-xl">
            <div className="flex justify-between items-center text-xs text-graphite/50">
              <span className="font-display tracking-widest">
                {qrModalPkg.package_no}
              </span>
              <button onClick={() => setQrModalPkg(null)}>
                <X className="w-4 h-4 text-graphite" />
              </button>
            </div>
            <h4 className="text-sm font-serif font-medium text-graphite">
              {qrModalPkg.treatment_name}
            </h4>
            <div className="p-5 jp-subcard flex flex-col items-center">
              <QrCode className="w-28 h-28 text-graphite stroke-[1.25]" />
              <span className="text-[10px] font-display tracking-[0.2em] text-graphite/55 mt-3">
                VERIFY-TOKEN-{qrModalPkg.package_no}
              </span>
            </div>
            <p className="text-xs text-graphite/65 font-serif">
              請於櫃檯出示此 QR 碼辦理單堂核銷（目前剩餘{" "}
              <b>{qrModalPkg.remaining_quota}</b> 堂）
            </p>
          </div>
        </div>
      )}

      {/* Minimalist Bottom Navigation Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-[#E6E0D6] px-2 py-2.5 grid grid-cols-4 text-center z-20">
        {[
          { id: "HOME", label: "預約首頁", en: "TOP" },
          { id: "BOOKING", label: "線上預約", en: "BOOK" },
          { id: "WALLET", label: "我的票夾", en: "PASS" },
          { id: "CARE_REMINDERS", label: "術後關懷", en: "CARE" },
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as LiffTab)}
              className={`flex flex-col items-center justify-center py-0.5 transition ${
                active
                  ? "text-graphite font-medium"
                  : "text-graphite/40 hover:text-graphite/70"
              }`}
            >
              <span
                className={`text-[9px] font-display tracking-[0.18em] ${
                  active ? "text-roseGold-dark font-semibold" : ""
                }`}
              >
                {item.en}
              </span>
              <span className="text-[11px] font-serif mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
