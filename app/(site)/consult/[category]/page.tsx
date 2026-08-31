import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";
import { ConsultRequestForm } from "@/components/consult/ConsultRequestForm";

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
      <TrackBadge trackType={category.trackType} />
      <h1 className="mt-3 text-2xl font-bold text-[var(--brand-navy)]">{category.name} 상담 예약</h1>
      <p className="mt-2 text-sm text-gray-600">
        아래 정보를 남겨주시면 담당 상담사가 순차적으로 연락드립니다. 셀프가입이나 즉시 결제는 진행되지 않습니다.
      </p>
      <div className="mt-6">
        <ConsultRequestForm categorySlug={category.slug} categoryName={category.name} />
      </div>
    </main>
  );
}
