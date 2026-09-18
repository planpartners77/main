// 랜딩PG(lp) 카테고리 상품 스펙 — products.extra jsonb에 이 형태로 저장한다.
// 상세페이지 상단은 관리자가 입력한 HTML을 원본 그대로 렌더링하는 것으로 결정됐다
// (기존 CustomHeadScript와 동일한 신뢰 수준 — 별도 sanitize 라이브러리 없음).

// LandingLeadForm의 카피(문구)만 상품별로 덮어쓸 수 있게 하는 오버라이드 값이다.
// null/빈 값이면 LandingLeadForm의 기본 문구를 그대로 쓴다 — 상품마다 매번 전체 문구를
// 다시 입력할 필요 없이 "다르게 하고 싶은 것만" 채우는 구조.
// 필드 구성(이름/연락처/시간대/문의내용) 자체는 leads.guest_contact 스키마와 묶여 있어
// 여기서 다루지 않는다 — 동적 필드 구성은 별도의 더 큰 작업으로 분리한다.
export interface LeadFormExtra {
  title: string | null;
  subtitle: string | null;
  preferred_time_options: string[] | null;
  memo_label: string | null;
  consent_privacy_label: string | null;
  consent_third_party_label: string | null;
  button_label: string | null;
  success_title: string | null;
  success_message: string | null;
}

export const EMPTY_LEAD_FORM_EXTRA: LeadFormExtra = {
  title: null,
  subtitle: null,
  preferred_time_options: null,
  memo_label: null,
  consent_privacy_label: null,
  consent_third_party_label: null,
  button_label: null,
  success_title: null,
  success_message: null,
};

export interface LandingPageExtra {
  detail_html: string;
  lead_form: LeadFormExtra;
}

export const EMPTY_LANDING_PAGE_EXTRA: LandingPageExtra = {
  detail_html: "",
  lead_form: EMPTY_LEAD_FORM_EXTRA,
};

function nullableString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function normalizeLeadFormExtra(raw: Record<string, unknown> | null | undefined): LeadFormExtra {
  const r = raw ?? {};
  const options = Array.isArray(r.preferred_time_options)
    ? r.preferred_time_options.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : null;
  return {
    title: nullableString(r.title),
    subtitle: nullableString(r.subtitle),
    preferred_time_options: options && options.length > 0 ? options : null,
    memo_label: nullableString(r.memo_label),
    consent_privacy_label: nullableString(r.consent_privacy_label),
    consent_third_party_label: nullableString(r.consent_third_party_label),
    button_label: nullableString(r.button_label),
    success_title: nullableString(r.success_title),
    success_message: nullableString(r.success_message),
  };
}

export function normalizeLandingPageExtra(raw: Record<string, unknown> | null | undefined): LandingPageExtra {
  const r = raw ?? {};
  return {
    detail_html: typeof r.detail_html === "string" ? r.detail_html : "",
    lead_form: normalizeLeadFormExtra(r.lead_form as Record<string, unknown> | null | undefined),
  };
}
