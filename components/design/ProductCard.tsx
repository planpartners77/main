import type { DisplayProduct } from "@/lib/design/product-display";
import { formatWon, incentiveLabel } from "@/lib/design/product-display";

export function ProductCard({ product, isLoggedIn }: { product: DisplayProduct; isLoggedIn: boolean }) {
  const incentive = incentiveLabel(product, isLoggedIn);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[4/3] bg-gray-50">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션
          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-300">이미지 없음</div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900">{product.title}</p>
        <p className="mt-1 text-xs text-gray-400">{formatWon(product.base_price)}</p>
        {incentive && <p className="mt-1 text-xs font-semibold text-[var(--brand-blue)]">{incentive}</p>}
      </div>
    </div>
  );
}
