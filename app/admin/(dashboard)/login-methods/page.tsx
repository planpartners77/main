import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { getLoginMethodsSettings } from "@/lib/design/site-settings";
import { createClient } from "@/lib/supabase/server";
import { getOAuthRedirectUri, type OAuthProvider } from "@/lib/oauth/credentials";
import { LoginMethodsManager } from "@/components/admin/login/LoginMethodsManager";
import { OAuthCredentialsManager, type OAuthProviderInfo } from "@/components/admin/login/OAuthCredentialsManager";

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  kakao: "카카오",
  google: "구글",
};

export default async function AdminLoginMethodsPage() {
  const session = await getAdminSession();
  // 간편로그인 설정은 회원 인증 방식 자체를 바꾸는 보안 민감 항목이라 super_admin만 접근 가능
  // (permissions.ts의 login_methods 메뉴 키도 super_admin에만 부여 — admins/audit-logs와 동일한 이중 방어).
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const settings = await getLoginMethodsSettings();

  const supabase = await createClient();
  const { data: credentialRows } = await supabase
    .from("oauth_credentials")
    .select("provider, client_id, client_secret, updated_at");

  // client_secret 실제 값은 여기서 걸러내고 boolean(hasSecret)만 클라이언트 컴포넌트로 넘긴다
  // — 이 route는 서버 컴포넌트라 여기서 만드는 props 객체만 브라우저로 직렬화되며, secret 원문은
  // 아예 응답에 포함되지 않는다.
  const providers: OAuthProviderInfo[] = (["kakao", "google"] as const).map((provider) => {
    const row = credentialRows?.find((r) => r.provider === provider);
    return {
      provider,
      label: PROVIDER_LABELS[provider],
      clientId: row?.client_id ?? "",
      hasSecret: Boolean(row?.client_secret),
      updatedAt: row?.updated_at ?? null,
      redirectUri: getOAuthRedirectUri(provider),
    };
  });

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

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--brand-navy)]">OAuth 키 관리</h2>
        <p className="mt-1 text-xs text-gray-500">
          카카오/구글 개발자 콘솔에서 발급받은 Client ID·Secret을 아래에 입력하면 바로 저장됩니다.
          Redirect URI는 배포 도메인 기준으로 자동 계산되므로 복사해서 개발자 콘솔에 등록하세요.
        </p>
        <div className="mt-3">
          <OAuthCredentialsManager providers={providers} />
        </div>
      </div>
    </div>
  );
}
