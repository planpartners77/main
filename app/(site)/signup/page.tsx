import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">SIGN UP</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">회원가입</h1>
      <p className="mt-2 text-sm text-gray-500">
        플랜파트너스 회원이 되어 신청 내역과 혜택을 한 곳에서 관리하세요.
      </p>
      <SignupForm />
    </main>
  );
}
