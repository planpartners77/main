import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlugPath } from "@/lib/design/category-tree";
import { TrackBadge } from "@/components/shared/TrackBadge";

// [category]/page.tsx와 동일한 목적의 하위카테고리용 자리표시자.
export default async function SubCategoryFallbackPage({
  params,
}: {
  params: Promise<{ category: string; sub: string }>;
}) {
  const { category, sub } = await params;
  const found = await getCategoryBySlugPath([category, sub]);
  if (!found) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <TrackBadge trackType={found.track_type} />
      <h1 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">{found.name}</h1>
      {found.track_type === "consult_required" ? (
        <>
          <p className="mt-2 text-gray-600">
            {found.name}은(는) 상담을 통해 안내드리는 카테고리입니다. 아래 버튼으로 상담을 신청해주세요.
          </p>
          <Link
            href={`/consult/${found.slug}`}
            className="mt-6 inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white"
          >
            상담 신청하기
          </Link>
        </>
      ) : (
        <p className="mt-2 text-gray-600">{found.name} 카테고리 페이지는 준비 중입니다.</p>
      )}
    </main>
  );
}
