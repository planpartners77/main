// 랜딩PG(lp) 카테고리 상품 스펙 — products.extra jsonb에 이 형태로 저장한다.
// 상세페이지 상단은 관리자가 입력한 HTML을 원본 그대로 렌더링하는 것으로 결정됐다
// (기존 CustomHeadScript와 동일한 신뢰 수준 — 별도 sanitize 라이브러리 없음).

export interface LandingPageExtra {
  detail_html: string;
}

export const EMPTY_LANDING_PAGE_EXTRA: LandingPageExtra = { detail_html: "" };

export function normalizeLandingPageExtra(raw: Record<string, unknown> | null | undefined): LandingPageExtra {
  const r = raw ?? {};
  return { detail_html: typeof r.detail_html === "string" ? r.detail_html : "" };
}
