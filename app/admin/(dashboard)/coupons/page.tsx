import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CouponManager, type CouponRow } from "@/components/admin/coupons/CouponManager";

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  // coupon_redemptions는 사용할수록 계속 커지는 로그 테이블이라 원본 행을 통째로 가져오지 않고
  // (statistics 페이지와 동일하게) coupon_redemption_counts() RPC로 쿠폰별 집계만 받아온다.
  const [{ data: coupons }, { data: categories }, { data: tiers }, { data: redemptionCounts }] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, valid_from, valid_until, category_id, min_tier_id, max_redemptions, is_active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("customer_tiers").select("id, name").order("point_earn_rate"),
    supabase.rpc("coupon_redemption_counts"),
  ]);

  const countByCoupon = new Map<string, number>();
  for (const r of redemptionCounts ?? []) {
    countByCoupon.set(r.coupon_id, r.redemption_count);
  }

  const rows: CouponRow[] = (coupons ?? []).map((c) => ({
    ...c,
    redemption_count: countByCoupon.get(c.id) ?? 0,
  }));

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">쿠폰 관리</h1>
      <div className="mt-6">
        <CouponManager coupons={rows} categories={categories ?? []} tiers={tiers ?? []} />
      </div>
    </div>
  );
}
