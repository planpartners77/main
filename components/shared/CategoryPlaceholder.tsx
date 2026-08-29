import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";

// Phase 0 스켈레톤: 직접 URL 진입 렌더링(§8, §13)이 처음부터 깨지지 않도록
// 실제 랜딩(§12-4/§12-5)이 만들어지기 전까지 자리를 지키는 임시 템플릿.
export function CategoryPlaceholder({ slug }: { slug: string }) {
  const category = getCategory(slug);
  if (!category) notFound();

  const templateRef = category.trackType === "self_service" ? "§12-4 셀프서비스형" : "§12-5 상담필수형";

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <TrackBadge trackType={category.trackType} />
      <h1 className="mt-4 text-3xl font-bold">{category.name}</h1>
      <p className="mt-2 text-gray-600">
        {category.name} 카테고리 랜딩 페이지 자리표시자입니다. Phase 2에서 {templateRef} 템플릿으로 교체됩니다.
      </p>
    </main>
  );
}
