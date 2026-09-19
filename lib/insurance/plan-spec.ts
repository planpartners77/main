// 보험(insurance) 카테고리 플랜 스펙 — products.extra jsonb에 이 형태로 저장한다.
// CategoryConsultLanding이 insurer/coverage_summary/monthly_premium 키를 그대로 읽으므로
// 필드명을 그 쪽과 반드시 맞춘다.

export interface InsurancePlanExtra {
  insurer: string;
  coverage_summary: string;
  monthly_premium: string;
}

export const EMPTY_INSURANCE_PLAN_EXTRA: InsurancePlanExtra = {
  insurer: "",
  coverage_summary: "",
  monthly_premium: "",
};

// DB에서 읽은 extra(Record<string, unknown>)를 안전하게 InsurancePlanExtra로 정규화한다.
// 관리자 입력 누락/구버전 데이터가 있어도 폼이 깨지지 않도록 방어한다.
export function normalizeInsurancePlanExtra(raw: Record<string, unknown> | null | undefined): InsurancePlanExtra {
  const r = raw ?? {};
  return {
    insurer: typeof r.insurer === "string" ? r.insurer : "",
    coverage_summary: typeof r.coverage_summary === "string" ? r.coverage_summary : "",
    monthly_premium: typeof r.monthly_premium === "string" ? r.monthly_premium : "",
  };
}
