import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlugPath } from "@/lib/design/category-tree";
import { TrackBadge } from "@/components/shared/TrackBadge";

// 관리자가 카테고리관리에서 새로 추가했지만 아직 전용 페이지(예: /travel, /insurance)가 없는
// 카테고리를 위한 자리표시자. 기존 정적 폴더가 있는 슬러그는 Next.js가 그 폴더를 우선
// 매칭하므로 이 라우트까지 오지 않는다.
export default async function CategoryFallbackPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = await getCategoryBySlugPath([slug]);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <TrackBadge trackType={category.track_type} />
      <h1 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">{category.name}</h1>
      {category.track_type === "consult_required" ? (
        <>
          <p className="mt-2 text-gray-600">
            {category.name}은(는) 상담을 통해 안내드리는 카테고리입니다. 아래 버튼으로 상담을 신청해주세요.
          </p>
          <Link
            href={`/consult/${category.slug}`}
            className="mt-6 inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white"
          >
            상담 신청하기
          </Link>
        </>
      ) : (
        <p className="mt-2 text-gray-600">{category.name} 카테고리 페이지는 준비 중입니다.</p>
      )}
    </main>
  );
}
