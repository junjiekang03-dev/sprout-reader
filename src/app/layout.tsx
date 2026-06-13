import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="zh-CN">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
