export type TrackType = "self_service" | "consult_required";
export type RegulationLevel = "low" | "medium" | "high";

export interface SubCategoryConfig {
  slug: string;
  name: string;
  href: string;
}

export interface CategoryConfig {
  slug: string;
  name: string;
  trackType: TrackType;
  regulationLevel: RegulationLevel;
  subcategories?: SubCategoryConfig[];
}

// 가이드 §4 카테고리 규제 등급 및 UX 트랙 기준. DB의 categories 테이블(§10-2)과 슬러그를 맞춘다.
// 여행(travel)은 하위에 '여행'(일반 여행 상품, 준비중)·'에듀'(여기캠프 CRIS 골프 체험 등 교육성
// 프로그램, 기존 /travel 콘텐츠) 두 갈래를 둔다 — DB categories.slug/URL은 travel로 유지.
export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "travel",
    name: "여행",
    trackType: "self_service",
    regulationLevel: "low",
    subcategories: [
      { slug: "general", name: "여행", href: "/travel/general" },
      { slug: "edu", name: "에듀", href: "/travel" },
    ],
  },
  { slug: "internet", name: "인터넷", trackType: "self_service", regulationLevel: "low" },
  { slug: "mobile", name: "휴대폰", trackType: "self_service", regulationLevel: "medium" },
  { slug: "rental", name: "가전렌탈", trackType: "self_service", regulationLevel: "low" },
  { slug: "insurance", name: "보험", trackType: "consult_required", regulationLevel: "high" },
  { slug: "funeral", name: "상조", trackType: "consult_required", regulationLevel: "high" },
];

export function getCategory(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
