import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TierManager, type TierRow } from "@/components/admin/members/TierManager";

export default async function AdminTiersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_tiers")
    .select("id, name, point_earn_rate, badge_color")
    .order("point_earn_rate", { ascending: true });

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">회원 등급 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        회원 등급별 포인트 적립 배율과 뱃지 색상을 관리합니다. 회원 상세 화면의 등급 배정, 정산 승인 시 포인트
        적립, 등급 조건 쿠폰에 즉시 반영됩니다.
      </p>
      <div className="mt-4">
        <TierManager tiers={(data ?? []) as TierRow[]} />
      </div>
    </div>
  );
}
