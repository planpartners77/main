import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReferralManager } from "@/components/admin/referrals/ReferralManager";

export default async function AdminReferralsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("referral_codes")
    .select(
      "id, code, name, type, parent_code_id, root_code_id, depth, total_clicks, total_registrations, is_active, expires_at",
    )
    .order("depth", { ascending: true })
    .order("code", { ascending: true });

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">추천인 코드 관리</h1>
      <div className="mt-6">
        <ReferralManager codes={data ?? []} />
      </div>
    </div>
  );
}
