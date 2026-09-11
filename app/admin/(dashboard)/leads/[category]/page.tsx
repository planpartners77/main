import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/admin/leads/LeadsTable";
import { LEAD_STATUS_OPTIONS } from "@/lib/admin/lead-status";
import { LEADS_PAGE_SIZE, type LeadRow } from "@/lib/admin/leads";

// 신청내역 하위메뉴(카테고리별 탭)의 실제 목록 화면. 카테고리는 이미 문맥으로 드러나므로
// 목록 자체에는 카테고리 열을 표시하지 않는다(LeadsTable showCategoryColumn=false).
export default async function AdminLeadsByCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { category: slug } = await params;
  const { status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * LEADS_PAGE_SIZE;
  const to = from + LEADS_PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  let query = supabase
    .from("leads")
    .select("id, status, created_at, guest_contact, admin_memo, categories(name, slug), referral_code_id", {
      count: "exact",
    })
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query.range(from, to);
  const leads = (data ?? []) as unknown as LeadRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / LEADS_PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/leads/${slug}?${params.toString()}`;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--brand-navy)]">신청 내역 · {category.name}</h1>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/admin/leads/${slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !status ? "bg-[var(--brand-navy)] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            전체
          </Link>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/admin/leads/${slug}?status=${opt.value}`}
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
          신청 내역을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && <LeadsTable leads={leads} showCategoryColumn={false} />}

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
