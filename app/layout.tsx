import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "QDS Design Auto",
  description: "디자인 시스템 기반 자동 컴포넌트 생성 도구",
};

/**
 * Root Layout
 * - 전역 스타일 적용
 * - Toast 알림 시스템 포함
 * - Dark mode 기본 적용
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
