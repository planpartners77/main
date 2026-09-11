import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { parseUserAgent } from "@/lib/admin/visitor-parse";

// leads/profiles/settlements/coupon_redemptions/referral_clicks/referral_conversions는
// 사용자 활동량에 비례해 계속 커지는 테이블이라, 원본 행을 통째로 가져와 JS에서 집계하면
// (예전 referrals 페이지와 동일한 문제) 데이터가 쌓일수록 페이지가 느려진다. 이 6개 테이블의
// 집계는 admin_statistics_summary()/coupon_redemption_counts() RPC(0038 마이그레이션, DB의
// group by/sum)로 옮겼다. products/partners/reviews/coupons/categories/referral_codes는
// 관리자가 직접 등록하는 소규모 카탈로그 테이블이라(사용자 활동으로 늘어나지 않음) 기존처럼
// 그대로 fetch해서 화면에서 집계한다.

interface StatsSummary {
  leads_total: number;
  leads_by_status: Record<string, number>;
  leads_by_category: Record<string, number>;
  leads_monthly: { key: string; value: number }[];
  profiles_total: number;
  profiles_monthly: { key: string; value: number }[];
  profiles_by_tier: Record<string, number>;
  profiles_marketing_opted_in: number;
  settlements_total_amount: number;
  settlements_by_status_amount: Record<string, number>;
  settlements_monthly_amount: { key: string; value: number }[];
  settlements_by_partner_amount: Record<string, number>;
  referral_counts: Record<string, { clicks: number; conversions: number }>;
}

function monthLabelFromKey(key: string) {
  return `${Number(key.split("-")[1])}월`;
}

interface CouponStatRow {
  id: string;
  code: string;
  valid_until: string | null;
  is_active: boolean;
  max_redemptions: number | null;
}

interface ReferralCodeStatRow {
  id: string;
  code: string;
  name: string | null;
  type: "member" | "partner";
}

interface ProductStatRow {
  id: string;
  is_active: boolean;
  categories: { name: string } | null;
}

interface PartnerStatRow {
  id: string;
  contract_status: string;
  categories: { name: string } | null;
}

interface ReviewStatRow {
  id: string;
  rating: number;
  is_active: boolean;
  categories: { name: string } | null;
}

