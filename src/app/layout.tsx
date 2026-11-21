import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "沐光美學診所 MUKO CLINIC | 預約與營運管理系統",
  description:
    "日式私密美學診所預約與營運管理系統 — 結合電子病歷、三維空間儀器排程、耗材批號追蹤與 LINE 術後關懷。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Sans+TC:wght@300;400;500;600&family=Noto+Serif+TC:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-ivory text-graphite selection:bg-roseGold/20"
      >
        {children}
      </body>
    </html>
  );
}
