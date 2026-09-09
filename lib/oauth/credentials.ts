import { createAdminClient } from "@/lib/supabase/admin";

export type OAuthProvider = "kakao" | "google";

export interface OAuthCredentials {
  clientId: string | null;
  clientSecret: string | null;
}

// 배포 도메인이 바뀌면 자동으로 같이 바뀌어야 하는 값이라 admin 입력 항목으로 두지 않고
// NEXT_PUBLIC_SITE_URL 기준으로 항상 계산한다. 관리자 화면에는 이 값을 읽기 전용으로 보여주고
// 카카오/구글 개발자 콘솔에 그대로 등록하도록 안내한다.
export function getOAuthRedirectUri(provider: OAuthProvider): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/api/auth/${provider}/callback`;
}

// oauth_credentials 테이블은 관리자 전용 RLS(공개 select 없음)이므로, 로그인 세션이 없는
// 일반 방문자가 거치는 /api/auth/*/start, callback 라우트에서는 service role 클라이언트로
// 조회해야 한다. 절대 클라이언트 컴포넌트/번들에서 import하지 말 것.
export async function getOAuthCredentials(provider: OAuthProvider): Promise<OAuthCredentials> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("oauth_credentials")
    .select("client_id, client_secret")
    .eq("provider", provider)
    .maybeSingle();

  return {
    clientId: data?.client_id ?? null,
    clientSecret: data?.client_secret ?? null,
  };
}