interface VisitorLogRow {
  visitor_id: string;
  ip: string | null;
  user_agent: string | null;
  path: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

interface VisitorStats {
  daily_unique: { key: string; value: number }[];
  daily_pageviews: { key: string; value: number }[];
  today_unique_count: number;
  today_pageview_count: number;
  period_unique_count: number;
}

function dayLabelFromKey(key: string) {
  const [, m, d] = key.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function countBy<T>(rows: T[], keyFn: (row: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function toItems(map: Map<string, number>, n?: number): { label: string; value: number }[] {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return (n ? entries.slice(0, n) : entries).map(([label, value]) => ({ label, value }));
}

function getCouponStatus(row: {
  valid_until: string | null;
  is_active: boolean;
  max_redemptions: number | null;
  redemption_count: number;
}): "active" | "inactive" | "expired" | "exhausted" {
  if (row.valid_until && new Date(row.valid_until) < new Date()) return "expired";
  if (!row.is_active) return "inactive";
  if (row.max_redemptions !== null && row.redemption_count >= row.max_redemptions) return "exhausted";
  return "active";
}

// 리드/문의 관리 페이지와 동일한 상태 색상 컨벤션(파랑/주황/초록/회색)을 재사용한다.
const LEAD_STATUS_COLOR: Record<string, string> = {
  received: "bg-blue-500",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
  canceled: "bg-gray-400",
};

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  draft: "등록",
  approved: "승인",
  paid: "지급완료",
  rejected: "반려",
};
const SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-400",
  approved: "bg-amber-500",
  paid: "bg-green-500",
  rejected: "bg-red-500",
};

const COUPON_STATUS_LABEL: Record<string, string> = {
  active: "사용가능",
  inactive: "비활성",
  expired: "만료",
  exhausted: "소진",
};
const COUPON_STATUS_COLOR: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  expired: "bg-red-500",
  exhausted: "bg-orange-500",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "계약중",
  paused: "일시중지",
  terminated: "해지",
};
const CONTRACT_STATUS_COLOR: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-amber-500",
  terminated: "bg-gray-400",
};

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{title}</p>
      {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

function BarList({
  items,
  colorClass = "bg-[var(--brand-blue)]",
  valueFormatter = (v: number) => v.toLocaleString("ko-KR"),
  emptyText = "데이터가 없습니다.",
  max,
}: {
  items: { label: string; value: number; colorClass?: string }[];
  colorClass?: string;
  valueFormatter?: (v: number) => string;
  emptyText?: string;
  max?: number;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">{emptyText}</p>;
  }
  const scaleMax = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-gray-500" title={item.label}>
            {item.label}
          </span>
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${item.colorClass ?? colorClass}`}
              style={{ width: `${Math.min(100, Math.round((item.value / scaleMax) * 100))}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-semibold text-[var(--brand-navy)]">
            {valueFormatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const MONTH_RANGE_OPTIONS: number[] = [3, 6, 12];
const DAY_RANGE_OPTIONS: number[] = [7, 14, 30];

export default async function AdminStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; days?: string }>;
}) {
  const { months, days } = await searchParams;
  const monthRange = MONTH_RANGE_OPTIONS.includes(Number(months)) ? Number(months) : 6;
  const dayRange = DAY_RANGE_OPTIONS.includes(Number(days)) ? Number(days) : 14;

  const supabase = await createClient();

  const [
    { data: summaryData },
    { data: redemptionCountsData },
    { data: couponsData },
    { data: referralCodesData },
    { data: productsData },
    { data: partnersData },
    { data: reviewsData },
    { data: recentVisitorLogsData },
    { data: visitorStatsData },
  ] = await Promise.all([
    supabase.rpc("admin_statistics_summary", { p_month_range: monthRange }),
    supabase.rpc("coupon_redemption_counts"),
    supabase.from("coupons").select("id, code, valid_until, is_active, max_redemptions"),
    supabase.from("referral_codes").select("id, code, name, type"),
    supabase.from("products").select("id, is_active, categories(name)"),
    supabase.from("partners").select("id, contract_status, categories(name)"),
    supabase.from("reviews").select("id, rating, is_active, categories(name)"),
    supabase
      .from("visitor_logs")
      .select("visitor_id, ip, user_agent, path, created_at, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("admin_visitor_stats", { p_day_range: dayRange }),
  ]);

  const stats = (summaryData ?? {}) as Partial<StatsSummary>;
  const coupons = (couponsData ?? []) as unknown as CouponStatRow[];
  const referralCodes = (referralCodesData ?? []) as unknown as ReferralCodeStatRow[];
  const products = (productsData ?? []) as unknown as ProductStatRow[];
  const partners = (partnersData ?? []) as unknown as PartnerStatRow[];
  const reviews = (reviewsData ?? []) as unknown as ReviewStatRow[];
  const recentVisitorLogs = (recentVisitorLogsData ?? []) as unknown as VisitorLogRow[];
  const visitorStats = (visitorStatsData ?? {}) as Partial<VisitorStats>;

  // 1. 리드 현황
  const leadsTotal = stats.leads_total ?? 0;
  const leadStatusByValue = stats.leads_by_status ?? {};
  const leadStatusItems = LEAD_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: leadStatusByValue[opt.value] ?? 0,
    colorClass: LEAD_STATUS_COLOR[opt.value],
  }));
  const leadCategoryItems = toItems(new Map(Object.entries(stats.leads_by_category ?? {})), 8);
  const leadMonthlyItems = (stats.leads_monthly ?? []).map((m) => ({ label: monthLabelFromKey(m.key), value: m.value }));

  // 2. 회원 현황
  const profilesTotal = stats.profiles_total ?? 0;
  const profileMonthlyItems = (stats.profiles_monthly ?? []).map((m) => ({
    label: monthLabelFromKey(m.key),
    value: m.value,
  }));
  const tierItems = toItems(new Map(Object.entries(stats.profiles_by_tier ?? {})));
  const marketingOptedIn = stats.profiles_marketing_opted_in ?? 0;
  const marketingRate = profilesTotal > 0 ? Math.round((marketingOptedIn / profilesTotal) * 100) : 0;
  const marketingItems = [
    { label: "동의", value: marketingOptedIn, colorClass: "bg-green-500" },
    { label: "미동의", value: profilesTotal - marketingOptedIn, colorClass: "bg-gray-400" },
  ];

  // 3. 정산 현황
  const settlementStatusAmount = new Map(Object.entries(stats.settlements_by_status_amount ?? {}));
  const settlementStatusItems = (["draft", "approved", "paid", "rejected"] as const).map((status) => ({
    label: SETTLEMENT_STATUS_LABEL[status],
    value: settlementStatusAmount.get(status) ?? 0,
    colorClass: SETTLEMENT_STATUS_COLOR[status],
  }));
  const settlementMonthlyItems = (stats.settlements_monthly_amount ?? []).map((m) => ({
    label: monthLabelFromKey(m.key),
    value: m.value,
  }));
  const settlementPartnerItems = toItems(new Map(Object.entries(stats.settlements_by_partner_amount ?? {})), 8);
  const totalSettlementAmount = stats.settlements_total_amount ?? 0;
  const paidSettlementAmount = settlementStatusAmount.get("paid") ?? 0;

  // 4. 쿠폰 사용 현황
  const redemptionCountByCoupon = new Map<string, number>();
  for (const r of redemptionCountsData ?? []) {
    redemptionCountByCoupon.set(r.coupon_id, r.redemption_count);
  }
  const couponsWithCounts = coupons.map((c) => ({
    ...c,
    redemption_count: redemptionCountByCoupon.get(c.id) ?? 0,
  }));
  const couponStatusCounts = countBy(couponsWithCounts, (c) => getCouponStatus(c));
  const couponStatusItems = (["active", "inactive", "expired", "exhausted"] as const).map((status) => ({
    label: COUPON_STATUS_LABEL[status],
    value: couponStatusCounts.get(status) ?? 0,
    colorClass: COUPON_STATUS_COLOR[status],
  }));
  const couponUsageItems = [...couponsWithCounts]
    .sort((a, b) => b.redemption_count - a.redemption_count)
    .slice(0, 8)
    .map((c) => ({ label: c.code, value: c.redemption_count }));
  const totalRedemptions = couponsWithCounts.reduce((sum, c) => sum + c.redemption_count, 0);

  // 5. 추천인 성과 (referrals 관리 페이지 기본값과 동일하게 파트너 코드 기준으로 집계)
  const referralCounts = stats.referral_counts ?? {};
  const partnerReferralCodes = referralCodes
    .filter((c) => c.type === "partner")
    .map((c) => ({
      ...c,
      clicks: referralCounts[c.id]?.clicks ?? 0,
      conversions: referralCounts[c.id]?.conversions ?? 0,
    }));
  const totalReferralClicks = partnerReferralCodes.reduce((sum, c) => sum + c.clicks, 0);
  const totalReferralConversions = partnerReferralCodes.reduce((sum, c) => sum + c.conversions, 0);
  const overallConversionRate =
    totalReferralClicks > 0 ? Math.round((totalReferralConversions / totalReferralClicks) * 100) : 0;
  const topReferralCodes = [...partnerReferralCodes].sort((a, b) => b.conversions - a.conversions).slice(0, 8);

  // 6. 상품·파트너 현황
  const activeProductCategoryItems = toItems(
    countBy(
      products.filter((p) => p.is_active),
      (p) => p.categories?.name ?? "미분류",
    ),
  );
  const partnerContractCounts = countBy(partners, (p) => p.contract_status);
  const partnerContractItems = (["active", "paused", "terminated"] as const).map((status) => ({
    label: CONTRACT_STATUS_LABEL[status],
    value: partnerContractCounts.get(status) ?? 0,
    colorClass: CONTRACT_STATUS_COLOR[status],
  }));
  const partnerCategoryItems = toItems(countBy(partners, (p) => p.categories?.name ?? "미분류"));

  // 7. 리뷰 현황
  const activeReviewCount = reviews.filter((r) => r.is_active).length;
  const pendingReviewCount = reviews.length - activeReviewCount;
  const avgRatingOverall = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const ratingByCategory = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const key = r.categories?.name ?? "미분류";
    const cur = ratingByCategory.get(key) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingByCategory.set(key, cur);
  }
  const categoryRatingItems = [...ratingByCategory.entries()]
    .map(([name, { sum, count }]) => ({ label: `${name} (${count})`, value: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const reviewCategoryCountItems = toItems(countBy(reviews, (r) => r.categories?.name ?? "미분류"), 8);

  // 8. 접속자 현황 (proxy.ts가 waitUntil로 기록하는 visitor_logs 기반, admin_visitor_stats RPC로 집계)
  const dailyUniqueItems = (visitorStats.daily_unique ?? []).map((d) => ({
    label: dayLabelFromKey(d.key),
    value: d.value,
  }));
  const dailyPageviewItems = (visitorStats.daily_pageviews ?? []).map((d) => ({
    label: dayLabelFromKey(d.key),
    value: d.value,
  }));
  const todayUniqueCount = visitorStats.today_unique_count ?? 0;
  const todayPageviewCount = visitorStats.today_pageview_count ?? 0;
  const periodUniqueCount = visitorStats.period_unique_count ?? 0;
  const recentVisitorItems = recentVisitorLogs.map((row) => ({
    ...row,
    ...parseUserAgent(row.user_agent),
  }));

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">통계</h1>
      <p className="mt-1 text-sm text-gray-500">
        리드·회원·정산·쿠폰·추천인·상품·리뷰·접속자 지표를 한눈에 모아보는 화면입니다.
      </p>

      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          월별 추이 기간
          <select name="months" defaultValue={String(monthRange)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            {MONTH_RANGE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                최근 {m}개월
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          접속자 기간
          <select name="days" defaultValue={String(dayRange)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            {DAY_RANGE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                최근 {d}일
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full bg-[var(--brand-navy)] px-4 py-1.5 text-xs font-semibold text-white">
          적용
        </button>
      </form>

      <Section title="리드 현황" description="상태별 처리 현황과 카테고리·월별 유입 추이">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="전체 리드" value={`${leadsTotal.toLocaleString("ko-KR")}건`} />
          <StatTile label="접수 대기" value={`${(leadStatusByValue.received ?? 0).toLocaleString("ko-KR")}건`} />
          <StatTile label="완료" value={`${(leadStatusByValue.completed ?? 0).toLocaleString("ko-KR")}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">상태별 현황</p>
        <div className="mt-2">
          <BarList items={leadStatusItems} valueFormatter={(v) => `${v}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 분포</p>
        <div className="mt-2">
          <BarList items={leadCategoryItems} valueFormatter={(v) => `${v}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">{`월별 추이 (최근 ${monthRange}개월)`}</p>
        <div className="mt-2">
          <BarList items={leadMonthlyItems} valueFormatter={(v) => `${v}건`} />
        </div>
      </Section>

      <Section title="회원 현황" description="신규가입 추이와 등급·마케팅 동의 분포">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="전체 회원" value={`${profilesTotal.toLocaleString("ko-KR")}명`} />
          <StatTile
            label="이번 달 신규가입"
            value={`${(profileMonthlyItems.at(-1)?.value ?? 0).toLocaleString("ko-KR")}명`}
          />
          <StatTile label="마케팅 동의율" value={`${marketingRate}%`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">{`신규가입 추이 (최근 ${monthRange}개월)`}</p>
        <div className="mt-2">
          <BarList items={profileMonthlyItems} valueFormatter={(v) => `${v}명`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">등급별 분포</p>
        <div className="mt-2">
          <BarList items={tierItems} valueFormatter={(v) => `${v}명`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">마케팅 수신 동의</p>
        <div className="mt-2">
          <BarList items={marketingItems} valueFormatter={(v) => `${v}명`} />
        </div>
      </Section>

      <Section title="정산 현황" description="상태별 정산 금액과 월별 추이, 파트너별 순위">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="전체 정산 금액" value={won(totalSettlementAmount)} />
          <StatTile label="지급완료 금액" value={won(paidSettlementAmount)} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">상태별 금액</p>
        <div className="mt-2">
          <BarList items={settlementStatusItems} valueFormatter={won} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">{`월별 정산 금액 추이 (최근 ${monthRange}개월)`}</p>
        <div className="mt-2">
          <BarList items={settlementMonthlyItems} valueFormatter={won} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">파트너별 정산 순위</p>
        <div className="mt-2">
          <BarList items={settlementPartnerItems} valueFormatter={won} />
        </div>
      </Section>

      <Section title="쿠폰 사용 현황" description="상태 분포와 사용량 상위 쿠폰">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="전체 쿠폰" value={`${coupons.length.toLocaleString("ko-KR")}개`} />
          <StatTile label="누적 사용" value={`${totalRedemptions.toLocaleString("ko-KR")}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">상태별 분포</p>
        <div className="mt-2">
          <BarList items={couponStatusItems} valueFormatter={(v) => `${v}개`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">사용량 상위 쿠폰</p>
        <div className="mt-2">
          <BarList items={couponUsageItems} valueFormatter={(v) => `${v}건`} />
        </div>
      </Section>

      <Section title="추천인 성과" description="파트너 추천 코드의 클릭 대비 전환 성과 (referrals 관리 화면과 동일하게 파트너 코드 기준)">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="총 클릭" value={`${totalReferralClicks.toLocaleString("ko-KR")}회`} />
          <StatTile label="총 전환(가입)" value={`${totalReferralConversions.toLocaleString("ko-KR")}건`} />
          <StatTile label="평균 전환율" value={`${overallConversionRate}%`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">전환 상위 코드</p>
        {topReferralCodes.length === 0 ? (
          <p className="mt-2 py-6 text-center text-sm text-gray-400">데이터가 없습니다.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400">
                  <th className="px-3 py-2">코드</th>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2 text-right">클릭</th>
                  <th className="px-3 py-2 text-right">전환</th>
                  <th className="px-3 py-2 text-right">전환율</th>
                </tr>
              </thead>
              <tbody>
                {topReferralCodes.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50">
                    <td className="px-3 py-2 font-medium">{c.code}</td>
                    <td className="px-3 py-2 text-gray-500">{c.name ?? "-"}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{c.clicks}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{c.conversions}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--brand-navy)]">
                      {c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="상품·파트너 현황" description="카테고리별 활성 상품 수와 파트너 계약 상태 분포">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="활성 상품"
            value={`${products.filter((p) => p.is_active).length.toLocaleString("ko-KR")}개`}
          />
          <StatTile label="전체 파트너" value={`${partners.length.toLocaleString("ko-KR")}곳`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 활성 상품 수</p>
        <div className="mt-2">
          <BarList items={activeProductCategoryItems} valueFormatter={(v) => `${v}개`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">파트너 계약 상태 분포</p>
        <div className="mt-2">
          <BarList items={partnerContractItems} valueFormatter={(v) => `${v}곳`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 파트너 수</p>
        <div className="mt-2">
          <BarList items={partnerCategoryItems} valueFormatter={(v) => `${v}곳`} />
        </div>
      </Section>

      <Section title="리뷰 현황" description="게시 상태와 카테고리별 평균 평점">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="전체 리뷰" value={`${reviews.length.toLocaleString("ko-KR")}건`} />
          <StatTile label="게시중" value={`${activeReviewCount.toLocaleString("ko-KR")}건`} />
          <StatTile label="평균 평점" value={`${avgRatingOverall.toFixed(1)}점`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">게시 상태</p>
        <div className="mt-2">
          <BarList
            items={[
              { label: "게시중", value: activeReviewCount, colorClass: "bg-green-500" },
              { label: "승인 대기", value: pendingReviewCount, colorClass: "bg-gray-400" },
            ]}
            valueFormatter={(v) => `${v}건`}
          />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 평균 평점 (5점 만점)</p>
        <div className="mt-2">
          <BarList items={categoryRatingItems} max={5} valueFormatter={(v) => `${v.toFixed(1)}점`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 리뷰 수</p>
        <div className="mt-2">
          <BarList items={reviewCategoryCountItems} valueFormatter={(v) => `${v}건`} />
        </div>
      </Section>

      <Section title="일 접속자 현황" description={`쿠키(pp_visitor_id) 기준 순 방문자·페이지뷰 추이 (최근 ${dayRange}일)`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="오늘 순 방문자" value={`${todayUniqueCount.toLocaleString("ko-KR")}명`} />
          <StatTile label="오늘 페이지뷰" value={`${todayPageviewCount.toLocaleString("ko-KR")}건`} />
          <StatTile label={`최근 ${dayRange}일 순 방문자`} value={`${periodUniqueCount.toLocaleString("ko-KR")}명`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">일별 순 방문자</p>
        <div className="mt-2">
          <BarList items={dailyUniqueItems} valueFormatter={(v) => `${v}명`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">일별 페이지뷰</p>
        <div className="mt-2">
          <BarList items={dailyPageviewItems} valueFormatter={(v) => `${v}건`} />
        </div>
      </Section>

      <Section title="접속자 현황" description="최근 접속 기록 (이름/IP/기기/브라우저/접속 경로)">
        {recentVisitorItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">접속 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                  <th className="px-3 py-2">시간</th>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">IP 주소</th>
                  <th className="px-3 py-2">기기</th>
                  <th className="px-3 py-2">브라우저</th>
                  <th className="px-3 py-2">접속 경로</th>
                </tr>
              </thead>
              <tbody>
                {recentVisitorItems.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {new Date(row.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium">
                      {row.profiles?.display_name ?? "비회원"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{row.ip ?? "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {row.deviceModel} ({row.osName})
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{row.browser}</td>
                    <td className="px-3 py-3 text-gray-500">{row.path ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
