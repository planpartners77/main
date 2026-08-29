// middleware.ts가 유일하게 인증 없이 통과시키는 /admin 하위 경로.
// Phase 4에서 관리자 전용 로그인 폼(고객 로그인 모달과 별도)으로 구현 예정.
export default function AdminLoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">관리자 로그인</h1>
      <p className="mt-2 text-gray-600">Phase 4에서 관리자 전용 로그인 폼으로 구현 예정입니다.</p>
    </main>
  );
}
