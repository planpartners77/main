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

const title = "플랜파트너스";
const description = "인터넷·휴대폰·가전렌탈·보험·상조를 비교해드리는 비교·중개 전문 플랫폼";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 카카오톡 등 SNS 공유 시 노출되는 이미지·문구(Open Graph)를 site-wide 기본값으로 설정.
// 대표 이미지는 현재 로고(logo.jpg)로 임시 지정 — 전용 공유 이미지(1200x630 권장)가
// 준비되면 이 파일만 교체하면 됨.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: title,
    url: siteUrl,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/images/logo.jpg", width: 483, height: 258, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/logo.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
