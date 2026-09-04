import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin/session";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { parseUserAgent } from "@/lib/admin/visitor-parse";
import { MemberEditForm } from "@/components/admin/members/MemberEditForm";
import { MemberStatusControl } from "@/components/admin/members/MemberStatusControl";
import { PointAdjustPanel } from "@/components/admin/members/PointAdjustPanel";
import { MemberNotes } from "@/components/admin/members/MemberNotes";

interface MemberDetail {
  id: string;
  display_name: string | null;
  phone: string | null;
  tier_id: string | null;
  marketing_opt_in: boolean;
  referral_role: "member" | "partner";
  status: "active" | "suspended" | "withdrawn";
  created_at: string;
  my_ref_code_id: string | null;
  customer_tiers: { name: string | null } | null;
}

interface ReferralSummary {
  my_code: string | null;
  total_clicks: number;
  total_registrations: number;
  total_leads: number;
  referred_by_code: string | null;
  referred_by_name: string | null;
  network_size: number;
}

interface MemberLead {
  id: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
  products: { title: string } | null;
}

interface CouponRedemptionRow {
  id: string;
  redeemed_at: string;
  coupons: { code: string; discount_type: string; discount_value: number } | null;
}

interface VisitorLogRow {
  id: number;
  ip: string | null;
  user_agent: string | null;
  path: string | null;
  created_at: string;
}

interface DirectReferralRow {
  code: string;
  profile_id: string | null;
  profiles: { display_name: string | null; created_at: string } | null;
}

interface AuditLogRow {
  id: number;
  action: string;
  created_at: string;
  actor_id: string | null;
}

