import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSeoSettings } from "@/lib/design/site-settings";
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
const defaultDescription = "인터넷·휴대폰·가전렌탈·보험·상조를 비교해드리는 비교·중개 전문 플랫폼";
// 배포 환경에 NEXT_PUBLIC_SITE_URL이 설정되지 않으면 localhost로 절대경로가 만들어져
// 카카오톡 등 외부 크롤러가 og:image를 가져오지 못해 공유 시 이미지가 아예 노출되지
// 않는다 — 실제 배포 도메인을 최종 폴백으로 지정해 항상 로고가 뜨도록 보장한다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://planpartners77.vercel.app";

// 카카오톡 등 SNS 공유 시 노출되는 이미지·문구(Open Graph)를 site-wide 기본값으로 설정.
// 대표 이미지는 현재 로고(logo.jpg)로 임시 지정 — 전용 공유 이미지(1200x630 권장)가
// 준비되면 이 파일만 교체하면 됨.
// 관리자 SEO 메뉴에서 입력한 구글/네이버 소유확인 코드와 메타설명을 반영하기 위해
// 정적 metadata 대신 DB를 조회하는 generateMetadata를 사용한다.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const description = seo.metaDescription?.trim() || defaultDescription;

  return {
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
    verification: {
      google: seo.googleSiteVerification || undefined,
      other: seo.naverSiteVerification
        ? { "naver-site-verification": seo.naverSiteVerification }
        : undefined,
    },
    robots: {
      index: seo.indexable,
      follow: seo.indexable,
    },
  };
}

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
