"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 회원가입 시 서비스 이용약관·개인정보처리방침 동의(필수)와 마케팅 정보 수신 동의(선택)를
// 함께 받는다(§12-2 Footer 법적 문서와 동일 항목). 프로필 행(profiles)은 클라이언트가 직접
// insert하지 않고 signUp()의 options.data로 넘긴 메타데이터를 handle_new_user 트리거가
// auth.users 생성 시점에 대신 생성한다 — 이메일 인증 대기 등으로 세션이 아직 없어도
// 안전하게 동작하기 위함(supabase/migrations/0002_rls.sql).
function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const RE_PHONE = /^010-\d{4}-\d{4}$/;

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAgree, setTermsAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const allRequiredAgreed = termsAgree && privacyAgree;
  const allAgreed = allRequiredAgreed && marketingAgree;

  function toggleAll(checked: boolean) {
    setTermsAgree(checked);
    setPrivacyAgree(checked);
    setMarketingAgree(checked);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!displayName.trim()) return setError("이름을 입력해 주세요.");
    if (!RE_PHONE.test(phone)) return setError("휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않습니다.");
    if (!termsAgree || !privacyAgree) return setError("서비스 이용약관과 개인정보처리방침에 동의해 주세요.");

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone,
          marketing_opt_in: marketingAgree,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "이미 가입된 이메일입니다."
          : "회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-mint)]/15 text-2xl text-[var(--brand-mint)]">
          ✓
        </div>
        <p className="mt-4 text-base font-bold text-[var(--brand-navy)]">회원가입 신청이 완료되었습니다</p>
        <p className="mt-2 text-sm text-gray-500">
          입력하신 이메일로 인증 메일을 보내드렸습니다. 메일함에서 인증을 완료한 뒤 로그인해 주세요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-full bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
        >
          홈으로
        </button>
      </div>
    );
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
          비밀번호 (8자 이상)
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
        <label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
          비밀번호 확인
        </label>
        <input
          id="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
          이름
        </label>
        <input
          id="displayName"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
          휴대폰 번호
        </label>
        <input
          id="phone"
          type="tel"
          required
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <label className="flex items-center gap-2.5 border-b border-gray-200 pb-3 text-sm font-bold text-[var(--brand-navy)]">
          <input
            type="checkbox"
            checked={allAgreed}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand-blue)]"
          />
          전체 동의
        </label>

        <div className="mt-3 space-y-2.5">
          <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={termsAgree}
                onChange={(e) => setTermsAgree(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              (필수) 서비스 이용약관 동의
            </span>
            <Link href="/legal/terms" target="_blank" className="text-xs text-[var(--brand-blue)] underline">
              보기
            </Link>
          </label>

          <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={privacyAgree}
                onChange={(e) => setPrivacyAgree(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              (필수) 개인정보 수집·이용 동의
            </span>
            <Link href="/legal/privacy" target="_blank" className="text-xs text-[var(--brand-blue)] underline">
              보기
            </Link>
          </label>

          <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={marketingAgree}
                onChange={(e) => setMarketingAgree(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-blue)]"
              />
              (선택) 마케팅 정보 수신 동의
            </span>
            <Link
              href="/legal/marketing-consent"
              target="_blank"
              className="text-xs text-[var(--brand-blue)] underline"
            >
              보기
            </Link>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--brand-urgent)]">{error}</p>}

      <button
        type="submit"
        disabled={loading || !allRequiredAgreed}
        className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60"
      >
        {loading ? "가입 처리 중..." : "회원가입"}
      </button>
    </form>
  );
}
