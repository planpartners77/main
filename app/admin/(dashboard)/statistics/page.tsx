import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";

// 대시보드와 동일한 원칙: leads/profiles/settlements/coupons/referral_*/products/partners/reviews
// 등 실제 DB 집계만 사용한다. 방문자 수 등 추적 인프라가 없는 지표는 지어내지 않는다.
// 집계는 각 관리 페이지(referrals/settlements/coupons)와 동일하게 원본 row를 fetch한 뒤
// JS에서 Map으로 직접 계산하는 방식을 따른다(SQL GROUP BY/RPC 미사용).

interface LeadStatRow {
  id: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
}

interface ProfileStatRow {
  id: string;
  created_at: string;
  marketing_opt_in: boolean;
  customer_tiers: { name: string | null } | null;
}

interface SettlementStatRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  partners: { name: string } | null;
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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: monthKey(d), label: `${d.getMonth() + 1}월` };
  });
}

function bucketByMonth(months: { key: string; label: string }[], rows: { created_at: string }[]) {
  const counts = new Map(months.map((m) => [m.key, 0]));
  for (const row of rows) {
    const key = monthKey(new Date(row.created_at));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
}

function bucketSumByMonth(months: { key: string; label: string }[], rows: { created_at: string; amount: number }[]) {
  const sums = new Map(months.map((m) => [m.key, 0]));
  for (const row of rows) {
    const key = monthKey(new Date(row.created_at));
    if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + row.amount);
  }
  return months.map((m) => ({ label: m.label, value: sums.get(m.key) ?? 0 }));
}

