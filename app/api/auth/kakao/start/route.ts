import { NextResponse } from "next/server";

const STATE_COOKIE = "kakao_oauth_state";

// 카카오싱크 로그인 시작점. KAKAO_CLIENT_ID는 서버 전용 값(NEXT_PUBLIC_ 아님)이라
// 클라이언트가 인가 URL을 직접 만들 수 없어 이 라우트를 거친다. state는 CSRF 방지용
// 랜덤값으로, 짧게 사는 httpOnly 쿠키에 저장해 콜백에서 그대로 되돌아온 값과 대조한다.
export async function GET() {
  const clientId = process.env.KAKAO_CLIENT_ID;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL("/login?error=kakao_not_configured", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    );
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}
