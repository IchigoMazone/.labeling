import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mango Label Tool — Gán nhãn ảnh xoài",
  description:
    "Công cụ gán nhãn dataset ảnh xoài công nghiệp thủ công. Hỗ trợ 6 nhãn phân loại, phím tắt, và lưu metadata CSV/JSON.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-white text-zinc-900 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
