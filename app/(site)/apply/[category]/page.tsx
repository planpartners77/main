import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { TravelApplyForm } from "@/components/travel/TravelApplyForm";

// Phase 3에서 §12-8 신청서 플로우(셀프서비스 트랙)로 교체될 자리표시자.
// travel은 파트너사(여기캠프) CRIS 프로그램 전용 신청서가 먼저 만들어져 예외적으로 분기한다.
export default async function ApplyPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  if (slug === "travel") {
    return <TravelApplyForm />;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">{category.name} 신청서</h1>
      <p className="mt-2 text-gray-600">Phase 3에서 §12-8 신청서 플로우로 구현 예정입니다.</p>
    </main>
  );
}
