export default function NoticesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">NOTICE</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">공지사항</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
        등록된 공지사항이 없습니다.
      </div>
    </main>
  );
}
