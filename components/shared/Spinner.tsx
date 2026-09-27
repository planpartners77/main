// 폼 제출 버튼 등의 로딩 상태 표시용 인라인 스피너. Tailwind 기본 제공 animate-spin만
// 사용해 별도 라이브러리·커스텀 keyframe 없이 가볍게 처리한다.
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
