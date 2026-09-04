import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { getCategoryDisplayProducts } from "@/lib/design/products-query";
import { ProductCard } from "@/components/design/ProductCard";
import { createClient } from "@/lib/supabase/server";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const supabase = await createClient();
  const [
    products,
    {
      data: { user },
    },
  ] = await Promise.all([getCategoryDisplayProducts(slug), supabase.auth.getUser()]);
  const isLoggedIn = !!user;

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--brand-navy)]">{category.name} 비교 결과</h1>
      <p className="mt-2 text-sm text-gray-500">등록된 상품 중 조건이 좋은 순으로 모아봤어요.</p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
          아직 등록된 {category.name} 상품이 없습니다.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </main>
  );
}
