"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 로그인 유도 팝업: 접속 후 firstDelaySeconds초 뒤 1회 노출, 이후 로그인 전까지
// repeatMinutes분 간격으로 반복 노출한다(간편로그인 관리 화면에서 관리자가 설정).
// 닫기는 다음 주기까지만 숨기는 것이라 로그인하기 전까지는 계속 다시 뜬다(요청 스펙 그대로).
export function LoginPromptPopup({
  kakaoEnabled = false,
  firstDelaySeconds,
  repeatMinutes,
  closeButtonDelaySeconds = 0,
}: {
  kakaoEnabled?: boolean;
  firstDelaySeconds: number;
  repeatMinutes: number;
  closeButtonDelaySeconds?: number;
}) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);
  // 상품 상세 등 지금 보고 있던 페이지로 로그인 후 되돌아오기 위한 값. useSearchParams()는 이
  // 레이아웃 전체(모든 페이지)를 Suspense 경계 없이는 못 쓰게 강제하므로(ReferralCapture.tsx와
  // 동일한 이유로 회피) window.location에서 직접 읽는다 — 서버 렌더 시엔 항상 loggedIn===null이라
  // 팝업 자체가 null을 반환하므로 SSR 시 빈 문자열이어도 실제로 노출되는 값과는 무관하다.
  const search = typeof window === "undefined" ? "" : window.location.search;
  const next = `${pathname}${search}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!kakaoEnabled || loggedIn !== false) return;

    // 관리자가 0이나 음수를 입력해도 타이머가 폭주하지 않도록 최소값을 둔다.
    const firstDelayMs = Math.max(0, firstDelaySeconds) * 1000;
    const repeatMs = Math.max(0.1, repeatMinutes) * 60_000;

    const showTimer = setTimeout(() => setVisible(true), firstDelayMs);
    const repeatTimer = setInterval(() => setVisible(true), firstDelayMs + repeatMs);
    return () => {
      clearTimeout(showTimer);
      clearInterval(repeatTimer);
    };
  }, [kakaoEnabled, loggedIn, firstDelaySeconds, repeatMinutes]);

  // 노출될 때마다 닫기 버튼을 closeButtonDelaySeconds초 뒤에 다시 보여준다(재노출 주기마다 매번 적용).
  // setState를 effect 본문에서 동기 호출하지 않도록(react-hooks/set-state-in-effect) 숨김/노출
  // 둘 다 타이머 콜백 안에서 실행한다 — 0초 설정이면 두 타이머가 같은 tick에 순서대로 실행되어
  // 즉시 노출된 것과 동일하게 동작한다.
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => setCanClose(false), 0);
    const revealTimer = setTimeout(() => setCanClose(true), Math.max(0, closeButtonDelaySeconds) * 1000);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(revealTimer);
    };
  }, [visible, closeButtonDelaySeconds]);

  if (!kakaoEnabled || loggedIn !== false || !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8 sm:items-center sm:pb-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {canClose && (
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="닫기"
            className="ml-auto block text-lg text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
        <p className="text-center text-lg font-bold text-[var(--brand-navy)]">
          3초면 로그인 끝!
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          원활한 서비스 이용을 위해 카카오 계정으로 간편하게 로그인하세요
        </p>
        <a
          href={`/api/auth/kakao/start?next=${encodeURIComponent(next)}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3.5 text-base font-bold text-[#191919] shadow-sm transition hover:brightness-95"
        >
          카카오 3초 로그인
        </a>
      </div>
    </div>
  );
}
