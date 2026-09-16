import Link from "next/link";
import { ProductThumbnail } from "@/components/design/ProductThumbnail";
import type { LandingPageListItem } from "@/lib/landing/pages-query";

export function LandingPageCard({ item }: { item: LandingPageListItem }) {
  return (
    <Link
      href={`/lp/${item.id}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/30 hover:shadow-md"
    >
      <ProductThumbnail src={item.image_url} alt={item.title} />
      <p className="mt-3 text-sm font-bold text-[var(--brand-navy)]">{item.title}</p>
      <span className="mt-3 block rounded-full bg-[var(--brand-blue)] px-3 py-1.5 text-center text-xs font-semibold text-white">
        랜딩페이지 보기
      </span>
    </Link>
  );
}