const ACCESSED_FIELDS = ["display_name", "phone", "tier_id", "marketing_opt_in", "referral_role", "email"];

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const session = await getAdminSession();

  const { data: member, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, phone, tier_id, marketing_opt_in, referral_role, status, created_at, my_ref_code_id, customer_tiers(name)",
    )
    .eq("id", id)
    .single();

  if (error || !member) {
    notFound();
  }

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, status, created_at, categories(name), products(title)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const { data: tiersData } = await supabase.from("customer_tiers").select("id, name");

  // 이메일은 profiles가 아닌 auth.users에만 있어 Admin API로 실시간 조회(목록 페이지와 동일 원칙).
  const { data: authUserData } = await createAdminClient().auth.admin.getUserById(id);
  const email = authUserData?.user?.email ?? null;

  // 회원 본인 추천코드 현황 — 관리자는 fn_get_my_referral_summary 내부의 admin_users 체크를
  // 통과하므로 다른 회원의 요약도 그대로 조회할 수 있다(0017 마이그레이션 참고).
  const { data: referralSummaryData } = await supabase
    .rpc("fn_get_my_referral_summary", { p_profile_id: id })
    .maybeSingle();
  const referralSummary = referralSummaryData as ReferralSummary | null;

  const detailRow = member as unknown as MemberDetail;

  const [
    { data: couponData },
    { data: visitorLogData },
    { data: pointTxData },
    { data: notesData },
    { data: directReferralData },
    { data: tierHistoryData },
  ] = await Promise.all([
    supabase
      .from("coupon_redemptions")
      .select("id, redeemed_at, coupons(code, discount_type, discount_value)")
      .eq("profile_id", id)
      .order("redeemed_at", { ascending: false }),
    supabase
      .from("visitor_logs")
      .select("id, ip, user_agent, path, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("point_transactions")
      .select("id, amount, reason, created_at")
      .eq("profile_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("member_notes")
      .select("id, content, created_at, admin_id")
      .eq("profile_id", id)
      .order("created_at", { ascending: false }),
    detailRow.my_ref_code_id
      ? supabase
          .from("referral_codes")
          .select("code, profile_id, profiles(display_name, created_at)")
          .eq("parent_code_id", detailRow.my_ref_code_id)
      : Promise.resolve({ data: [] as DirectReferralRow[] }),
    supabase
      .from("audit_logs")
      .select("id, action, created_at, actor_id")
      .eq("target_table", "profiles")
      .eq("target_id", id)
      .in("action", ["update", "bulk_update", "status_change"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pointTransactions = pointTxData ?? [];
  const pointBalance = pointTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const actorIds = Array.from(
    new Set([
      ...(notesData ?? []).map((n) => n.admin_id),
      ...((tierHistoryData ?? []) as AuditLogRow[]).map((t) => t.actor_id).filter((v): v is string => !!v),
    ]),
  );
  let actorNameById = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: actorProfiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    actorNameById = new Map((actorProfiles ?? []).map((p) => [p.id, p.display_name]));
  }

  // §9-1 개인정보 열람 로그 요구사항: 누가/언제/어떤 필드를 조회했는지 매 열람마다 기록한다.
  if (session) {
    await supabase.from("audit_logs").insert({
      actor_id: session.userId,
      action: "view",
      target_table: "profiles",
      target_id: id,
      accessed_fields: ACCESSED_FIELDS,
    });
  }

  const detail = member as unknown as MemberDetail;
  const leads = (leadsData ?? []) as unknown as MemberLead[];

  return (
    <div>
      <Link href="/admin/members" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 회원 목록
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">{detail.display_name ?? "이름 없음"}</h1>
      <p className="mt-1 text-xs text-amber-600">
        이 페이지 열람 기록은 audit_logs에 자동으로 남습니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-[var(--brand-navy)]">기본 정보</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">가입일</dt>
              <dd>{new Date(detail.created_at).toLocaleDateString("ko-KR")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">이메일</dt>
              <dd>{email ?? "-"}</dd>
            </div>
          </dl>
        </div>
        {session && (
          <MemberEditForm
            memberId={detail.id}
            actorId={session.userId}
            email={email}
            initialDisplayName={detail.display_name ?? ""}
            initialPhone={detail.phone ?? ""}
            initialTierId={detail.tier_id ?? ""}
            initialMarketingOptIn={detail.marketing_opt_in}
            initialReferralRole={detail.referral_role}
            tierOptions={tiersData ?? []}
          />
        )}
        {session && (
          <MemberStatusControl memberId={detail.id} actorId={session.userId} initialStatus={detail.status} />
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {session && (
          <PointAdjustPanel memberId={detail.id} balance={pointBalance} transactions={pointTransactions} />
        )}
        {session && (
          <MemberNotes
            memberId={detail.id}
            actorId={session.userId}
            notes={(notesData ?? []).map((n) => ({
              id: n.id,
              content: n.content,
              created_at: n.created_at,
              adminName: actorNameById.get(n.admin_id) ?? null,
            }))}
          />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">추천인 코드 현황</p>
        {referralSummary?.my_code ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">본인 코드</dt>
              <dd className="font-medium">{referralSummary.my_code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">추천인</dt>
              <dd>
                {referralSummary.referred_by_code
                  ? `${referralSummary.referred_by_code}${referralSummary.referred_by_name ? ` (${referralSummary.referred_by_name})` : ""}`
                  : "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">클릭수</dt>
              <dd>{referralSummary.total_clicks}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">가입 전환수</dt>
              <dd>{referralSummary.total_registrations}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">리드 전환수</dt>
              <dd>{referralSummary.total_leads}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">네트워크 규모(하위 전체 가입자)</dt>
              <dd>{referralSummary.network_size}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 py-6 text-center text-sm text-gray-500">발급된 추천코드가 없습니다.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">직접 추천한 회원</p>
        {(directReferralData ?? []).length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-gray-500">직접 추천한 회원이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50 text-sm">
            {((directReferralData ?? []) as unknown as DirectReferralRow[]).map((r) => (
              <li key={r.code} className="flex items-center justify-between py-2">
                <span>
                  {r.profiles?.display_name ?? "이름 없음"}{" "}
                  <span className="text-xs text-gray-400">({r.code})</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  {r.profiles?.created_at ? new Date(r.profiles.created_at).toLocaleDateString("ko-KR") : "-"}
                  {r.profile_id && (
                    <Link href={`/admin/members/${r.profile_id}`} className="font-semibold text-[var(--brand-navy)]">
                      보기
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-[var(--brand-navy)]">쿠폰 사용 이력</p>
          {(couponData ?? []).length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-gray-500">사용한 쿠폰이 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-50 text-sm">
              {((couponData ?? []) as unknown as CouponRedemptionRow[]).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{c.coupons?.code ?? "-"}</span>
                  <span className="text-xs text-gray-400">
                    {c.coupons?.discount_type === "percent"
                      ? `${c.coupons.discount_value}%`
                      : c.coupons
                        ? `${c.coupons.discount_value.toLocaleString()}원`
                        : "-"}
                    {" · "}
                    {new Date(c.redeemed_at).toLocaleDateString("ko-KR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-[var(--brand-navy)]">최근 접속 이력</p>
          {(visitorLogData ?? []).length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-gray-500">접속 기록이 없습니다.</p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto text-xs">
              {((visitorLogData ?? []) as VisitorLogRow[]).map((v) => {
                const parsed = parseUserAgent(v.user_agent);
                return (
                  <li key={v.id} className="flex items-center justify-between text-gray-500">
                    <span>
                      {parsed.osName} · {parsed.browser} · {v.path ?? "-"}
                    </span>
                    <span>{new Date(v.created_at).toLocaleString("ko-KR")}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">정보/등급 변경 이력</p>
        {(tierHistoryData ?? []).length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-gray-500">변경 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50 text-sm">
            {((tierHistoryData ?? []) as AuditLogRow[]).map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-xs text-gray-500">
                <span>
                  {h.action === "status_change" ? "계정 상태 변경" : h.action === "bulk_update" ? "일괄 변경" : "정보 수정"}
                  {" · "}
                  {actorNameById.get(h.actor_id ?? "") ?? "관리자"}
                </span>
                <span>{new Date(h.created_at).toLocaleString("ko-KR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">문의/리드 이력</p>
        {leads.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-gray-500">문의 이력이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                  <th className="px-3 py-2">접수일</th>
                  <th className="px-3 py-2">카테고리</th>
                  <th className="px-3 py-2">상품</th>
                  <th className="px-3 py-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-3 py-3">{lead.categories?.name ?? "-"}</td>
                    <td className="px-3 py-3">{lead.products?.title ?? "-"}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {LEAD_STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
