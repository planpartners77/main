export default function AccountSuspendedPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-14 text-center">
      <p className="text-xs font-bold tracking-wider text-red-500">ACCOUNT</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">이용이 제한된 계정입니다</h1>
      <p className="mt-4 text-sm text-gray-500">
        정지 또는 탈퇴 처리된 계정으로 확인되어 로그인이 종료되었습니다.
        <br />
        문의사항이 있으시면 고객센터로 연락해 주세요.
      </p>
    </main>
  );
}
