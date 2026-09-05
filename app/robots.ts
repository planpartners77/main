import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/design/site-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://planpartner.co.kr";

// 관리자페이지 SEO > "노출 허용" 토글이 꺼지면 사이트 전체를 크롤링 차단한다
// (신규 오픈 전 임시 비공개, 장애 대응 등 긴급 상황용).
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();

  if (!seo.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/mypage", "/reset-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
