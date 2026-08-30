"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

// 실제 이용후기가 없는 상태에서 임의로 후기 텍스트를 만들면 표시광고법상 리스크가 있어
// 지어내지 않았다. 탭 UI는 미리 구성해두고, Phase 2 데이터 연동 시 실제 후기(관리자 승인 후
// 게시)로 이 자리를 채운다.
export function ReviewsSection() {
  const [active, setActive] = useState(CATEGORIES[0].slug);
  const activeCategory = CATEGORIES.find((c) => c.slug === active);

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="text-xl font-bold text-[var(--brand-navy)]">고객들의 리얼 후기</h2>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((category) => (
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

      <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-500">
        {activeCategory?.name} 카테고리 실제 이용후기는 서비스 오픈 후 관리자 승인을 거쳐
        순차적으로 공개됩니다.
      </div>
    </section>
  );
}
