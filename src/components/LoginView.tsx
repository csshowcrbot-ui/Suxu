"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  CalendarCheck,
  FileText,
  PackageCheck,
} from "lucide-react";

export interface AuthUser {
  id: string;
  name: string;
  title: string;
  role: "ADMIN" | "DOCTOR" | "BEAUTICIAN" | "CONSULTANT" | "MEMBER";
  mode: "ADMIN" | "CLIENT";
  identifier: string;
}

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type LoginTab = "STAFF" | "CLIENT";

interface DemoAccount {
  label: string;
  account: string;
  password: string;
  user: AuthUser;
}

// 預設診所人員體驗帳號（對應系統內部人員資料）
const DEMO_STAFF_ACCOUNTS: DemoAccount[] = [
  {
    label: "診所管理員",
    account: "admin@muko.tw",
    password: "muko2026",
    user: {
      id: "staff-admin",
      name: "系統管理員",
      title: "診所營運總監",
      role: "ADMIN",
      mode: "ADMIN",
      identifier: "admin@muko.tw",
    },
  },
  {
    label: "Leo 醫師",
    account: "leo@muko.tw",
    password: "muko2026",
    user: {
      id: "staff-leo",
      name: "Leo 醫師",
      title: "雷射微整主治醫師",
      role: "DOCTOR",
      mode: "ADMIN",
      identifier: "leo@muko.tw",
    },
  },
  {
    label: "Anna 老師",
    account: "anna@muko.tw",
    password: "muko2026",
    user: {
      id: "staff-anna",
      name: "Anna 老師",
      title: "首席皮膚管理師",
      role: "BEAUTICIAN",
      mode: "ADMIN",
      identifier: "anna@muko.tw",
    },
  },
  {
    label: "Vivian 顧問",
    account: "vivian@muko.tw",
    password: "muko2026",
    user: {
      id: "staff-vivian",
      name: "Vivian 顧問",
      title: "資深醫美諮詢師",
      role: "CONSULTANT",
      mode: "ADMIN",
      identifier: "vivian@muko.tw",
    },
  },
];

