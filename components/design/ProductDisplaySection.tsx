"use client";

import { useState } from "react";
import type { DisplayCategory, DisplayProduct } from "@/lib/design/product-display";
import { ProductCard } from "@/components/design/ProductCard";

// PopularProducts.tsx(Phase2 스텁)를 대체하는 실제 데이터 연동 버전. mode='latest'면 카테고리별
// 탭(1개면 탭 없이 단일 목록)으로, mode='manual'이면 관리자가 지정한 상품만 순서대로 그린다
// (§상품 진열 페이지 — 이벤트/카테고리 랜딩에서 특정 상품을 큐레이션할 때 사용).
export function ProductDisplaySection({
  title,
  mode,
  categories,
  productsByCategory,
  manualProducts,
  isLoggedIn,
}: {
  title: string;
  mode: "latest" | "manual";
  categories: DisplayCategory[];
  productsByCategory: Record<string, DisplayProduct[]>;
  manualProducts: DisplayProduct[];
  isLoggedIn: boolean;
}) {
  const [active, setActive] = useState(categories[0]?.id);
  const activeProducts = mode === "manual" ? manualProducts : (productsByCategory[active ?? ""] ?? []);

  if (mode === "manual" && manualProducts.length === 0) return null;
  if (mode === "latest" && categories.length === 0) return null;

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2>

        {mode === "latest" && categories.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                  active === category.id
                    ? "bg-[var(--brand-blue)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {activeProducts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
            등록된 상품이 없습니다.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {activeProducts.map((product) => (
              <ProductCard key={product.id} product={product} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
