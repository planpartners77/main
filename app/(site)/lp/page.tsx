import { getLandingPageList } from "@/lib/landing/pages-query";
import { LandingPageCard } from "@/components/landing/LandingPageCard";

export default async function LandingPageGalleryPage() {
  const items = await getLandingPageList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">LANDING PAGE</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">랜딩페이지</h1>
      <p className="mt-2 text-sm text-gray-500">진행 중인 프로모션 랜딩페이지를 확인해 보세요.</p>

      <div className="mt-8">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            아직 등록된 랜딩페이지가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <LandingPageCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
