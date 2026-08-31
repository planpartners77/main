export type TrackType = "self_service" | "consult_required";
export type RegulationLevel = "low" | "medium" | "high";

export interface SubCategoryConfig {
  slug: string;
  name: string;
  href: string;
  subcategories?: SubCategoryConfig[];
}

export interface CategoryConfig {
  slug: string;
  name: string;
  trackType: TrackType;
  regulationLevel: RegulationLevel;
  subcategories?: SubCategoryConfig[];
}

// 가이드 §4 카테고리 규제 등급 및 UX 트랙 기준. DB의 categories 테이블(§10-2)과 슬러그를 맞춘다.
// 여행(travel)은 하위에 '여행'(일반 여행 상품, 준비중)·'에듀' 두 갈래를 두고, '에듀'는 다시
// '영어캠프'(여기캠프 CRIS 골프 체험 등 교육성 프로그램, 기존 /travel 콘텐츠)·'화상영어'(준비중)
// 2차 하위카테고리를 둔다 — DB categories.slug/URL은 travel 하나로 유지.
export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "travel",
    name: "여행",
    trackType: "self_service",
    regulationLevel: "low",
    subcategories: [
      { slug: "general", name: "여행", href: "/travel/general" },
      {
        slug: "edu",
        name: "에듀",
        href: "/travel",
        subcategories: [
          { slug: "english-camp", name: "영어캠프", href: "/travel" },
          { slug: "video-english", name: "화상영어", href: "/travel/video-english" },
        ],
      },
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

// 관리자 "카테고리 진열순서" 설정(site_settings.category_order)을 반영해 정렬한다.
// order에 없는(추가되었지만 아직 설정에 반영 안 된) 카테고리는 원래 순서 그대로 뒤에 붙인다.
export function getOrderedCategories(order: string[]): CategoryConfig[] {
  const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));
  const ordered = order.map((slug) => bySlug.get(slug)).filter((c): c is CategoryConfig => !!c);
  const remaining = CATEGORIES.filter((c) => !order.includes(c.slug));
  return [...ordered, ...remaining];
}
