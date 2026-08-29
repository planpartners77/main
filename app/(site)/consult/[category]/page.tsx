import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";

// Phase 3에서 §12-8 상담 예약 플로우(상담필수 트랙 전용)로 교체될 자리표시자.
export default async function ConsultPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">{category.name} 상담 예약</h1>
      <p className="mt-2 text-gray-600">Phase 3에서 §12-8 상담 예약 플로우로 구현 예정입니다.</p>
    </main>
  );
}
