import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadStatusSelect } from "@/components/admin/leads/LeadStatusSelect";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";

interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  guest_contact: Record<string, unknown> | null;
  categories: { name: string; slug: string } | null;
  referral_code_id: string | null;
}

// guest_contact은 카테고리(신청서)마다 필드 구성이 달라 공용 키 후보 중 있는 값만 뽑아 보여준다.
// travel은 guardianName/childInfo, usim/mobile 등은 name 키를 쓴다.
function summarizeContact(contact: Record<string, unknown> | null) {
  if (!contact) return { name: "-", phone: "-" };
  const name =
    (contact.guardianName as string) ?? (contact.childInfo as string) ?? (contact.name as string) ?? "-";
  const phone = (contact.phone as string) ?? "-";
  return { name, phone };
}

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  canceled: "bg-gray-100 text-gray-500",
};

const PAGE_SIZE = 50;

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // 예전에는 .limit(100)만 있고 페이지네이션이 없어, 접수된 리드가 100건을 넘으면 101번째부터는
  // 화면에서 아예 보이지도, 넘겨볼 수도 없었다(무한정 위쪽 100건만 노출). members/audit-logs
  // 페이지와 동일한 range() 기반 페이지네이션으로 바꾼다.
  let query = supabase
    .from("leads")
    .select("id, status, created_at, guest_contact, categories(name, slug), referral_code_id", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.range(from, to);
  const leads = (data ?? []) as unknown as LeadRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/leads?${params.toString()}`;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">리드 관리</h1>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/leads"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !status ? "bg-[var(--brand-navy)] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            전체
          </Link>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/admin/leads?status=${opt.value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === opt.value
                  ? "bg-[var(--brand-navy)] text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          리드 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && leads.length === 0 && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          접수된 리드가 없습니다.
        </p>
      )}

      {!error && leads.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">접수일시</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const { name, phone } = summarizeContact(lead.guest_contact);
                return (
                  <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {new Date(lead.created_at).toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{lead.categories?.name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{phone}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {LEAD_STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                        </span>
                        <LeadStatusSelect leadId={lead.id} status={lead.status} referralCodeId={lead.referral_code_id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!error && leads.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Link
            href={pageHref(Math.max(1, currentPage - 1))}
            className={`rounded-lg border border-gray-300 px-3 py-1.5 ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:border-[var(--brand-navy)]"}`}
          >
            이전
          </Link>
          <span className="text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, currentPage + 1))}
            className={`rounded-lg border border-gray-300 px-3 py-1.5 ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:border-[var(--brand-navy)]"}`}
          >
            다음
          </Link>
        </div>
      )}
    </div>
  );
}
