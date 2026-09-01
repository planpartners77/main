"use client";

import { useState } from "react";
import type { CategoryConfig } from "@/lib/categories";

// TODO(Phase2 데이터 연동): active 카테고리의 Supabase `products` 테이블을 조회해
// 이 자리를 실제 상품/가격으로 채운다. 통신사 요금·사은품은 시점에 따라 달라지므로
// 검증 안 된 가격을 미리 지어내지 않는다.
// categories는 관리자 "카테고리 진열순서" 설정이 반영된(is_active=true) 목록을 상위(홈페이지)에서
// 내려준다 — GlobalNav/CategoryQuickNav와 동일한 소스를 써서 노출 카테고리가 어긋나지 않게 한다.
export function PopularProducts({ categories }: { categories: CategoryConfig[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const activeCategory = categories.find((c) => c.slug === active);

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">누적 기록이 만든 인기 상품</h2>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActive(category.slug)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                active === category.slug
                  ? "bg-[var(--brand-blue)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
          {activeCategory?.name} 상품 비교 데이터 연동 준비 중입니다.
        </div>
      </div>
    </section>
  );
}
