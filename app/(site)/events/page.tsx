export default function EventsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">EVENT</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">이벤트</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
        진행 중인 이벤트가 없습니다. 서비스 오픈 후 공개됩니다.
      </div>
    </main>
  );
}
