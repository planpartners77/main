import Link from "next/link";
import type { DisplayProduct } from "@/lib/design/product-display";
import { formatWon, incentiveLabel, productDetailHref } from "@/lib/design/product-display";
import { ProductThumbnail } from "./ProductThumbnail";

export function ProductCard({ product, isLoggedIn }: { product: DisplayProduct; isLoggedIn: boolean }) {
  const incentive = incentiveLabel(product, isLoggedIn);
  const href = productDetailHref(product);

  const content = (
    <>
      <ProductThumbnail src={product.image_url} alt={product.title} />
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900">{product.title}</p>
        <p className="mt-1 text-xs text-gray-400">{formatWon(product.base_price)}</p>
        {incentive && <p className="mt-1 text-xs font-semibold text-[var(--brand-blue)]">{incentive}</p>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/30 hover:shadow-md">
        {content}
      </Link>
    );
  }

  return <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">{content}</div>;
}
