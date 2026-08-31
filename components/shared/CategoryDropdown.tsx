import Link from "next/link";
import type { SubCategoryConfig } from "@/lib/categories";

// CategoryQuickNav(홈 카드)와 GlobalNav(상단 GNB) 양쪽에서 공유하는 카테고리 하위메뉴.
// 각 항목이 다시 subcategories를 가질 수 있어(예: 에듀 -> 영어캠프/화상영어) 재귀적으로
// 렌더링하고, 손자 항목은 오른쪽으로 펼쳐지는 2단 플라이아웃으로 표시한다.
export function CategoryDropdown({ items }: { items: SubCategoryConfig[] }) {
  return (
    <div className="min-w-[7.5rem] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg shadow-gray-200/70 ring-1 ring-black/5">
      {items.map((item) => (
        <div key={item.slug} className={item.subcategories ? "group/nested relative" : undefined}>
          <Link
            href={item.href}
            className="group/item relative flex items-center justify-between gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-[var(--surface-tint)] hover:text-[var(--brand-blue-dark)]"
          >
            <span className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-[var(--brand-blue)] transition-transform duration-200 group-hover/item:scale-y-100" />
            {item.name}
            {item.subcategories && (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover/nested:text-[var(--brand-blue)]"
              >
                <path
                  d="M7.5 5 12.5 10 7.5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Link>

          {item.subcategories && (
            <div className="pointer-events-none absolute left-full top-0 z-30 pl-2 opacity-0 -translate-x-1 transition-all duration-200 ease-out group-hover/nested:pointer-events-auto group-hover/nested:translate-x-0 group-hover/nested:opacity-100">
              <CategoryDropdown items={item.subcategories} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
