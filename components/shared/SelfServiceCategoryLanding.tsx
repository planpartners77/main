import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";
import { ProductThumbnail } from "@/components/design/ProductThumbnail";
import type { SelfServiceProductListItem } from "@/lib/products/self-service-list-query";

function formatWon(value: number | null) {
  return value != null ? `${value.toLocaleString("ko-KR")}원` : null;
}

// §12-4 셀프서비스형 템플릿의 범용 버전. 전용 스펙 UI가 없는 카테고리(인터넷·가전렌탈 등)의
// 목록 페이지가 공유한다.
export function SelfServiceCategoryLanding({
  category,
  products,
}: {
  category: CategoryConfig;
  products: SelfServiceProductListItem[];
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <TrackBadge trackType={category.trackType} />
      <h1 className="mt-4 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">{category.name}</h1>

      {products.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          현재 등록된 상품이 준비 중입니다.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {products.map((product) => {
            const price = formatWon(product.base_price);
            return (
              <Link
                key={product.id}
                href={`/${category.slug}/${product.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[var(--brand-blue)] hover:shadow-md"
              >
                <ProductThumbnail src={product.image_url} alt={product.title} />
                <p className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-[var(--brand-navy)]">
                  {product.title}
                </p>
                {price && <p className="mt-1 text-base font-bold text-[var(--brand-blue)]">{price}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
