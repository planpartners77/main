import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">RESET PASSWORD</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">비밀번호 재설정</h1>
      <p className="mt-2 text-sm text-gray-500">새로 사용하실 비밀번호를 입력해 주세요.</p>
      <ResetPasswordForm />
    </main>
  );
}
