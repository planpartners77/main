import Link from "next/link";
import { DEFAULT_HOME_PAGE_SETTINGS } from "@/lib/design/site-settings";

interface HeroProps {
  tagline?: string;
  headline?: string;
  subcopy?: string;
}

// 벤치마킹 캡처(밝은 화이트 배경 + 블루 액센트 + 상단 민트 포인트)를 컨셉 컬러로 반영.
// 실제 인물 사진 에셋이 없으므로 원형 자리표시자 도형으로 대체 — 사진 확보 후 교체.
// 카피는 관리자 "페이지관리"(site_settings.home_page)에서 편집 가능 — props 미전달 시
// 기본값(DEFAULT_HOME_PAGE_SETTINGS)으로 폴백.
export function Hero({
  tagline = DEFAULT_HOME_PAGE_SETTINGS.heroTagline,
  headline = DEFAULT_HOME_PAGE_SETTINGS.heroHeadline,
  subcopy = DEFAULT_HOME_PAGE_SETTINGS.heroSubcopy,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--brand-mint)] to-[var(--brand-blue)]" />

      <div className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-10 px-4 py-16 md:flex-row md:justify-between md:py-24">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">{tagline}</p>
          <h1 className="mt-3 whitespace-pre-line text-3xl font-bold leading-snug text-[var(--brand-navy)] sm:text-4xl">
            {headline}
          </h1>
          <p className="mt-4 text-gray-500">{subcopy}</p>
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
