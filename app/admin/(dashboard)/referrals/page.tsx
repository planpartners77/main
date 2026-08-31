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
  // referral_conversions)에서 코드별로 실제 재집계해 화면에는 이 값으로 덮어써 보여준다
  // (Bizmobile 관리자 API와 동일하게 "컬럼 신뢰도 문제"를 보완하는 방식).
  const codeIds = codes.map((c) => c.id);
  let clickCounts = new Map<string, number>();
  let registrationCounts = new Map<string, number>();

  if (codeIds.length > 0) {
    const [{ data: clicksData }, { data: conversionsData }] = await Promise.all([
      supabase.from("referral_clicks").select("code_id").in("code_id", codeIds),
      supabase
        .from("referral_conversions")
        .select("code_id")
        .in("code_id", codeIds)
        .eq("conversion_type", "registration"),
    ]);

    clickCounts = (clicksData ?? []).reduce((map, row) => {
      map.set(row.code_id, (map.get(row.code_id) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

    registrationCounts = (conversionsData ?? []).reduce((map, row) => {
      map.set(row.code_id, (map.get(row.code_id) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  const codesWithRealCounts = codes.map((c) => ({
    ...c,
    total_clicks: clickCounts.get(c.id) ?? 0,
    total_registrations: registrationCounts.get(c.id) ?? 0,
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
