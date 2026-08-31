import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PartnerManager, type PartnerRow } from "@/components/admin/partners/PartnerManager";

export default async function AdminPartnersPage() {
  const supabase = await createClient();
  const [{ data: partners }, { data: categories }] = await Promise.all([
    supabase
      .from("partners")
      .select("id, category_id, name, biz_reg_no, settlement_rate, contract_status, logo_url, categories(name)")
      .order("name"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">파트너 관리</h1>
      <div className="mt-6">
        <PartnerManager partners={(partners ?? []) as unknown as PartnerRow[]} categories={categories ?? []} />
      </div>
    </div>
  );
}
