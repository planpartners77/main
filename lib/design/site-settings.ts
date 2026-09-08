import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface HomePageSettings {
  heroTagline: string;
  heroHeadline: string;
  heroSubcopy: string;
  sections: {
    incentive: boolean;
    trust: boolean;
    reviews: boolean;
    popular: boolean;
    why: boolean;
    cta: boolean;
  };
}

export interface SnsLink {
  platform: string;
  label: string;
  url: string | null;
  enabled: boolean;
}

export interface SeoSettings {
  googleSiteVerification: string | null;
  naverSiteVerification: string | null;
  metaDescription: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  siteTitle: string | null;
  headScript: string | null;
  indexable: boolean;
}

export const DEFAULT_HOME_PAGE_SETTINGS: HomePageSettings = {
  heroTagline: "비교하지 않으면 놓치는 혜택",
  heroHeadline: "대신 비교하고,\n더 유리한 조건을 찾아드려요",
  heroSubcopy: "인터넷·유심·가전렌탈·보험·상조, 다섯 개 카테고리를 한 곳에서 비교하세요.",
  sections: { incentive: true, trust: true, reviews: true, popular: true, why: true, cta: true },
};

export const DEFAULT_SNS_LINKS: SnsLink[] = [
  { platform: "naver_cafe", label: "네이버 카페", url: null, enabled: false },
  { platform: "facebook", label: "페이스북", url: null, enabled: false },
  { platform: "youtube", label: "유튜브", url: null, enabled: false },
  { platform: "instagram", label: "인스타그램", url: null, enabled: false },
  { platform: "tiktok", label: "틱톡", url: null, enabled: false },
];

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  googleSiteVerification: null,
  naverSiteVerification: null,
  metaDescription: null,
  faviconUrl: null,
  ogImageUrl: null,
  siteTitle: null,
  headScript: null,
  indexable: true,
};

async function getSettingValue(key: string): Promise<unknown | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function getHomePageSettings(): Promise<HomePageSettings> {
  const value = (await getSettingValue("home_page")) as Partial<HomePageSettings> | null;
  if (!value) return DEFAULT_HOME_PAGE_SETTINGS;
  return {
    ...DEFAULT_HOME_PAGE_SETTINGS,
    ...value,
    sections: { ...DEFAULT_HOME_PAGE_SETTINGS.sections, ...value.sections },
  };
}

export async function getSnsLinks(): Promise<SnsLink[]> {
  const value = (await getSettingValue("sns_links")) as { links?: SnsLink[] } | null;
  return value?.links ?? DEFAULT_SNS_LINKS;
}

// generateMetadata와 RootLayout이 각각 호출하므로 요청당 한 번만 조회되도록 캐싱한다.
export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  const value = (await getSettingValue("seo")) as Partial<SeoSettings> | null;
  if (!value) return DEFAULT_SEO_SETTINGS;
  return { ...DEFAULT_SEO_SETTINGS, ...value };
});
