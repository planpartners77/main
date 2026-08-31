import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConsultationManager, type ConsultationRow, type CategoryOption } from "@/components/admin/consultations/ConsultationManager";

export default async function AdminConsultationsPage() {
  const supabase = await createClient();

  const [{ data: consultations }, { data: categories }] = await Promise.all([
    supabase
      .from("consultations")
      .select(
        "id, lead_id, status, preferred_time, call_log, withdrawal_notice_sent_at, created_at, leads(guest_contact, categories(name))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("track_type", "consult_required").eq("is_active", true),
  ]);

  const categoryIds = (categories ?? []).map((c) => c.id);
  const assignedLeadIds = new Set((consultations ?? []).map((c) => c.lead_id));

  // /consult/[category] 온라인 신청 폼으로 들어온 리드는 leads에만 생성되고 consultations는
  // RLS상 관리자만 만들 수 있어(0012 마이그레이션) 여기서 미배정 리드를 보여주고 전환한다.
  const { data: leadsData } = categoryIds.length
    ? await supabase
        .from("leads")
        .select("id, guest_contact, created_at, categories(id, name)")
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const unassignedLeads = ((leadsData ?? []) as unknown as Array<{
    id: string;
    guest_contact: Record<string, unknown> | null;
    created_at: string;
    categories: { id: string; name: string } | null;
  }>).filter((lead) => !assignedLeadIds.has(lead.id));

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">상담 관리</h1>
      <p className="mt-1 text-sm text-gray-500">보험·상조 등 상담 필수 카테고리의 상담 접수·진행 현황입니다.</p>
      <div className="mt-6">
        <ConsultationManager
          consultations={(consultations ?? []) as unknown as ConsultationRow[]}
          consultCategories={(categories ?? []) as CategoryOption[]}
          unassignedLeads={unassignedLeads}
        />
      </div>
    </div>
  );
}
