import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductManager, type ProductRow } from "@/components/admin/products/ProductManager";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }, { data: partners }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, partner_id, title, base_price, incentive_min, incentive_max, incentive_exact, image_url, extra, is_active, categories(name), partners(name)",
      )
      .order("title"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
    supabase.from("partners").select("id, name, category_id").order("name"),
  ]);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">상품 관리</h1>
      <div className="mt-6">
        <ProductManager
          products={(products ?? []) as unknown as ProductRow[]}
          categories={categories ?? []}
          partners={partners ?? []}
        />
      </div>
    </div>
  );
}
