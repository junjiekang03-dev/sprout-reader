import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Literata } from "next/font/google";
import "./globals.css";

// 双字体策略(Organic Growth System):
//  - Be Vietnam Pro:全部 UI(导航/按钮/标签),现代友好无衬线
//  - Literata:仅用于故事正文,衬线、为长文阅读优化,仿纸书手感
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});
const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "芽芽阅读 SproutReader",
  description: "为中国孩子定制的英语母语化分级阅读 · 每天一篇,像母语者一样习得英语",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 平板/手机优先,阅读器内禁缩放误触
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${beVietnam.variable} ${literata.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
