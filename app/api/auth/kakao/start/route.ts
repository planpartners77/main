import { NextResponse, type NextRequest } from "next/server";
import { getOAuthCredentials, getOAuthRedirectUri } from "@/lib/oauth/credentials";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

const STATE_COOKIE = "kakao_oauth_state";
const NEXT_COOKIE = "kakao_oauth_next";

export async function GET(request: NextRequest) {
  const next = sanitizeNextPath(new URL(request.url).searchParams.get("next"));
  const { clientId } = await getOAuthCredentials("kakao");
  const redirectUri = getOAuthRedirectUri("kakao");

  if (!clientId) {
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
  if (next) {
    response.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });
  }
  return response;
}
