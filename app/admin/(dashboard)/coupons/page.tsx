import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CouponManager, type CouponRow } from "@/components/admin/coupons/CouponManager";

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  const [{ data: coupons }, { data: categories }, { data: tiers }, { data: redemptions }] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, valid_from, valid_until, category_id, min_tier_id, max_redemptions, is_active")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("customer_tiers").select("id, name").order("point_earn_rate"),
    supabase.from("coupon_redemptions").select("coupon_id"),
  ]);

  const countByCoupon = new Map<string, number>();
  for (const r of redemptions ?? []) {
    countByCoupon.set(r.coupon_id, (countByCoupon.get(r.coupon_id) ?? 0) + 1);
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