// 預設顧客會員資料（對應系統初始會員）
const DEFAULT_CLIENT_USER: AuthUser = {
  id: "m-101",
  name: "林雅婷",
  title: "VIP 專屬會員・M-20260312",
  role: "MEMBER",
  mode: "CLIENT",
  identifier: "0912-345-678",
};

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<LoginTab>("STAFF");
  const [account, setAccount] = useState("admin@muko.tw");
  const [password, setPassword] = useState("muko2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 顧客端手機登入欄位
  const [clientPhone, setClientPhone] = useState("0912-345-678");
  const [clientBirthday, setClientBirthday] = useState("0518");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedAccount = account.trim().toLowerCase();
    if (!trimmedAccount || !password.trim()) {
      setErrorMsg("請輸入診所帳號與密碼");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const matched = DEMO_STAFF_ACCOUNTS.find(
        (item) =>
          item.account.toLowerCase() === trimmedAccount &&
          item.password === password
      );

      if (matched) {
        onLoginSuccess(matched.user);
      } else {
        setErrorMsg("帳號或密碼不正確，請確認或點擊下方快速體驗帳號。");
        setIsSubmitting(false);
      }
    }, 350);
  };

  const handleClientPhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedPhone = clientPhone.replace(/[^0-9]/g, "");
    if (normalizedPhone.length < 9) {
      setErrorMsg("請輸入正確的手機號碼格式");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (
        normalizedPhone === "0912345678" ||
        clientPhone.trim() === "0912-345-678"
      ) {
        onLoginSuccess(DEFAULT_CLIENT_USER);
      } else {
        onLoginSuccess({
          id: "m-guest",
          name: "預約貴賓",
          title: `LINE 認證會員・${clientPhone.trim()}`,
          role: "MEMBER",
          mode: "CLIENT",
          identifier: clientPhone.trim(),
        });
      }
    }, 350);
  };

  const handleLineQuickLogin = () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess(DEFAULT_CLIENT_USER);
    }, 300);
  };

  const applyDemoAccount = (demo: DemoAccount) => {
    setAccount(demo.account);
    setPassword(demo.password);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* 日式柔和背景光暈裝飾 */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-roseGold/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 w-[480px] h-[480px] rounded-full bg-terracotta/30 blur-3xl" />
      </div>

      {/* 主登入卡片容器 */}
      <div className="relative z-10 w-full max-w-[1040px] bg-white border border-[#E6E0D6] rounded-[8px] shadow-[0_20px_60px_-20px_rgba(44,42,41,0.12)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden animate-fadeIn">
        {/* 左側：品牌視覺與診所理念區 */}
        <div className="lg:col-span-5 bg-graphite text-ivory p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* 極細裝飾框線 */}
          <div className="pointer-events-none absolute inset-4 border border-roseGold/20 rounded-[4px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-64 h-64 rounded-full border border-roseGold/15" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-roseGold/10" />

          {/* 頂部品牌識別 */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-roseGold/35 bg-white/5 text-[10px] font-display tracking-[0.28em] text-roseGold-light uppercase">
              <Sparkles className="w-3 h-3 text-roseGold" />
              PRIVATE AESTHETIC CLINIC
            </div>

            <div className="space-y-2">
              <p className="text-xs font-display tracking-[0.34em] text-roseGold-light uppercase">
                MUKO CLINIC AESTHETICS
              </p>
              <h1 className="text-3xl font-serif font-medium tracking-[0.18em] text-ivory">
                沐光美學診所
              </h1>
              <div className="w-10 h-[1px] bg-roseGold/70 my-4" />
              <p className="text-xs sm:text-sm text-ivory/75 font-serif leading-relaxed tracking-wider">
                全預約制・獨立包廂診療。
                <br />
                以日式靜謐美學結合精準醫療管理，為每一位貴賓打造安心且專屬的肌膚煥新旅程。
              </p>
            </div>
          </div>

          {/* 中段系統特色清單 */}
          <div className="relative z-10 my-8 lg:my-0 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[4px] border border-roseGold/30 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4 text-roseGold-light" />
              </div>
              <div>
                <h3 className="text-xs font-serif text-ivory tracking-widest">
                  三維包廂與儀器防呆排程
                </h3>
                <p className="text-[11px] text-ivory/55 leading-relaxed mt-0.5">
                  即時整合醫師、獨立包廂與雷射機台，杜絕重複預約衝突。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[4px] border border-roseGold/30 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-roseGold-light" />
              </div>
              <div>
                <h3 className="text-xs font-serif text-ivory tracking-widest">
                  電子病歷與術前知情同意書
                </h3>
                <p className="text-[11px] text-ivory/55 leading-relaxed mt-0.5">
                  完整記錄膚況指標、對比追蹤照與數位簽署存證。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[4px] border border-roseGold/30 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <PackageCheck className="w-4 h-4 text-roseGold-light" />
              </div>
              <div>
                <h3 className="text-xs font-serif text-ivory tracking-widest">
                  耗材批號安全效期監控
                </h3>
                <p className="text-[11px] text-ivory/55 leading-relaxed mt-0.5">
                  療程核銷連動針劑與耗材批號扣帳，嚴守醫療品質安全。
                </p>
              </div>
            </div>
          </div>

          {/* 底部版權與安全標示 */}
          <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between text-[11px] text-ivory/50 font-serif">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-roseGold" />
              醫療資料加密傳輸保護
            </span>
            <span className="font-display tracking-widest">v1.0</span>
          </div>
        </div>

        {/* 右側：登入表單區 */}
        <div className="lg:col-span-7 p-7 sm:p-11 flex flex-col justify-between bg-white">
          <div>
            {/* 標題與說明 */}
            <div className="mb-7">
              <span className="text-[10px] font-display tracking-[0.28em] text-roseGold-dark uppercase block mb-1.5">
                SYSTEM ACCESS PORTAL
              </span>
              <h2 className="text-2xl font-serif font-medium text-graphite tracking-widest">
                歡迎回到沐光美學
              </h2>
              <p className="text-xs text-graphite/60 mt-1.5 tracking-wide">
                請選擇您的身分入口以進入預約或診所營運管理系統
              </p>
            </div>

            {/* 身分切換頁籤 */}
            <div className="grid grid-cols-2 border border-[#DED7CC] bg-ivory p-1 rounded-[6px] mb-7">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("STAFF");
                  setErrorMsg(null);
                }}
                className={`py-2.5 text-xs font-serif tracking-widest rounded-[4px] transition flex items-center justify-center gap-2 ${
                  activeTab === "STAFF"
                    ? "bg-graphite text-ivory shadow-sm"
                    : "text-graphite/65 hover:text-graphite"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                診所人員登入
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("CLIENT");
                  setErrorMsg(null);
                }}
                className={`py-2.5 text-xs font-serif tracking-widest rounded-[4px] transition flex items-center justify-center gap-2 ${
                  activeTab === "CLIENT"
                    ? "bg-graphite text-ivory shadow-sm"
                    : "text-graphite/65 hover:text-graphite"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                貴賓會員入口
              </button>
            </div>

            {/* 錯誤提示區塊 */}
            {errorMsg && (
              <div className="mb-5 px-4 py-3 bg-[#FDF5F4] border border-status-error/30 rounded-[4px] text-xs text-status-error flex items-center gap-2 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-status-error shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 頁籤一：診所人員登入表單 */}
            {activeTab === "STAFF" ? (
              <form onSubmit={handleStaffLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="staff-account"
                    className="block text-xs font-serif text-graphite/80 tracking-wider mb-2"
                  >
                    診所帳號 / 電子信箱
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-graphite/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="staff-account"
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="例如：admin@muko.tw"
                      className="w-full pl-10 pr-4 py-2.5 bg-ivory/60 border border-[#DED7CC] rounded-[4px] text-sm text-graphite placeholder:text-graphite/35 focus:outline-none focus:border-roseGold focus:bg-white transition"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="staff-password"
                      className="block text-xs font-serif text-graphite/80 tracking-wider"
                    >
                      登入密碼
                    </label>
                    <span className="text-[11px] text-roseGold-dark font-serif">
                      預設密碼：muko2026
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-graphite/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="staff-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="請輸入密碼"
                      className="w-full pl-10 pr-11 py-2.5 bg-ivory/60 border border-[#DED7CC] rounded-[4px] text-sm text-graphite placeholder:text-graphite/35 focus:outline-none focus:border-roseGold focus:bg-white transition"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/45 hover:text-graphite transition p-1"
                      aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-graphite/70 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-graphite w-3.5 h-3.5 rounded"
                    />
                    <span>保持登入狀態</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMsg(
                        "如需重設密碼，請聯繫診所系統管理員或使用下方體驗帳號。"
                      )
                    }
                    className="text-graphite/55 hover:text-roseGold-dark transition font-serif"
                  >
                    忘記密碼？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-graphite hover:bg-graphite-dark text-ivory text-xs font-serif tracking-[0.2em] rounded-[4px] transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>正在驗證身分...</span>
                  ) : (
                    <>
                      <span>進入診所管理系統</span>
                      <ArrowRight className="w-3.5 h-3.5 text-roseGold-light" />
                    </>
                  )}
                </button>

                {/* 快速體驗帳號選擇區 */}
                <div className="pt-5 border-t border-[#EAE4DA]">
                  <p className="text-[11px] font-serif text-graphite/55 tracking-wider mb-2.5">
                    快速帶入體驗帳號：
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_STAFF_ACCOUNTS.map((demo) => {
                      const isSelected =
                        account.toLowerCase() === demo.account.toLowerCase();
                      return (
                        <button
                          key={demo.account}
                          type="button"
                          onClick={() => applyDemoAccount(demo)}
                          className={`px-2.5 py-2 text-[11px] font-serif rounded-[4px] border transition text-center ${
                            isSelected
                              ? "border-roseGold bg-roseGold-soft text-graphite font-medium"
                              : "border-[#E6E0D6] bg-ivory/50 text-graphite/70 hover:border-roseGold/60 hover:bg-white"
                          }`}
                        >
                          {demo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            ) : (
              /* 頁籤二：貴賓會員（顧客端 LINE LIFF）登入區 */
              <div className="space-y-6">
                {/* LINE 一鍵快速登入 */}
                <div className="jp-subcard p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif text-graphite tracking-wider font-medium">
                      LINE 官方帳號快速授權
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-status-line/10 text-status-line rounded-full font-medium">
                      推薦使用
                    </span>
                  </div>
                  <p className="text-xs text-graphite/60 leading-relaxed">
                    免記憶密碼，直接連結您的沐光美學 LINE 會員檔案，查看剩餘療程堂數、線上預約與術後關懷紀錄。
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleLineQuickLogin}
                    className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-serif tracking-[0.16em] rounded-[4px] transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-60"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>
                      {isSubmitting
                        ? "正在連結 LINE 會員..."
                        : "使用 LINE 帳號一鍵登入（林雅婷 VIP）"}
                    </span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#EAE4DA] w-full" />
                  <span className="bg-white px-3 text-[11px] text-graphite/45 font-serif shrink-0">
                    或以手機號碼驗證登入
                  </span>
                  <div className="border-t border-[#EAE4DA] w-full" />
                </div>

                {/* 手機號碼登入表單 */}
                <form onSubmit={handleClientPhoneLogin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="client-phone"
                        className="block text-xs font-serif text-graphite/80 tracking-wider mb-1.5"
                      >
                        手機號碼
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-graphite/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="client-phone"
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="0912-345-678"
                          className="w-full pl-9 pr-3 py-2.5 bg-ivory/60 border border-[#DED7CC] rounded-[4px] text-sm text-graphite focus:outline-none focus:border-roseGold focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="client-birthday"
                        className="block text-xs font-serif text-graphite/80 tracking-wider mb-1.5"
                      >
                        生日月日（4 碼驗證）
                      </label>
                      <input
                        id="client-birthday"
                        type="text"
                        maxLength={4}
                        value={clientBirthday}
                        onChange={(e) => setClientBirthday(e.target.value)}
                        placeholder="例如：0518"
                        className="w-full px-3.5 py-2.5 bg-ivory/60 border border-[#DED7CC] rounded-[4px] text-sm text-graphite focus:outline-none focus:border-roseGold focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 border border-graphite text-graphite hover:bg-graphite hover:text-ivory text-xs font-serif tracking-[0.18em] rounded-[4px] transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>手機驗證進入貴賓專區</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 底部隱私聲明 */}
          <div className="mt-8 pt-4 border-t border-[#F1ECE4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-graphite/45">
            <span>© 2026 沐光美學診所 MUKO CLINIC</span>
            <span>本系統僅供診所授權人員與預約貴賓使用</span>
          </div>
        </div>
      </div>
    </div>
  );
}