function countBy<T>(rows: T[], keyFn: (row: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function sumBy<T>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + valueFn(row));
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

export default async function AdminStatisticsPage() {
  const supabase = await createClient();

  const [
    { data: leadsData },
    { data: profilesData },
    { data: settlementsData },
    { data: couponsData },
    { data: couponRedemptionsData },
    { data: referralCodesData },
    { data: referralClicksData },
    { data: referralConversionsData },
    { data: productsData },
    { data: partnersData },
    { data: reviewsData },
  ] = await Promise.all([
    supabase.from("leads").select("id, status, created_at, categories(name)"),
    supabase.from("profiles").select("id, created_at, marketing_opt_in, customer_tiers(name)"),
    supabase.from("settlements").select("id, amount, status, created_at, partners(name)"),
    supabase.from("coupons").select("id, code, valid_until, is_active, max_redemptions"),
    supabase.from("coupon_redemptions").select("coupon_id"),
    supabase.from("referral_codes").select("id, code, name, type"),
    supabase.from("referral_clicks").select("code_id"),
    supabase.from("referral_conversions").select("code_id").eq("conversion_type", "registration"),
    supabase.from("products").select("id, is_active, categories(name)"),
    supabase.from("partners").select("id, contract_status, categories(name)"),
    supabase.from("reviews").select("id, rating, is_active, categories(name)"),
  ]);

  const leads = (leadsData ?? []) as unknown as LeadStatRow[];
  const profiles = (profilesData ?? []) as unknown as ProfileStatRow[];
  const settlements = (settlementsData ?? []) as unknown as SettlementStatRow[];
  const coupons = (couponsData ?? []) as unknown as CouponStatRow[];
  const referralCodes = (referralCodesData ?? []) as unknown as ReferralCodeStatRow[];
  const products = (productsData ?? []) as unknown as ProductStatRow[];
  const partners = (partnersData ?? []) as unknown as PartnerStatRow[];
  const reviews = (reviewsData ?? []) as unknown as ReviewStatRow[];

  const MONTHS = lastNMonths(6);

  // 1. 리드 현황
  const leadStatusCounts = countBy(leads, (l) => l.status);
  const leadStatusItems = LEAD_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: leadStatusCounts.get(opt.value) ?? 0,
    colorClass: LEAD_STATUS_COLOR[opt.value],
  }));
  const leadCategoryItems = toItems(countBy(leads, (l) => l.categories?.name ?? "미분류"), 8);
  const leadMonthlyItems = bucketByMonth(MONTHS, leads);

  // 2. 회원 현황
  const profileMonthlyItems = bucketByMonth(MONTHS, profiles);
  const tierItems = toItems(countBy(profiles, (p) => p.customer_tiers?.name ?? "일반"));
  const marketingOptedIn = profiles.filter((p) => p.marketing_opt_in).length;
  const marketingRate = profiles.length > 0 ? Math.round((marketingOptedIn / profiles.length) * 100) : 0;
  const marketingItems = [
    { label: "동의", value: marketingOptedIn, colorClass: "bg-green-500" },
    { label: "미동의", value: profiles.length - marketingOptedIn, colorClass: "bg-gray-400" },
  ];

  // 3. 정산 현황
  const settlementStatusAmount = sumBy(
    settlements,
    (s) => s.status,
    (s) => s.amount,
  );
  const settlementStatusItems = (["draft", "approved", "paid", "rejected"] as const).map((status) => ({
    label: SETTLEMENT_STATUS_LABEL[status],
    value: settlementStatusAmount.get(status) ?? 0,
    colorClass: SETTLEMENT_STATUS_COLOR[status],
  }));
  const settlementMonthlyItems = bucketSumByMonth(MONTHS, settlements);
  const settlementPartnerItems = toItems(
    sumBy(
      settlements,
      (s) => s.partners?.name ?? "미지정",
      (s) => s.amount,
    ),
    8,
  );
  const totalSettlementAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const paidSettlementAmount = settlementStatusAmount.get("paid") ?? 0;

  // 4. 쿠폰 사용 현황
  const redemptionCountByCoupon = new Map<string, number>();
  for (const r of couponRedemptionsData ?? []) {
    redemptionCountByCoupon.set(r.coupon_id, (redemptionCountByCoupon.get(r.coupon_id) ?? 0) + 1);
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
  const clickCountByCode = new Map<string, number>();
  for (const r of referralClicksData ?? []) {
    clickCountByCode.set(r.code_id, (clickCountByCode.get(r.code_id) ?? 0) + 1);
  }
  const conversionCountByCode = new Map<string, number>();
  for (const r of referralConversionsData ?? []) {
    conversionCountByCode.set(r.code_id, (conversionCountByCode.get(r.code_id) ?? 0) + 1);
  }
  const partnerReferralCodes = referralCodes
    .filter((c) => c.type === "partner")
    .map((c) => ({
      ...c,
      clicks: clickCountByCode.get(c.id) ?? 0,
      conversions: conversionCountByCode.get(c.id) ?? 0,
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

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">통계</h1>
      <p className="mt-1 text-sm text-gray-500">리드·회원·정산·쿠폰·추천인·상품·리뷰 지표를 한눈에 모아보는 화면입니다.</p>

      <Section title="리드 현황" description="상태별 처리 현황과 카테고리·월별 유입 추이">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="전체 리드" value={`${leads.length.toLocaleString("ko-KR")}건`} />
          <StatTile label="접수 대기" value={`${(leadStatusCounts.get("received") ?? 0).toLocaleString("ko-KR")}건`} />
          <StatTile label="완료" value={`${(leadStatusCounts.get("completed") ?? 0).toLocaleString("ko-KR")}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">상태별 현황</p>
        <div className="mt-2">
          <BarList items={leadStatusItems} valueFormatter={(v) => `${v}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">카테고리별 분포</p>
        <div className="mt-2">
          <BarList items={leadCategoryItems} valueFormatter={(v) => `${v}건`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">월별 추이 (최근 6개월)</p>
        <div className="mt-2">
          <BarList items={leadMonthlyItems} valueFormatter={(v) => `${v}건`} />
        </div>
      </Section>

      <Section title="회원 현황" description="신규가입 추이와 등급·마케팅 동의 분포">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="전체 회원" value={`${profiles.length.toLocaleString("ko-KR")}명`} />
          <StatTile
            label="이번 달 신규가입"
            value={`${(profileMonthlyItems.at(-1)?.value ?? 0).toLocaleString("ko-KR")}명`}
          />
          <StatTile label="마케팅 동의율" value={`${marketingRate}%`} />
        </div>
        <p className="mt-5 text-xs font-semibold text-gray-400">신규가입 추이 (최근 6개월)</p>
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
        <p className="mt-5 text-xs font-semibold text-gray-400">월별 정산 금액 추이 (최근 6개월)</p>
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
    </div>
  );
}
