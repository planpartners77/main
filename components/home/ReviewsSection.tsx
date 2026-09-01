"use client";

import { useState } from "react";

export interface ReviewCategoryOption {
  id: string;
  slug: string;
  name: string;
}

export interface ReviewRow {
  id: string;
  category_id: string | null;
  author_label: string;
  rating: number | null;
  body: string;
}

// 실제 이용후기가 없는 카테고리는 임의로 후기 텍스트를 만들면 표시광고법상 리스크가 있어
// 지어내지 않는다. 관리자가 승인(is_active=true)한 실제 후기만 표시하고, 없으면 안내 문구를 보여준다.
export function ReviewsSection({ categories, reviews }: { categories: ReviewCategoryOption[]; reviews: ReviewRow[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const activeCategory = categories.find((c) => c.slug === active);
  const visibleReviews = reviews.filter((r) => activeCategory && r.category_id === activeCategory.id);

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="text-xl font-bold text-[var(--brand-navy)]">고객들의 리얼 후기</h2>

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

      {visibleReviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-500">
          {activeCategory?.name} 카테고리 실제 이용후기는 서비스 오픈 후 관리자 승인을 거쳐
          순차적으로 공개됩니다.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {visibleReviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{review.author_label}</span>
                {review.rating && <span className="text-sm text-amber-500">{"★".repeat(review.rating)}</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
