import { getMobileDeviceList } from "@/lib/mobile/devices-query";
import { PhoneDeviceList } from "@/components/mobile/PhoneDeviceList";

export default async function MobilePage() {
  const items = await getMobileDeviceList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">MOBILE DEVICE</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">휴대폰 최저가 비교</h1>
      <p className="mt-2 text-sm text-gray-500">제조사·통신사·개통 방식별 지원금 혜택을 비교하고 바로 신청해 보세요.</p>

      <div className="mt-8">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            아직 등록된 기종이 없습니다. 곧 다양한 기종을 만나보실 수 있어요.
          </p>
        ) : (
          <PhoneDeviceList items={items} />
        )}
      </div>
    </main>
  );
}
