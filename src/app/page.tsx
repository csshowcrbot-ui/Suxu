"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RotateCcw, LogOut, UserCircle2 } from "lucide-react";
import { DatabaseState } from "@/lib/db";
import ClientLiffView from "@/components/ClientLiffView";
import AdminDashboardView from "@/components/AdminDashboardView";
import LoginView, { AuthUser } from "@/components/LoginView";

type ViewMode = "SPLIT" | "CLIENT_ONLY" | "ADMIN_ONLY";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "warning" | "error";
}

const AUTH_STORAGE_KEY = "muko_clinic_auth_user";

export default function HomePage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("ADMIN_ONLY");
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      message: string,
      type: "success" | "warning" | "error" = "success"
    ) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/v1/state");
    const json = await res.json();
    if (json.success) {
      setDb(json.data);
    }
  }, []);

  // 讀取既有的登入狀態（僅於瀏覽器端執行）
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        setAuthUser(parsed);
        setViewMode(parsed.mode === "CLIENT" ? "CLIENT_ONLY" : "ADMIN_ONLY");
      }
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      fetchState();
    }
  }, [authUser, fetchState]);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setViewMode(user.mode === "CLIENT" ? "CLIENT_ONLY" : "ADMIN_ONLY");
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // 忽略瀏覽器隱私模式儲存限制
    }
    addToast(`歡迎回來，${user.name}（${user.title}）`, "success");
  };

  const handleLogout = () => {
    const prevName = authUser?.name;
    setAuthUser(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // 忽略錯誤
    }
    if (prevName) {
      addToast(`${prevName} 已安全登出系統`, "success");
    }
  };

  const handleResetDemo = async () => {
    const res = await fetch("/api/v1/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RESET_DEMO" }),
    });
    const json = await res.json();
    if (json.success) {
      setDb(json.data);
      addToast("已還原至初始範例資料", "success");
    }
  };

  // 等待檢查登入狀態
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory text-graphite">
        <div className="text-center space-y-2">
          <div className="text-xs font-display tracking-[0.3em] text-roseGold-dark uppercase">
            MUKO DERMATOLOGY CLINIC
          </div>
          <p className="text-sm font-serif text-graphite/70">
            正在啟動沐光美學系統...
          </p>
        </div>
      </div>
    );
  }

  // 未登入時呈現登入畫面
  if (!authUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        {/* 登入畫面的系統通知橫幅 */}
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-5 py-3.5 shadow-lg border text-xs font-serif tracking-wider flex items-center gap-3 animate-fadeIn ${
                t.type === "success"
                  ? "bg-graphite text-ivory border-roseGold"
                  : t.type === "warning"
                  ? "bg-white text-graphite border-status-warning"
                  : "bg-status-error text-white border-status-error"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-roseGold shrink-0" />
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory text-graphite">
        <div className="text-center space-y-2">
          <div className="text-xs font-display tracking-[0.3em] text-roseGold-dark uppercase">
            MUKO DERMATOLOGY CLINIC
          </div>
          <p className="text-sm font-serif text-graphite/70">
            正在載入電子病歷與預約管理系統...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* 日式靜謐美學診所頂部導覽列 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#DED7CC] px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="border-r border-[#DED7CC] pr-4">
              <span className="text-[10px] font-display tracking-[0.28em] text-roseGold-dark uppercase block">
                MUKO CLINIC AESTHETICS
              </span>
              <span className="text-base font-serif font-medium text-graphite tracking-widest">
                沐光美學診所
              </span>
            </div>
            <p className="text-xs text-graphite/55 font-serif hidden lg:block tracking-wider">
              全預約制・獨立包廂診療 ｜ 電子病歷・療程核銷・耗材批號整合管理系統
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {authUser.mode === "ADMIN" && (
              <div className="flex border border-[#D8D0C5] bg-ivory p-0.5 text-xs font-serif">
                <button
                  type="button"
                  onClick={() => setViewMode("CLIENT_ONLY")}
                  className={`px-3.5 py-1.5 tracking-wider transition ${
                    viewMode === "CLIENT_ONLY"
                      ? "bg-graphite text-ivory"
                      : "text-graphite/65 hover:text-graphite"
                  }`}
                >
                  顧客端（LINE 線上預約）
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("ADMIN_ONLY")}
                  className={`px-3.5 py-1.5 tracking-wider transition ${
                    viewMode === "ADMIN_ONLY"
                      ? "bg-graphite text-ivory"
                      : "text-graphite/65 hover:text-graphite"
                  }`}
                >
                  後台管理端（診所營運）
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("SPLIT")}
                  className={`hidden xl:inline-block px-3.5 py-1.5 tracking-wider transition ${
                    viewMode === "SPLIT"
                      ? "bg-graphite text-ivory"
                      : "text-graphite/65 hover:text-graphite"
                  }`}
                >
                  雙端同步連動檢視
                </button>
              </div>
            )}

            {authUser.mode === "ADMIN" && (
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-3 py-1.5 border border-[#D8D0C5] text-xs font-serif text-graphite/70 hover:border-roseGold hover:text-graphite transition flex items-center gap-1.5"
                title="重置範例資料"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">重置資料</span>
              </button>
            )}

            {/* 目前登入身分資訊與登出按鈕 */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#DED7CC]">
              <div className="hidden sm:flex items-center gap-2 text-right">
                <UserCircle2 className="w-4 h-4 text-roseGold-dark shrink-0" />
                <div className="leading-tight">
                  <div className="text-xs font-serif font-medium text-graphite">
                    {authUser.name}
                  </div>
                  <div className="text-[10px] text-graphite/55">
                    {authUser.title}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 border border-[#D8D0C5] text-xs font-serif text-graphite/75 hover:border-status-error/60 hover:text-status-error transition flex items-center gap-1.5"
                title="登出系統"
              >
                <LogOut className="w-3 h-3" />
                <span>登出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Subtle Notification Banner */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3.5 shadow-lg border text-xs font-serif tracking-wider flex items-center gap-3 animate-fadeIn ${
              t.type === "success"
                ? "bg-graphite text-ivory border-roseGold"
                : t.type === "warning"
                ? "bg-white text-graphite border-status-warning"
                : "bg-status-error text-white border-status-error"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-roseGold shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-7">
        {viewMode === "CLIENT_ONLY" && (
          <div className="py-2">
            <ClientLiffView db={db} onRefresh={fetchState} toast={addToast} />
          </div>
        )}

        {viewMode === "ADMIN_ONLY" && (
          <AdminDashboardView db={db} onRefresh={fetchState} toast={addToast} />
        )}

        {viewMode === "SPLIT" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-4">
              <div className="mb-3 flex items-center justify-between border-b border-[#E2DBD0] pb-1.5">
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase">
                  CLIENT MOBILE VIEW
                </span>
                <span className="text-xs font-serif text-graphite/60">
                  顧客端 LINE 預約與個人票夾
                </span>
              </div>
              <ClientLiffView db={db} onRefresh={fetchState} toast={addToast} />
            </div>
            <div className="xl:col-span-8">
              <div className="mb-3 flex items-center justify-between border-b border-[#E2DBD0] pb-1.5">
                <span className="text-[10px] font-display tracking-[0.22em] text-roseGold-dark uppercase">
                  CLINIC ADMINISTRATION
                </span>
                <span className="text-xs font-serif text-graphite/60">
                  後台電子病歷與營運管理系統
                </span>
              </div>
              <AdminDashboardView
                db={db}
                onRefresh={fetchState}
                toast={addToast}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
