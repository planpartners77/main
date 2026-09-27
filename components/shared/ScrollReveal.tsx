"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// IntersectionObserver 기반 스크롤 리빌. 별도 애니메이션 라이브러리 없이 섹션이 뷰포트에
// 들어올 때만 opacity/translate 트랜지션을 건다. children은 서버에서 렌더된 결과를 그대로
// 감싸는 것이라(RSC 패턴) 각 섹션 컴포넌트 자체를 클라이언트 컴포넌트로 바꿀 필요가 없다.
// prefers-reduced-motion 사용자는 motion-safe: variant 덕분에 처음부터 완전히 보이는 상태다.
export function ScrollReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        visible
          ? "motion-safe:translate-y-0 motion-safe:opacity-100 motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out"
          : "motion-safe:translate-y-6 motion-safe:opacity-0"
      }
    >
      {children}
    </div>
  );
}
