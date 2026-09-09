import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReferralManager, type ReferralCodeRow } from "@/components/admin/referrals/ReferralManager";

// 회원가입 시 자동 발급되는 개인 코드(type=member)까지 합치면 목록이 금세 파트너 코드에 묻혀버려
// 기본값은 파트너 코드만 보여준다(leads 페이지의 status 필터 탭과 동일한 패턴).
const TYPE_OPTIONS = [
  { value: "partner", label: "파트너" },
  { value: "member", label: "회원(자동발급)" },
];

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = type === "member" || type === "all" ? type : "partner";

  const supabase = await createClient();
  let query = supabase
    .from("referral_codes")
    .select(
      "id, code, name, type, parent_code_id, root_code_id, depth, total_clicks, total_registrations, is_active, expires_at",
    )
    .order("depth", { ascending: true })
    .order("code", { ascending: true });

  if (activeType !== "all") {
    query = query.eq("type", activeType);
  }

  const { data } = await query;
  const codes = (data ?? []) as ReferralCodeRow[];

  // total_clicks/total_registrations 컬럼을 그대로 믿지 않고, 로그 테이블(referral_clicks/
  // referral_conversions/leads)에서 코드별로 실제 재집계해 화면에는 이 값으로 덮어써 보여준다
  // (Bizmobile 관리자 API와 동일하게 "컬럼 신뢰도 문제"를 보완하는 방식).
  //
  // 예전에는 이 3개 테이블의 원본 행을 전부 가져와 JS Map으로 집계했는데, 로그가 쌓일수록
  // (코드 개수 × 코드당 클릭/리드 수에 비례해) DB→서버→브라우저로 옮기는 데이터량이 계속
  // 늘어나는 구조였다. group by 집계 자체를 DB(referral_code_stats, 0037 마이그레이션)로
  // 옮겨서 코드별로 이미 집계된 몇 개의 숫자만 받아오도록 바꿨다.
  // 참고: leads는 담당 카테고리 관리자만 볼 수 있어(is_admin_for_category) 이 함수도 호출자
  // 권한이 아니라 SQL 자체에서 전체 leads를 스캔한다 — 즉 '주요 채널' 집계는 로그인한 관리자의
  // 담당 카테고리와 무관하게 전체 리드 기준이며, super_admin이 보는 값과 동일하다(이전 버전의
  // '일반 관리자는 부분치만 본다'는 제약이 이번 변경으로 사라졌다).
  const codeIds = codes.map((c) => c.id);
  const statsByCode = new Map<string, { click_count: number; registration_count: number; top_channel: string | null }>();

  if (codeIds.length > 0) {
    const { data: statsData } = await supabase.rpc("referral_code_stats", { p_code_ids: codeIds });
    for (const row of statsData ?? []) {
      statsByCode.set(row.code_id, {
        click_count: row.click_count,
        registration_count: row.registration_count,
        top_channel: row.top_channel ? `${row.top_channel} ${row.top_channel_count}` : null,
      });
    }
  }

  const codesWithRealCounts = codes.map((c) => ({
    ...c,
    total_clicks: statsByCode.get(c.id)?.click_count ?? 0,
    total_registrations: statsByCode.get(c.id)?.registration_count ?? 0,
    top_channel: statsByCode.get(c.id)?.top_channel ?? null,
  }));

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">추천인 코드 관리</h1>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/admin/referrals?type=${opt.value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeType === opt.value
                  ? "bg-[var(--brand-navy)] text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
          <Link
            href="/admin/referrals?type=all"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeType === "all" ? "bg-[var(--brand-navy)] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            전체
          </Link>
        </div>
      </div>
      <div className="mt-6">
        <ReferralManager codes={codesWithRealCounts} />
      </div>
    </div>
  );
}
