import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";

// Phase 2에서 §12-3 홈(히어로 캐러셀/게이팅 CTA/후기/SEO 카드)으로 교체될 자리표시자.
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold">플랜파트너스</h1>
      <p className="mt-2 text-gray-600">
        여러 통신사·보험사·상조회사를 비교해 가장 유리한 조건을 찾아드리는 비교 전문 플랫폼입니다.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/${category.slug}`}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 p-5 hover:border-gray-400"
          >
            <TrackBadge trackType={category.trackType} />
            <span className="text-lg font-semibold">{category.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
