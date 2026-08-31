export type TrackType = "self_service" | "consult_required";
export type RegulationLevel = "low" | "medium" | "high";

export interface CategoryConfig {
  slug: string;
  name: string;
  trackType: TrackType;
  regulationLevel: RegulationLevel;
}

// 가이드 §4 카테고리 규제 등급 및 UX 트랙 기준. DB의 categories 테이블(§10-2)과 슬러그를 맞춘다.
export const CATEGORIES: CategoryConfig[] = [
  { slug: "travel", name: "여행", trackType: "self_service", regulationLevel: "low" },
  { slug: "internet", name: "인터넷", trackType: "self_service", regulationLevel: "low" },
  { slug: "mobile", name: "휴대폰", trackType: "self_service", regulationLevel: "medium" },
  { slug: "rental", name: "가전렌탈", trackType: "self_service", regulationLevel: "low" },
  { slug: "insurance", name: "보험", trackType: "consult_required", regulationLevel: "high" },
  { slug: "funeral", name: "상조", trackType: "consult_required", regulationLevel: "high" },
];

export function getCategory(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
