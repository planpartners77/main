"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { reportLoginEvent } from "@/lib/auth/report-login-event";

export function LoginForm({ kakaoEnabled = false, next = "/" }: { kakaoEnabled?: boolean; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 카카오 로그인이 켜져 있으면 "카카오 3초 로그인"만 전면에 노출하고, 이메일/비밀번호 로그인은
  // 기존 이메일 가입 회원을 위한 보조 수단으로 접어둔다(완전 삭제하면 기존 계정이 로그인 불가).
  const [showEmailForm, setShowEmailForm] = useState(!kakaoEnabled);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      reportLoginEvent({ provider: "email", result: "failure", identifier: email, failureReason: signInError.message });
      return;
    }

    reportLoginEvent({ provider: "email", result: "success", identifier: email, userId: data.user?.id });
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mt-8">
      {kakaoEnabled && (
        <>
          <a
            href={`/api/auth/kakao/start?next=${encodeURIComponent(next)}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3.5 text-base font-bold text-[#191919] shadow-sm transition hover:brightness-95"
          >
            카카오 3초 로그인
          </a>
          {!showEmailForm && (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="mt-4 w-full text-center text-xs text-gray-400 underline underline-offset-2"
            >
              이메일로 로그인
            </button>
          )}
        </>
      )}

      {showEmailForm && (
        <form
          onSubmit={handleSubmit}
          className={kakaoEnabled ? "mt-6 space-y-4 border-t border-gray-100 pt-6" : "space-y-4"}
        >
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-[var(--brand-urgent)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      )}
    </div>
  );
}
