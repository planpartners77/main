"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 카카오싱크 심사 완료 전까지의 임시 로그인 방식(§12-9는 원래 카카오 로그인 모달을 계획).
// /signup과 동일한 이메일+비밀번호 계정을 그대로 사용한다.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/mypage");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
  );
}
