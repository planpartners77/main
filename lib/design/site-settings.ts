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

export interface CompanyInfo {
  companyName: string;
  ceo: string;
  bizRegNo: string;
  corpRegNo: string;
  address: string;
  bizType: string;
  bizItem: string;
  mailOrderRegNo: string | null;
  privacyOfficer: string | null;
  insuranceAgentRegNo: string | null;
  funeralInstallmentRegNo: string | null;
  introText: string;
  disclaimerText: string;
}

export interface LoginMethodsSettings {
  kakao: boolean;
  google: boolean;
}

export type TelegramNotificationType =
  | "signup"
  | "travel_lead"
  | "usim_lead"
  | "mobile_lead"
  | "consult_lead";

export interface TelegramNotificationSettings {
  masterEnabled: boolean;
  types: Record<TelegramNotificationType, boolean>;
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

// footer/회사소개 페이지가 참조하던 lib/business-info.ts 정적 상수를 admin에서 고칠 수 있게
// site_settings로 옮긴 것 — 값은 그 상수와 동일하게 시딩(0031_company_info_settings.sql).
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  companyName: "플랜파트너스",
  ceo: "유현",
  bizRegNo: "176-81-04087",
  corpRegNo: "110111-0966888",
  address: "서울특별시 종로구 인사동5길 25, 8층 812호(인사동, 하나로빌딩)",
  bizType: "도매 및 소매업",
  bizItem: "전자상거래 소매업",
  mailOrderRegNo: null,
  privacyOfficer: null,
  insuranceAgentRegNo: null,
  funeralInstallmentRegNo: null,
  introText:
    "플랜파트너스는 여러 통신사·보험사·상조회사를 비교해 가장 유리한 조건을 찾아드리는 비교·중개 전문 플랫폼입니다.",
  disclaimerText:
    "플랜파트너스는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 상품, 상품정보, 거래에 관한 의무와 책임은 거래당사자에게 있습니다.",
};

// 카카오는 심사 완료 전까지 관리자가 직접 켜기 전엔 false, 구글은 연동 전이라 UI에서 비활성.
export const DEFAULT_LOGIN_METHODS_SETTINGS: LoginMethodsSettings = {
  kakao: false,
  google: false,
};

// 관리자 > 텔레그램 알림 관리 화면에 표시할 알림 종류 메타데이터. app/api/notify가 처리하는
// type 문자열과 key가 1:1로 대응해야 한다(추가 시 route.ts 분기도 함께 늘려야 함).
export const TELEGRAM_NOTIFICATION_TYPE_INFO: {
  key: TelegramNotificationType;
  label: string;
  description: string;
}[] = [
  { key: "signup", label: "신규 회원가입", description: "이메일/카카오 등으로 새 회원이 가입할 때" },
  { key: "travel_lead", label: "여행 신청서 접수", description: "여행(CRIS 골프캠프) 신청서가 접수될 때" },
  { key: "usim_lead", label: "유심 요금제 신청서 접수", description: "유심 신청서폼을 통해 신청서가 접수될 때" },
  {
    key: "mobile_lead",
    label: "휴대폰 개통/기기변경 신청서 접수",
    description: "휴대폰 신청서폼을 통해 신청서가 접수될 때",
  },
  { key: "consult_lead", label: "무료 상담 신청 접수", description: "카테고리 무료 상담 신청이 접수될 때" },
];

export const DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS: TelegramNotificationSettings = {
  masterEnabled: true,
  types: {
    signup: true,
    travel_lead: true,
    usim_lead: true,
    mobile_lead: true,
    consult_lead: true,
  },
};

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

// Footer가 모든 페이지에서 렌더링되므로 요청당 한 번만 조회되도록 캐싱한다.
export const getCompanyInfo = cache(async (): Promise<CompanyInfo> => {
  const value = (await getSettingValue("company_info")) as Partial<CompanyInfo> | null;
  if (!value) return DEFAULT_COMPANY_INFO;
  return { ...DEFAULT_COMPANY_INFO, ...value };
});

// 로그인 폼(LoginForm)이 모든 요청에서 렌더링되므로 요청당 한 번만 조회되도록 캐싱한다.
export const getLoginMethodsSettings = cache(async (): Promise<LoginMethodsSettings> => {
  const value = (await getSettingValue("login_methods")) as Partial<LoginMethodsSettings> | null;
  if (!value) return DEFAULT_LOGIN_METHODS_SETTINGS;
  return { ...DEFAULT_LOGIN_METHODS_SETTINGS, ...value };
});

// DB 조회 없이도 쓸 수 있는 순수 함수로 분리 — /api/notify는 이미 만들어 둔 admin 클라이언트로
// 직접 site_settings를 조회하므로, 여기서 또 다른 supabase 클라이언트를 만들지 않고 이 함수로
// 정규화만 재사용한다(getTelegramNotificationSettings는 관리자 화면 렌더링 전용).
export function normalizeTelegramNotificationSettings(
  value: Partial<TelegramNotificationSettings> | null,
): TelegramNotificationSettings {
  return {
    masterEnabled: value?.masterEnabled ?? DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS.masterEnabled,
    types: { ...DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS.types, ...value?.types },
  };
}

export const getTelegramNotificationSettings = cache(async (): Promise<TelegramNotificationSettings> => {
  const value = (await getSettingValue("telegram_notifications")) as Partial<TelegramNotificationSettings> | null;
  return normalizeTelegramNotificationSettings(value);
});
