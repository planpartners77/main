import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin/session";
import { LEAD_STATUS_OPTIONS } from "@/components/admin/leads/LeadStatusSelect";
import { MemberEditForm } from "@/components/admin/members/MemberEditForm";

interface MemberDetail {
  id: string;
  display_name: string | null;
  phone: string | null;
  tier_id: string | null;
  marketing_opt_in: boolean;
  referral_role: "member" | "partner";
  created_at: string;
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

const ACCESSED_FIELDS = ["display_name", "phone", "tier_id", "marketing_opt_in", "referral_role"];

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
    .select("id, display_name, phone, tier_id, marketing_opt_in, referral_role, created_at, customer_tiers(name)")
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

  // 회원 본인 추천코드 현황 — 관리자는 fn_get_my_referral_summary 내부의 admin_users 체크를
  // 통과하므로 다른 회원의 요약도 그대로 조회할 수 있다(0017 마이그레이션 참고).
  const { data: referralSummaryData } = await supabase
    .rpc("fn_get_my_referral_summary", { p_profile_id: id })
    .maybeSingle();
  const referralSummary = referralSummaryData as ReferralSummary | null;

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
          </dl>
        </div>
        {session && (
          <MemberEditForm
            memberId={detail.id}
            actorId={session.userId}
            initialDisplayName={detail.display_name ?? ""}
            initialPhone={detail.phone ?? ""}
            initialTierId={detail.tier_id ?? ""}
            initialMarketingOptIn={detail.marketing_opt_in}
            initialReferralRole={detail.referral_role}
            tierOptions={tiersData ?? []}
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
