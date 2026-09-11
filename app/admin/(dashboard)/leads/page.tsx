import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/admin/leads/LeadsTable";
import { ApplyClicksTable } from "@/components/admin/leads/ApplyClicksTable";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { LEADS_PAGE_SIZE, type LeadRow } from "@/lib/admin/leads";
import { APPLY_CLICKS_PAGE_SIZE, type ApplyClickRow } from "@/lib/admin/apply-clicks";

// "전체" 탭 — 카테고리 구분 없이 모든 신청을 모아 보는 마스터 뷰.
// 카테고리별 세부 목록은 /admin/leads/[category]에서 담당한다.
// view=clicks면 정식 접수(leads)가 아니라 "신청하기" 클릭 이력(apply_clicks)을 보여준다 —
// 상태 워크플로/메모가 없는 별도 성격의 이력이라 같은 목록에 섞지 않고 탭으로 분리한다.
export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; view?: string }>;
}) {
  const { status, page, view } = await searchParams;
  const isClicksView = view === "clicks";
  const pageSize = isClicksView ? APPLY_CLICKS_PAGE_SIZE : LEADS_PAGE_SIZE;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let leads: LeadRow[] = [];
  let clicks: ApplyClickRow[] = [];
  let error: { message: string } | null = null;
  let count = 0;

  if (isClicksView) {
    const result = await supabase
      .from("apply_clicks")
      .select("id, created_at, target_url, categories(name, slug), products(title), profiles(display_name, phone)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);
    clicks = (result.data ?? []) as unknown as ApplyClickRow[];
    error = result.error;
    count = result.count ?? 0;
  } else {
    let query = supabase
      .from("leads")
      .select("id, status, created_at, guest_contact, admin_memo, categories(name, slug), referral_code_id", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const result = await query.range(from, to);
    leads = (result.data ?? []) as unknown as LeadRow[];
    error = result.error;
    count = result.count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (isClicksView) {
      params.set("view", "clicks");
    } else if (status) {
      params.set("status", status);
    }
    params.set("page", String(p));
    return `/admin/leads?${params.toString()}`;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">신청 내역 · 전체</h1>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/leads"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !isClicksView ? "bg-[var(--brand-navy)] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            접수 내역
          </Link>
          <Link
            href="/admin/leads?view=clicks"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              isClicksView ? "bg-[var(--brand-navy)] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            클릭 이력
          </Link>
        </div>
      </div>

      {!isClicksView && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {isClicksView ? "클릭 이력을 불러오지 못했습니다" : "신청 내역을 불러오지 못했습니다"}: {error.message}
        </p>
      )}

      {!error && (isClicksView ? <ApplyClicksTable clicks={clicks} showCategoryColumn /> : <LeadsTable leads={leads} showCategoryColumn />)}

      {!error && (isClicksView ? clicks.length > 0 : leads.length > 0) && (
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
