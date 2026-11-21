"use client";

import React, { useState } from "react";
import { SkinLog } from "@/lib/db";

interface BeforeAfterSliderProps {
  log: SkinLog;
  memberName: string;
  memberCode: string;
}

export default function BeforeAfterSlider({
  log,
  memberName,
  memberCode,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="jp-card p-5 space-y-5">
      {/* Header & Clinical Record Metadata */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#EAE4DA] pb-3.5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-roseGold-dark font-display">
            DERMATOLOGY PROGRESS RECORD
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-sm font-serif font-medium text-graphite">
              {log.treatment_name}
            </span>
            <span className="text-xs text-graphite/55 border-l border-[#D8D0C5] pl-3">
              主責操作師：{log.operator_name}
            </span>
          </div>
          <p className="text-xs text-graphite/70 mt-1.5 leading-relaxed">
            臨床膚況觀察：{log.summary}
          </p>
        </div>

        <div className="text-[10px] tracking-widest text-graphite/55 border border-[#E2DBD0] bg-ivory px-2.5 py-1">
          院內加密調閱 • 授權時效剩餘 14分52秒
        </div>
      </div>

      {/* Interactive Split Comparison Viewport */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden select-none border border-[#DED7CC] bg-[#F7F3EE]">
        {/* AFTER Layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F2] via-[#F5ECE4] to-[#EFE2D6] flex flex-col justify-between p-5">
          <div className="flex justify-end">
            <span className="px-3 py-1 text-[11px] font-serif tracking-widest bg-white/90 text-graphite border border-[#DED7CC]">
              術後紀錄｜{log.date_after}
            </span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#F2E3D7] via-[#F9F1EA] to-[#FDFBF9] border border-white shadow-sm flex flex-col items-center justify-center relative">
              <div className="w-28 h-28 rounded-full border border-roseGold/30 flex items-center justify-center">
                <div className="text-center space-y-1">
                  <span className="text-[10px] tracking-[0.18em] text-roseGold-dark uppercase block font-display">
                    POST-CARE
                  </span>
                  <span className="text-xs font-serif text-graphite block">
                    角質紋理細緻均勻
                  </span>
                  <span className="text-[11px] text-status-success tracking-wider block">
                    細緻度評分 {log.pore_score_after}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-graphite/35 tracking-[0.16em] font-display text-right">
            MUKO CLINIC ARCHIVE • {memberCode} • {memberName}
          </div>
        </div>

        {/* BEFORE Layer */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#E8D7C9] via-[#DEC7B6] to-[#D2B6A2] flex flex-col justify-between p-5 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <div className="flex justify-start">
            <span className="px-3 py-1 text-[11px] font-serif tracking-widest bg-graphite/85 text-ivory">
              術前紀錄｜{log.date_before}
            </span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#CBB09C] via-[#DABFA9] to-[#E5CFC0] border border-white/60 flex flex-col items-center justify-center relative">
              <span className="absolute top-7 left-9 w-1.5 h-1.5 rounded-full bg-[#8C654E]/45" />
              <span className="absolute top-11 right-8 w-2 h-2 rounded-full bg-[#8C654E]/40" />
              <span className="absolute bottom-9 left-11 w-1.5 h-1.5 rounded-full bg-[#8C654E]/45" />
              <div className="text-center space-y-1 px-2">
                <span className="text-[10px] tracking-[0.18em] text-graphite/60 uppercase block font-display">
                  PRE-CARE
                </span>
                <span className="text-xs font-serif text-graphite block">
                  毛孔擴張・表皮色素沉著
                </span>
                <span className="text-[11px] text-graphite/75 tracking-wider block">
                  細緻度評分 {log.pore_score_before}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-graphite/40 tracking-[0.16em] font-display">
            CLINICAL PHOTOGRAPH • {memberCode}
          </div>
        </div>

        {/* Fine Hairline Vertical Divider */}
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-white/90 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/95 text-graphite border border-roseGold shadow-sm flex items-center justify-center text-[10px] tracking-tighter font-display">
            ◄►
          </div>
        </div>

        <input
          type="range"
          min={5}
          max={95}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          aria-label="術前術後對比滑桿"
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
        />
      </div>

      {/* Clinical Observation Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="p-3.5 jp-subcard">
          <div className="flex justify-between items-baseline text-xs mb-2">
            <span className="text-graphite/70 font-serif">毛孔紋理細緻度</span>
            <span className="font-display text-sm font-semibold text-graphite">
              {log.pore_score_before}{" "}
              <span className="text-roseGold-dark">→ {log.pore_score_after}</span>
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#E2DBD0] overflow-hidden">
            <div
              className="h-full bg-roseGold transition-all"
              style={{ width: `${log.pore_score_after}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 jp-subcard">
          <div className="flex justify-between items-baseline text-xs mb-2">
            <span className="text-graphite/70 font-serif">表皮色階勻淨度</span>
            <span className="font-display text-sm font-semibold text-graphite">
              {log.pigment_score_before}{" "}
              <span className="text-roseGold-dark">
                → {log.pigment_score_after}
              </span>
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#E2DBD0] overflow-hidden">
            <div
              className="h-full bg-graphite transition-all"
              style={{ width: `${log.pigment_score_after}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 jp-subcard">
          <div className="flex justify-between items-baseline text-xs mb-2">
            <span className="text-graphite/70 font-serif">角質層含水指標</span>
            <span className="font-display text-sm font-semibold text-graphite">
              {log.hydration_before}%{" "}
              <span className="text-status-success">→ {log.hydration_after}%</span>
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#E2DBD0] overflow-hidden">
            <div
              className="h-full bg-status-success transition-all"
              style={{ width: `${log.hydration_after}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
