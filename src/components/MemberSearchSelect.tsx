"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { Member } from "@/lib/db";
import { maskPhone } from "@/lib/engine";

interface MemberSearchSelectProps {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  isStoreManager: boolean;
  showWalletBalance?: boolean;
  placeholder?: string;
}

export default function MemberSearchSelect({
  members,
  value,
  onChange,
  isStoreManager,
  showWalletBalance = false,
  placeholder = "搜尋姓名、電話或會員編號...",
}: MemberSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedMember = members.find((m) => m.id === value) || members[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (!normalizedQuery) return true;
    const rawPhone = m.phone.replace(/-/g, "").toLowerCase();
    const queryNoDash = normalizedQuery.replace(/-/g, "");
    return (
      m.full_name.toLowerCase().includes(normalizedQuery) ||
      m.phone.toLowerCase().includes(normalizedQuery) ||
      rawPhone.includes(queryNoDash) ||
      m.member_code.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* 觸發選取按鈕 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full border bg-ivory px-3.5 py-2 text-left flex items-center justify-between gap-2 transition ${
          open
            ? "border-graphite bg-white ring-1 ring-graphite/20"
            : "border-[#D8D0C5] hover:border-roseGold"
        }`}
      >
        <span className="font-serif text-graphite truncate">
          {selectedMember ? (
            <>
              {selectedMember.full_name}（
              {maskPhone(selectedMember.phone, isStoreManager)}）
              {showWalletBalance && (
                <span className="text-graphite/65">
                  {" "}
                  — 儲值金餘額: NT$
                  {selectedMember.wallet_balance.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="text-graphite/45">請選擇會員</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-graphite/55 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉搜尋面板 */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-[#D8D0C5] shadow-xl z-40">
          {/* 搜尋輸入欄 */}
          <div className="p-2 border-b border-[#EAE4DA] bg-ivory/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-graphite/45 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-[#DED7CC] text-xs text-graphite placeholder:text-graphite/40 focus:outline-none focus:border-roseGold"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-graphite"
                  aria-label="清除搜尋"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 篩選後會員清單 */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[#F4EFE8]">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-graphite/45 font-serif">
                查無符合「{query}」的會員資料
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? "bg-roseGold-soft/80 text-graphite"
                        : "hover:bg-ivory text-graphite/85"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium text-graphite">
                          {m.full_name}
                        </span>
                        <span className="text-[10px] font-display text-graphite/50">
                          {m.member_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-graphite/60 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{maskPhone(m.phone, isStoreManager)}</span>
                        {showWalletBalance && (
                          <span className="text-roseGold-dark font-serif">
                            儲值金 NT${m.wallet_balance.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-roseGold-dark shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
