// 신청/가입 완료 화면 공통 체크 아이콘. 전환의 핵심 순간(상담/신청 접수 완료)에
// 시각적 확인 신호를 주기 위해 배지가 살짝 튀어오르며 나타나고 체크가 그려지는
// 애니메이션을 적용한다 — 순수 CSS(@keyframes, app/globals.css)로만 구현해 별도
// 라이브러리·서버 요청 없이 가볍게 처리한다. prefers-reduced-motion 사용자는
// motion-safe: variant 덕분에 애니메이션 없이 완성된 모양으로 바로 보인다.
export function SuccessCheck({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-mint)]/15 motion-safe:[animation:success-pop_0.45s_cubic-bezier(0.34,1.56,0.64,1)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="var(--brand-mint)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="motion-safe:[stroke-dasharray:1] motion-safe:[stroke-dashoffset:1] motion-safe:[animation:success-check-draw_0.4s_0.2s_ease-out_forwards]"
        />
      </svg>
    </div>
  );
}
