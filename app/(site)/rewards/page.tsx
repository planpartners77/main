export default function RewardsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">REWARDS</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">사은품 지급 명단</h1>
      <p className="mt-2 text-sm text-gray-500">
        상품 신청 완료 후 사은품이 지급된 이용자 명단을 안내합니다. (개인정보 보호를 위해 이름 일부는 비공개 처리됩니다)
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
        등록된 지급 내역이 없습니다. 서비스 오픈 후 공개됩니다.
      </div>
    </main>
  );
}
