import { Suspense } from "react";
import { getUsimPlanList } from "@/lib/usim/plans-query";
import { UsimPlanList } from "@/components/usim/UsimPlanList";

export default async function UsimPage() {
  const items = await getUsimPlanList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">USIM PLAN</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">알뜰폰 요금제 비교</h1>
      <p className="mt-2 text-sm text-gray-500">데이터 사용량과 조건에 맞는 요금제를 비교하고 바로 신청해 보세요.</p>

      <div className="mt-8">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            아직 등록된 요금제가 없습니다. 곧 다양한 요금제를 만나보실 수 있어요.
          </p>
        ) : (
          <Suspense>
            <UsimPlanList items={items} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
