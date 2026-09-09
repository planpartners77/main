import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { getLoginMethodsSettings } from "@/lib/design/site-settings";
import { LoginMethodsManager } from "@/components/admin/login/LoginMethodsManager";

export default async function AdminLoginMethodsPage() {
  const session = await getAdminSession();
  // 간편로그인 설정은 회원 인증 방식 자체를 바꾸는 보안 민감 항목이라 super_admin만 접근 가능
  // (permissions.ts의 login_methods 메뉴 키도 super_admin에만 부여 — admins/audit-logs와 동일한 이중 방어).
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const settings = await getLoginMethodsSettings();

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">간편로그인 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        이메일/비밀번호 외에 소셜 간편 로그인 수단을 관리합니다. 현재는 카카오싱크만
        연동되어 있으며, 구글은 추후 지원 예정입니다.
      </p>

      <div className="mt-6">
        <LoginMethodsManager settings={settings} />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">카카오싱크 연동 전 체크리스트</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>카카오 디벨로퍼스에 비즈 앱으로 등록하고 간편가입 동의항목 심사를 통과해야 합니다.</li>
          <li>
            심사 통과 후 발급되는 REST API 키/시크릿을 서버 환경변수 KAKAO_CLIENT_ID,
            KAKAO_CLIENT_SECRET에 설정해야 실제 로그인이 동작합니다.
          </li>
          <li>환경변수가 비어 있으면 토글을 켜도 로그인 시도 시 오류 화면으로 안내됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
