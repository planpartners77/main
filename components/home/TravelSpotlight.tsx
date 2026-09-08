import Link from "next/link";

const BENEFITS = [
  { icon: "🛏️", label: "콘도형 리조트 숙박·식사 포함" },
  { icon: "📖", label: "원어민 교사와 함께하는 영어 수업" },
  { icon: "⛳", label: "PGA 프로 골프 레슨 + 그린피 포함" },
];

// 홈 화면을 유심(상품 그리드)·여행(단일 프로그램) 두 축으로 재구성하면서, 여행은
// products 테이블에 상품이 없어 ProductDisplaySection으로는 노출이 안 되는 구조라
// /travel(CrisGolfProgram) 랜딩으로 이어지는 별도 스포트라이트 카드로 대신 소개한다.
export function TravelSpotlight() {
  return (
    <section className="bg-[var(--surface-tint)] py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">지금 인기 있는 여행 프로그램</h2>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm sm:flex sm:items-stretch">
          <div className="sm:w-1/2">
            <img
              src="/travel/hero.jpg"
              alt="태국 치앙라이 CRIS 국제학교 골프 프로그램"
              className="aspect-[1343/727] w-full object-cover sm:h-full sm:aspect-auto"
            />
          </div>

          <div className="flex flex-col justify-center gap-4 p-6 sm:w-1/2 sm:p-8">
            <p className="text-sm font-semibold text-[var(--brand-blue)]">태국 치앙라이 · 영어캠프</p>
            <h3 className="text-lg font-bold leading-snug text-[var(--brand-navy)]">
              CRIS 국제학교와 함께하는
              <br />
              영어 골프 캠프
            </h3>
            <ul className="space-y-2">
              {BENEFITS.map((b) => (
                <li key={b.label} className="flex items-start gap-2 text-sm text-gray-600">
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/travel"
              className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-blue-dark)]"
            >
              자세히 보기
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
