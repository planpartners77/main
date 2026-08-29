import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";

// Phase 2에서 §12-6 추천 퀴즈 컴포넌트로 교체될 자리표시자.
export default async function QuizPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold">{category.name} 추천 퀴즈</h1>
      <p className="mt-2 text-gray-600">Phase 2에서 §12-6 퀴즈 컴포넌트로 구현 예정입니다.</p>
    </main>
  );
}
