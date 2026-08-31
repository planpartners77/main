import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettlementManager, type SettlementRow, type LeadOption } from "@/components/admin/settlements/SettlementManager";

export default async function AdminSettlementsPage() {
  const supabase = await createClient();
  const [{ data: settlements }, { data: partners }, { data: leads }] = await Promise.all([
    supabase
      .from("settlements")
      .select("id, partner_id, lead_id, amount, status, memo, approved_at, paid_at, created_at, partners(name)")
      .order("created_at", { ascending: false }),
    supabase.from("partners").select("id, name").order("name"),
    supabase
      .from("leads")
      .select("id, guest_contact, categories(name), products(title, partner_id, incentive_exact)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">정산 관리</h1>
      <div className="mt-6">
        <SettlementManager
          settlements={(settlements ?? []) as unknown as SettlementRow[]}
          partners={partners ?? []}
          leads={(leads ?? []) as unknown as LeadOption[]}
        />
      </div>
    </div>
  );
}
