// 페이지 빌더의 "섹션 타입 레지스트리". 새 페이지를 만들 때 템플릿이 어떤 섹션들을
// 기본으로 깔아줄지, 관리자 화면에서 각 타입을 뭐라고 부르고 설정폼을 보여줄지 필요할지,
// 공개 화면(PageRenderer)에서 어떤 컴포넌트로 그릴지가 전부 이 파일의 타입 키(SectionType)를
// 기준으로 연결된다 — 새 섹션 타입을 추가할 때는 이 파일에 한 줄씩만 늘리면 된다.

export const SECTION_TYPES = [
  "hero",
  "banner_strip",
  "category_nav",
  "incentive",
  "trust_points",
  "reviews",
  "product_display",
  "why_steps",
  "cta",
  "rich_text",
  "notice_list",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export function isSectionType(value: string): value is SectionType {
  return (SECTION_TYPES as readonly string[]).includes(value);
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "히어로(메인 카피)",
  banner_strip: "상단 배너",
  category_nav: "카테고리 바로가기",
  incentive: "혜택 안내",
  trust_points: "신뢰 포인트",
  reviews: "고객 후기",
  product_display: "상품 진열",
  why_steps: "이용 절차 안내",
  cta: "하단 CTA",
  rich_text: "텍스트 블록",
  notice_list: "공지사항 목록",
};

// 고정 카피/디자인이라 관리자가 편집할 설정값이 없는 섹션은 false — on/off와 순서만 조정한다.
export const SECTION_HAS_CONFIG: Record<SectionType, boolean> = {
  hero: true,
  banner_strip: false,
  category_nav: false,
  incentive: false,
  trust_points: false,
  reviews: false,
  product_display: true,
  why_steps: false,
  cta: false,
  rich_text: true,
  notice_list: true,
};

export interface HeroSectionConfig {
  tagline: string;
  headline: string;
  subcopy: string;
}

export interface ProductDisplayConfig {
  title: string;
  mode: "latest" | "manual";
  categoryIds: string[];
  productIds: string[];
  limit: number;
}

export interface RichTextConfig {
  title: string;
  text: string;
}

export interface NoticeListConfig {
  title: string;
  limit: number;
}

export function defaultSectionConfig(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { tagline: "", headline: "", subcopy: "" } satisfies HeroSectionConfig;
    case "product_display":
      return {
        title: "추천 상품",
        mode: "latest",
        categoryIds: [],
        productIds: [],
        limit: 6,
      } satisfies ProductDisplayConfig;
    case "rich_text":
      return { title: "", text: "" } satisfies RichTextConfig;
    case "notice_list":
      return { title: "공지사항", limit: 5 } satisfies NoticeListConfig;
    default:
      return {};
  }
}

export interface PageTemplate {
  key: string;
  label: string;
  sections: SectionType[];
}

// 페이지 생성 시 고를 수 있는 템플릿 — 선택한 템플릿의 섹션 목록이 기본값으로 한 번에 깔린다.
// 이후 섹션 빌더 화면에서 자유롭게 추가/삭제/순서변경 가능하므로, 여기 목록은 "시작점"일 뿐이다.
export const PAGE_TEMPLATES: PageTemplate[] = [
  { key: "blank", label: "빈 페이지", sections: [] },
  {
    key: "category_landing",
    label: "카테고리 랜딩",
    sections: ["hero", "product_display", "trust_points", "reviews", "cta"],
  },
  {
    key: "event_landing",
    label: "이벤트 랜딩",
    sections: ["hero", "rich_text", "product_display", "cta"],
  },
];
