import Link from "next/link";

// 실제 앱스토어/플레이스토어 링크가 없는 상태에서 다운로드 배지를 넣는 것은
// 사용자를 속이는 다크패턴이라 배제했다(§벤치마킹 원칙). 앱 확장 계획은 문구로만 안내.
export function BottomCta() {
  return (
    <section className="bg-[var(--surface-tint-strong)] py-14">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center">
        <h2 className="text-xl font-bold text-[var(--brand-navy)]">
          바쁜 생활 속 선택을 더 똑똑하게
        </h2>
        <p className="text-sm text-gray-500">
          모바일 앱(iOS/Android)은 준비 중입니다. 지금은 모바일 웹으로도 동일하게 이용하실 수
          있어요.
        </p>
        <Link
          href="/consult/insurance"
          className="mt-2 rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
        >
          지금 상담 받기
        </Link>
      </div>
    </section>
  );
}
