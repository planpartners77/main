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

  let topChannelByCode = new Map<string, string>();

  if (codeIds.length > 0) {
    const [{ data: clicksData }, { data: conversionsData }, { data: leadsData }] = await Promise.all([
      supabase.from("referral_clicks").select("code_id").in("code_id", codeIds),
      supabase
        .from("referral_conversions")
        .select("code_id")
        .in("code_id", codeIds)
        .eq("conversion_type", "registration"),
      // 리드에 실려온 utm_medium으로 코드별 어느 채널(카카오톡/블로그/문자 등)에서 실제 신청까지
      // 이어졌는지 본다. leads는 담당 카테고리 관리자만 볼 수 있어(is_admin_for_category), 로그인한
      // 관리자가 담당하지 않는 카테고리 리드는 이 집계에서 빠질 수 있다 — super_admin은 전체가 잡힌다.
      supabase.from("leads").select("referral_code_id, utm_medium").in("referral_code_id", codeIds),
    ]);

    clickCounts = (clicksData ?? []).reduce((map, row) => {
      map.set(row.code_id, (map.get(row.code_id) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

    registrationCounts = (conversionsData ?? []).reduce((map, row) => {
      map.set(row.code_id, (map.get(row.code_id) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

    const channelCountsByCode = new Map<string, Map<string, number>>();
    for (const row of leadsData ?? []) {
      if (!row.referral_code_id) continue;
      const channel = row.utm_medium ?? "(미기록)";
      const channelCounts = channelCountsByCode.get(row.referral_code_id) ?? new Map<string, number>();
      channelCounts.set(channel, (channelCounts.get(channel) ?? 0) + 1);
      channelCountsByCode.set(row.referral_code_id, channelCounts);
    }
    topChannelByCode = new Map(
      Array.from(channelCountsByCode.entries()).map(([codeId, channelCounts]) => {
        const [topChannel, topCount] = Array.from(channelCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        return [codeId, `${topChannel} ${topCount}`];
      }),
    );
  }

  const codesWithRealCounts = codes.map((c) => ({
    ...c,
    total_clicks: clickCounts.get(c.id) ?? 0,
    total_registrations: registrationCounts.get(c.id) ?? 0,
    top_channel: topChannelByCode.get(c.id) ?? null,
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
