import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">LOG IN</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">로그인</h1>
      <p className="mt-2 text-sm text-gray-500">가입하신 이메일과 비밀번호로 로그인해 주세요.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-semibold text-[var(--brand-blue)]">
          회원가입
        </Link>
      </p>
    </main>
  );
}
