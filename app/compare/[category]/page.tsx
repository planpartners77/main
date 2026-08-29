import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";

// Phase 2에서 §12-7 비교 리스트 컴포넌트로 교체될 자리표시자.
export default async function ComparePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-bold">{category.name} 비교 결과</h1>
      <p className="mt-2 text-gray-600">Phase 2에서 §12-7 비교 리스트 컴포넌트로 구현 예정입니다.</p>
    </main>
  );
}
