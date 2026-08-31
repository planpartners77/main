import Link from "next/link";

// '여행' 하위카테고리(일반 여행 상품) 준비중 안내. /travel(에듀 · 여기캠프 CRIS 골프 체험)과
// 분리된 별도 트랙이며, 아직 제휴 상품이 없어 다른 "준비 중" 화면과 동일한 빈 상태 패턴을 쓴다.
export default function TravelGeneralPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">TRAVEL</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">여행</h1>
      <p className="mt-2 text-sm text-gray-500">
        일반 여행 상품은 제휴 준비 중입니다. 오픈 소식은 공지사항을 통해 안내드릴게요.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center text-sm text-gray-500">
        준비 중인 상품입니다.
        <div className="mt-4">
          <Link href="/travel" className="text-sm font-semibold text-[var(--brand-blue)]">
            대신 여기캠프 국제학교 골프 체험(에듀) 보러가기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
