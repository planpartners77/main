"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FIRST_DELAY_MS = 0;
const REPEAT_INTERVAL_MS = 10_000;

// 로그인 유도 팝업: 접속 즉시 1회 노출, 이후 로그인 전까지 10초 간격으로 반복 노출한다.
// 닫기는 다음 주기까지만 숨기는 것이라 로그인하기 전까지는 계속 다시 뜬다(요청 스펙 그대로).
export function LoginPromptPopup({ kakaoEnabled = false }: { kakaoEnabled?: boolean }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);

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

    const showTimer = setTimeout(() => setVisible(true), FIRST_DELAY_MS);
    const repeatTimer = setInterval(() => setVisible(true), FIRST_DELAY_MS + REPEAT_INTERVAL_MS);
    return () => {
      clearTimeout(showTimer);
      clearInterval(repeatTimer);
    };
  }, [kakaoEnabled, loggedIn]);

  if (!kakaoEnabled || loggedIn !== false || !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8 sm:items-center sm:pb-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="닫기"
          className="ml-auto block text-lg text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
        <p className="text-center text-lg font-bold text-[var(--brand-navy)]">
          3초면 로그인 끝!
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          카카오 계정으로 간편하게 로그인하고 신청 내역과 혜택을 확인하세요.
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 페이지가 아니라 서버 리다이렉트 라우트(OAuth 시작점)라 next/link 대상이 아님 */}
        <a
          href="/api/auth/kakao/start"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3.5 text-base font-bold text-[#191919] shadow-sm transition hover:brightness-95"
        >
          카카오 3초 로그인
        </a>
      </div>
    </div>
  );
}
