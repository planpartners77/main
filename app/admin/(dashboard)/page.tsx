import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin/session";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";

const QUICK_LINKS = [
  { title: "리드 확인", href: "/admin/leads", icon: "leads" },
  { title: "상품 등록", href: "/admin/products", icon: "product" },
  { title: "회원 관리", href: "/admin/members", icon: "member" },
  { title: "매장 관리", href: "/admin/stores", icon: "settings" },
];

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  canceled: "bg-gray-100 text-gray-500",
};

function summarizeContact(contact: Record<string, unknown> | null) {
  if (!contact) return { name: "-", phone: "-" };
  const name =
    (contact.guardianName as string) ?? (contact.childInfo as string) ?? (contact.name as string) ?? "-";
  const phone = (contact.phone as string) ?? "-";
  return { name, phone };
}

interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  guest_contact: Record<string, unknown> | null;
  categories: { name: string; slug: string } | null;
}

// 대시보드는 실제 leads/products/profiles 집계만 보여준다(방문자 수 등 아직 없는 분석
// 인프라 수치는 지어내지 않고 애초에 카드에서 뺌).
export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: activeProducts },
    { count: pendingLeads },
    { count: totalMembers },
    { count: newMembersThisMonth },
    { data: recentLeadsData },
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "received"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("leads")
      .select("id, status, created_at, guest_contact, categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const recentLeads = (recentLeadsData ?? []) as unknown as LeadRow[];

  const STATS = [
    { title: "활성 상품", value: activeProducts ?? 0, icon: "product", tone: "bg-sky-50 text-sky-600" },
    { title: "미처리 리드", value: pendingLeads ?? 0, icon: "leads", tone: "bg-rose-50 text-rose-600" },
    { title: "전체 회원", value: totalMembers ?? 0, icon: "member", tone: "bg-emerald-50 text-emerald-600" },
    {
      title: "이번 달 신규가입",
      value: newMembersThisMonth ?? 0,
      icon: "member-new",
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">대시보드</h1>
        <p className="text-sm text-gray-400">{today}</p>
      </div>
      {session && session.managedCategories.length > 0 && (
        <p className="mt-1 text-sm text-gray-500">담당 카테고리: {session.managedCategories.join(", ")}</p>
      )}

      {(pendingLeads ?? 0) > 0 && (
        <Link
          href="/admin/leads?status=received"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 text-sm text-rose-700 transition hover:bg-rose-100"
        >
          <span className="flex items-center gap-2">
            <AdminIcon name="bell" className="h-4 w-4 shrink-0" />
            미처리 리드가 {pendingLeads}건 있습니다. 빠른 처리가 필요합니다.
          </span>
          <span className="shrink-0 font-semibold">바로가기 →</span>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.title} className="rounded-2xl border border-gray-200 bg-white p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
              <AdminIcon name={stat.icon} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-2xl font-bold text-[var(--brand-navy)]">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">빠른 바로가기</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 py-5 text-center transition hover:border-[var(--brand-navy)]/30 hover:bg-gray-50"
            >
              <AdminIcon name={link.icon} className="h-5 w-5 text-[var(--brand-navy)]" />
              <span className="text-sm font-medium text-gray-700">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--brand-navy)]">최근 문의</p>
          <Link href="/admin/leads" className="text-xs font-semibold text-gray-400 hover:text-[var(--brand-navy)]">
            전체보기 →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <p className="mt-6 py-8 text-center text-sm text-gray-500">접수된 리드가 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">연락처</th>
                  <th className="px-3 py-2">카테고리</th>
                  <th className="px-3 py-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => {
                  const { name, phone } = summarizeContact(lead.guest_contact);
                  return (
                    <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                      <td className="whitespace-nowrap px-3 py-3 font-medium">{name}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">{phone}</td>
                      <td className="whitespace-nowrap px-3 py-3">{lead.categories?.name ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {LEAD_STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
