import { NextResponse } from "next/server";
import { getOAuthCredentials, getOAuthRedirectUri } from "@/lib/oauth/credentials";

const STATE_COOKIE = "kakao_oauth_state";

export async function GET() {
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
  return response;
}
