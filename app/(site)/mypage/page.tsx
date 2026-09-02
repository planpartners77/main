import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/mypage/ProfileEditForm";
import { ReferralShareLink } from "@/components/mypage/ReferralShareLink";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { CONSULTATION_STATUS_OPTIONS } from "@/components/admin/consultations/ConsultationManager";

// §12-10 마이페이지: 회원정보 수정 / 신청 내역(비대면) / 상담 내역(상담필수) / 사은품·지원금 현황.
// 오프라인 매장 방문 예약과 카카오 연동 해제는 아직 실제 기능(예약 테이블, 카카오싱크 연동)이
// 없어 §11-3의 "UI만 있고 작동하지 않는 기능" 함정을 피하기 위해 노출하지 않는다.

interface ReferralSummary {
  my_code: string | null;
  total_clicks: number;
  total_registrations: number;
  total_leads: number;
  referred_by_code: string | null;
  referred_by_name: string | null;
  network_size: number;
}

interface PointTransaction {
  id: number;
  amount: number;
  reason: string;
  created_at: string;
}

interface CouponRedemption {
  id: string;
  redeemed_at: string;
  coupons: { code: string; discount_type: "fixed" | "percent"; discount_value: number } | null;
}

function couponDiscountLabel(c: CouponRedemption["coupons"]) {
  if (!c) return "-";
  return c.discount_type === "percent" ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString("ko-KR")}원 할인`;
}

interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  categories: { name: string; track_type: string } | null;
  products: { title: string; incentive_exact: number | null; incentive_min: number | null; incentive_max: number | null } | null;
  consultations: { status: string; call_log: string | null; withdrawal_notice_sent_at: string | null }[] | null;
  settlements: { id: string; amount: number; status: string; paid_at: string | null }[] | null;
}

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  draft: "접수",
  approved: "승인",
  paid: "지급완료",
  rejected: "반려",
};

function money(n: number | null) {
  if (n === null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

function incentiveLabel(p: LeadRow["products"]) {
  if (!p) return "-";
  if (p.incentive_exact !== null) return money(p.incentive_exact);
  if (p.incentive_min !== null && p.incentive_max !== null) {
    return `${money(p.incentive_min)} ~ ${money(p.incentive_max)}`;
  }
  return "-";
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, phone, marketing_opt_in, customer_tiers(name, badge_color)")
    .eq("id", user.id)
    .single();

  const tier = profile?.customer_tiers as unknown as { name: string; badge_color: string | null } | null;

  const { data: leadsData } = await supabase
    .from("leads")
    .select(
      "id, status, created_at, categories(name, track_type), products(title, incentive_exact, incentive_min, incentive_max), consultations(status, call_log, withdrawal_notice_sent_at), settlements(id, amount, status, paid_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const leads = (leadsData ?? []) as unknown as LeadRow[];
  const selfServiceLeads = leads.filter((l) => l.categories?.track_type === "self_service");
  const consultLeads = leads.filter((l) => l.categories?.track_type === "consult_required");
  const settlements = leads.flatMap((l) => (l.settlements ?? []).map((s) => ({ ...s, leadTitle: l.products?.title ?? l.categories?.name ?? "-" })));

  const { data: pointsData } = await supabase
    .from("point_transactions")
    .select("id, amount, reason, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const pointTransactions = (pointsData ?? []) as PointTransaction[];
  const pointBalance = pointTransactions.reduce((sum, t) => sum + t.amount, 0);

  const { data: couponData } = await supabase
    .from("coupon_redemptions")
    .select("id, redeemed_at, coupons(code, discount_type, discount_value)")
    .eq("profile_id", user.id)
    .order("redeemed_at", { ascending: false });

  const couponRedemptions = (couponData ?? []) as unknown as CouponRedemption[];

  const { data: referralSummaryData } = await supabase
    .rpc("fn_get_my_referral_summary", { p_profile_id: user.id })
    .maybeSingle();
  const referralSummary = referralSummaryData as ReferralSummary | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">MY PAGE</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">마이페이지</h1>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500">회원 등급</h2>
          {tier?.name && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: tier.badge_color ?? "#1B2A4A" }}
            >
              {tier.name}
            </span>
          )}
        </div>
        <div className="mt-3">
          <ProfileEditForm
            userId={user.id}
            initialDisplayName={profile?.display_name ?? ""}
            initialPhone={profile?.phone ?? ""}
            initialMarketingOptIn={profile?.marketing_opt_in ?? false}
          />
        </div>
      </section>

      {referralSummary?.my_code && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500">내 추천코드</h2>
            <ReferralShareLink code={referralSummary.my_code} />
          </div>
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-lg font-bold text-[var(--brand-navy)]">{referralSummary.my_code}</p>
            {referralSummary.referred_by_code && (
              <p className="mt-1 text-xs text-gray-400">
                추천인: {referralSummary.referred_by_code}
                {referralSummary.referred_by_name ? ` (${referralSummary.referred_by_name})` : ""}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-400">클릭수</p>
                <p className="mt-1 text-base font-semibold text-[var(--brand-navy)]">{referralSummary.total_clicks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">가입 전환</p>
                <p className="mt-1 text-base font-semibold text-[var(--brand-navy)]">
                  {referralSummary.total_registrations}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">리드 전환</p>
                <p className="mt-1 text-base font-semibold text-[var(--brand-navy)]">{referralSummary.total_leads}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">네트워크 규모</p>
                <p className="mt-1 text-base font-semibold text-[var(--brand-navy)]">{referralSummary.network_size}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500">신청 내역</h2>
        {selfServiceLeads.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            신청 내역이 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {selfServiceLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold">{l.products?.title ?? l.categories?.name ?? "-"}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(l.created_at).toLocaleDateString("ko-KR")} · {l.categories?.name ?? "-"} · 사은품 {incentiveLabel(l.products)}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {LEAD_STATUS_OPTIONS.find((o) => o.value === l.status)?.label ?? l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500">상담 내역</h2>
        {consultLeads.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            상담 내역이 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {consultLeads.map((l) => {
              const consult = l.consultations?.[0] ?? null;
              return (
                <div key={l.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{l.categories?.name ?? "-"}</p>
                      <p className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString("ko-KR")}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {consult
                        ? CONSULTATION_STATUS_OPTIONS.find((o) => o.value === consult.status)?.label ?? consult.status
                        : "접수"}
                    </span>
                  </div>
                  {consult?.withdrawal_notice_sent_at && (
                    <p className="mt-2 text-xs font-semibold text-green-600">청약철회 안내 발송완료</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500">사은품 · 지원금 지급 현황</h2>
        {settlements.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            지급 내역이 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold">{s.leadTitle}</p>
                  {s.paid_at && (
                    <p className="text-xs text-gray-400">{new Date(s.paid_at).toLocaleDateString("ko-KR")} 지급</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{money(s.amount)}</p>
                  <span className="text-xs text-gray-500">{SETTLEMENT_STATUS_LABEL[s.status] ?? s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500">포인트 현황</h2>
          <span className="text-lg font-bold text-[var(--brand-navy)]">{pointBalance.toLocaleString("ko-KR")}P</span>
        </div>
        {pointTransactions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            포인트 내역이 없습니다. 사은품·지원금이 지급 완료되면 등급별 적립률로 자동 적립됩니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {pointTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold">{t.reason}</p>
                  <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString("ko-KR")}</p>
                </div>
                <p className={`text-sm font-semibold ${t.amount >= 0 ? "text-blue-600" : "text-red-500"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString("ko-KR")}P
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500">쿠폰 사용 내역</h2>
        {couponRedemptions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            사용한 쿠폰이 없습니다. 신청서 작성 시 쿠폰 코드를 입력하면 적용됩니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {couponRedemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold">{r.coupons?.code ?? "-"}</p>
                  <p className="text-xs text-gray-400">{new Date(r.redeemed_at).toLocaleDateString("ko-KR")} 사용</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {couponDiscountLabel(r.coupons)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
