import Link from "next/link";

// 벤치마킹 캡처(밝은 화이트 배경 + 블루 액센트 + 상단 민트 포인트)를 컨셉 컬러로 반영.
// 실제 인물 사진 에셋이 없으므로 원형 자리표시자 도형으로 대체 — 사진 확보 후 교체.
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--brand-mint)] to-[var(--brand-blue)]" />

      <div className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-10 px-4 py-16 md:flex-row md:justify-between md:py-24">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">
            비교하지 않으면 놓치는 혜택
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-snug text-[var(--brand-navy)] sm:text-4xl">
            대신 비교하고,
            <br />
            더 유리한 조건을 찾아드려요
          </h1>
          <p className="mt-4 text-gray-500">
            인터넷·휴대폰·가전렌탈·보험·상조, 다섯 개 카테고리를 한 곳에서 비교하세요.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              href="/quiz/internet"
              className="rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)]"
            >
              지금 무료로 비교받기
            </Link>
            <Link
              href="/consult/insurance"
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-[var(--brand-navy)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            >
              전문 상담 예약하기
            </Link>
          </div>
        </div>

        <div className="relative h-44 w-44 shrink-0 sm:h-56 sm:w-56">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--surface-tint-strong)] to-[var(--brand-mint)]/20 blur-2xl" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-[var(--surface-tint-strong)] bg-[var(--surface-tint)]">
            <span className="text-5xl font-bold text-[var(--brand-blue)]">P</span>
          </div>
        </div>
      </div>
    </section>
  );
}
