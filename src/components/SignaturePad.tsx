"use client";

import React, { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  height?: number;
  label?: string;
}

export default function SignaturePad({
  onChange,
  height = 128,
  label = "顧客親筆簽署欄｜本人數位簽名確認",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#2C2A29";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange("");
  };

  const quickSignDemo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.font = "400 26px 'Noto Serif TC', serif";
    ctx.fillStyle = "#2C2A29";
    ctx.fillText("林 雅 婷", 48, height / 2 + 8);
    ctx.font = "300 11px 'Cormorant Garamond', serif";
    ctx.fillStyle = "#8C8275";
    ctx.fillText(
      `SIGNED AT MUKO CLINIC  •  ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      48,
      height - 14
    );
    ctx.restore();
    setHasSigned(true);
    onChange(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-graphite/80">
        <span className="font-serif tracking-wider text-graphite">{label}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={quickSignDemo}
            className="text-[11px] px-2.5 py-0.5 border border-roseGold/50 text-graphite hover:bg-roseGold/10 transition tracking-wider"
          >
            帶入簽名範例
          </button>
          <button
            type="button"
            onClick={clearSignature}
            className="text-[11px] text-graphite/50 hover:text-status-error transition tracking-wider"
          >
            清除重簽
          </button>
        </div>
      </div>

      <div className="relative border border-[#D8D0C5] bg-[#FCFBF9] overflow-hidden">
        <span className="pointer-events-none absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-roseGold/60" />
        <span className="pointer-events-none absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-roseGold/60" />
        <span className="pointer-events-none absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-roseGold/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-roseGold/60" />

        <canvas
          ref={canvasRef}
          width={460}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full cursor-crosshair touch-none block"
          style={{ height: `${height}px` }}
        />
        {!hasSigned && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-graphite/35 text-xs tracking-widest">
            <span className="font-serif">請於此方框內親筆簽署姓名</span>
            <span className="text-[10px] mt-1 tracking-wider text-graphite/30">
              簽署完成後系統將自動封存時戳與 SHA-256 數位憑證
            </span>
          </div>
        )}
        {hasSigned && (
          <div className="pointer-events-none absolute bottom-2.5 right-3.5 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full border border-[#B55A52]/70 text-[#B55A52] text-[10px] font-serif flex items-center justify-center">
              印
            </span>
            <span className="text-[10px] text-graphite/55 tracking-widest">
              已確認簽署
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
