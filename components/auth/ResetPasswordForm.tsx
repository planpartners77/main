"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 관리자/본인이 발송한 비밀번호 재설정 메일의 링크가 도착하는 페이지.
// Supabase가 URL의 recovery 토큰을 감지하면(detectSessionInUrl) PASSWORD_RECOVERY
// 이벤트가 발생하며 임시 세션이 생기는데, 그 시점 이후에만 새 비밀번호 설정을 허용한다.
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (!ready) {
    return <p className="mt-8 text-sm text-gray-500">인증 확인 중입니다...</p>;
  }

  if (done) {
    return <p className="mt-8 text-sm text-green-600">비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          새 비밀번호
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          새 비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-[var(--brand-urgent)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60"
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
