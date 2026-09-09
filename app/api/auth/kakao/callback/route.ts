import { createHash, randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOAuthCredentials, getOAuthRedirectUri } from "@/lib/oauth/credentials";

const STATE_COOKIE = "kakao_oauth_state";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface KakaoTokenResponse {
  access_token?: string;
  error?: string;
}

interface KakaoAccount {
  name?: string;
  gender?: "male" | "female";
  birthday?: string; // MMDD
  birthyear?: string; // YYYY
  phone_number?: string; // 예: "+82 10-1234-5678"
  ci?: string;
}

interface KakaoUserMeResponse {
  id?: number;
  kakao_account?: KakaoAccount;
}

interface KakaoShippingAddress {
  base_address?: string;
  detail_address?: string;
  receiver_name?: string;
  receiver_phone_number1?: string;
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  // 카카오는 "+82 10-1234-5678" 형태로 내려준다 — Supabase phone auth는 공백/하이픈 없는
  // E.164(+821012345678)를 요구하므로 숫자/+만 남긴다.
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned || null;
}

function normalizeBirthdate(birthyear: string | undefined, birthday: string | undefined): string | null {
  if (!birthyear || !birthday || birthday.length !== 4) return null;
  return `${birthyear}-${birthday.slice(0, 2)}-${birthday.slice(2, 4)}`;
}

function hashCi(ci: string): string {
  const pepper = process.env.CI_HASH_PEPPER ?? "";
  return createHash("sha256").update(`${ci}${pepper}`).digest("hex");
}

function fail(reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, siteUrl));
}

export async function GET(request: NextRequest) {
  const { clientId, clientSecret } = await getOAuthCredentials("kakao");
  const redirectUri = getOAuthRedirectUri("kakao");
  if (!clientId) return fail("kakao_not_configured");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("kakao_invalid_state");
  }

  // 1) 인가코드 -> 액세스 토큰 교환
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      redirect_uri: redirectUri,
      code,
    }),
  });
  const tokenData = (await tokenRes.json()) as KakaoTokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) return fail("kakao_token_failed");

  // 2) 동의한 개인정보 조회
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const me = (await meRes.json()) as KakaoUserMeResponse;
  if (!meRes.ok || !me.id) return fail("kakao_profile_failed");

  const kakaoUserId = String(me.id);
  const account = me.kakao_account ?? {};
  const phone = normalizePhone(account.phone_number);
  const birthdate = normalizeBirthdate(account.birthyear, account.birthday);
  const ciHash = account.ci ? hashCi(account.ci) : null;

  // 3) 배송지정보(선택 동의항목) — 미동의/미등록이면 조용히 스킵.
  let shipping: KakaoShippingAddress | null = null;
  try {
    const shippingRes = await fetch("https://kapi.kakao.com/v1/user/shipping_address", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (shippingRes.ok) {
      const shippingData = (await shippingRes.json()) as {
        shipping_addresses?: KakaoShippingAddress[];
      };
      shipping = shippingData.shipping_addresses?.[0] ?? null;
    }
  } catch {
    // 배송지 조회 실패는 로그인 자체를 막을 이유가 아니므로 무시한다.
  }

  const admin = createAdminClient();

  // 4) 기존 카카오 연동 계정 확인
  const { data: existingByKakao } = await admin
    .from("profiles")
    .select("id")
    .eq("kakao_user_id", kakaoUserId)
    .maybeSingle();

  let authUserId = existingByKakao?.id ?? null;

  // 5) 카카오로는 처음이지만, 동일 전화번호로 가입된 계정이 있으면 연결(중복 가입 방지).
  if (!authUserId && phone) {
    const { data: existingByPhone } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .is("kakao_user_id", null)
      .maybeSingle();
    if (existingByPhone) {
      authUserId = existingByPhone.id;
      await admin.from("profiles").update({ kakao_user_id: kakaoUserId }).eq("id", authUserId);
    }
  }

  // 6) 완전 신규 회원 생성 (phone 기반 auth.users — 동의항목에 이메일이 없어 phone을 식별자로 사용).
  if (!authUserId) {
    if (!phone) return fail("kakao_phone_required");

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: {
        display_name: account.name ?? null,
        phone,
        auth_provider: "kakao",
        kakao_user_id: kakaoUserId,
        gender: account.gender ?? null,
        birthdate,
        ci_hash: ciHash,
        shipping_name: shipping?.receiver_name ?? null,
        shipping_address: shipping ? `${shipping.base_address ?? ""} ${shipping.detail_address ?? ""}`.trim() : null,
        shipping_phone: shipping?.receiver_phone_number1 ?? null,
      },
    });
    if (createError || !created.user) return fail("kakao_signup_failed");
    authUserId = created.user.id;
  }

  // 7) Admin API로는 세션을 직접 발급할 수 없어, 임시 비밀번호를 설정한 뒤 서버에서 즉시
  //    signInWithPassword로 실제 세션 토큰을 받는다(Route Handler라 쿠키 저장이 실제로 동작함).
  const tempPassword = randomBytes(24).toString("hex");
  const { error: pwError } = await admin.auth.admin.updateUserById(authUserId, { password: tempPassword });
  if (pwError) return fail("kakao_session_failed");

  const supabase = await createClient();
  const { error: signInError } = phone
    ? await supabase.auth.signInWithPassword({ phone, password: tempPassword })
    : { error: new Error("no_phone") };
  if (signInError) return fail("kakao_session_failed");

  const response = NextResponse.redirect(new URL("/mypage", siteUrl));
  response.cookies.delete(STATE_COOKIE);
  return response;
}
