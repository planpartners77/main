import { LoginForm } from "@/components/admin/LoginForm";

// proxy.ts가 유일하게 인증 없이 통과시키는 /admin 하위 경로.
// 기존 회원 계정도 admin_users에 role이 부여되면 여기서 동일한 이메일/비밀번호로 로그인할 수 있다.
export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--brand-navy)]">플랜파트너스 관리자</h1>
      <p className="mt-2 text-sm text-gray-500">
        관리자 권한이 부여된 계정의 이메일과 비밀번호로 로그인하세요.
      </p>
      <LoginForm />
    </main>
  );
}
