import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PromotionManager, type PromotionRow } from "@/components/admin/usim/PromotionManager";

export default async function AdminUsimPromotionsPage() {
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select("id").eq("slug", "usim").maybeSingle();

  const [{ data: promotions }, { data: products }] = await Promise.all([
    category
      ? supabase
          .from("plan_promotions")
          .select("id, product_id, label, type, total_amount, schedule, valid_from, valid_until, is_active, products(title)")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    category
      ? supabase.from("products").select("id, title").eq("category_id", category.id).order("title")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">요금제 프로모션 관리</h1>
      <div className="mt-6">
        {!category ? (
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            유심 카테고리가 존재하지 않습니다.
          </p>
        ) : (
          <PromotionManager
            promotions={(promotions ?? []) as unknown as PromotionRow[]}
            products={products ?? []}
          />
        )}
      </div>
    </div>
  );
}
