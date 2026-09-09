import { createHash, randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOAuthCredentials, getOAuthRedirectUri } from "@/lib/oauth/credentials";
import { sendTelegramMessage } from "@/lib/telegram";

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
  email?: string;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
}

interface KakaoUserMeResponse {
  id?: number;
  kakao_account?: KakaoAccount;
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
  // 카카오 개발자 콘솔의 "카카오계정(이메일)" 동의항목이 꺼져 있으면 이 필드 자체가 응답에
  // 없다(코드만으로는 수집 불가 — 콘솔 설정이 선행 조건). 검증된 이메일만 신뢰한다.
  const email = account.is_email_valid && account.is_email_verified ? (account.email ?? null) : null;

  // 3) 배송지정보(선택 동의항목) — 카카오 개발자 콘솔에서 현재 "권한 없음" 상태라 호출해도
  // 항상 빈 응답/실패로 돌아온다. 매 로그인마다 불필요한 왕복이 생기므로 호출 자체를 생략한다.
  // 추후 콘솔에서 해당 권한이 승인되면 이 블록을 fetch("https://kapi.kakao.com/v1/user/shipping_address")로 복원한다.

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

  const isReturningUser = !!authUserId;

  // 6) 완전 신규 회원 생성 (phone 기반 auth.users — 동의항목에 이메일이 없어 phone을 식별자로 사용).
  if (!authUserId) {
    if (!phone) return fail("kakao_phone_required");

    const baseUserPayload = {
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
        shipping_name: null,
        shipping_address: null,
        shipping_phone: null,
      },
    };

    let created = await admin.auth.admin.createUser(
      email ? { ...baseUserPayload, email, email_confirm: true } : baseUserPayload,
    );
    // 카카오 이메일이 이미 다른 계정(이메일/비밀번호 가입 등)에서 쓰이고 있으면 충돌로
    // 실패할 수 있다 — 이 경우 이메일 없이 phone만으로 재시도해 가입 자체는 막지 않는다.
    if (created.error && email) {
      created = await admin.auth.admin.createUser(baseUserPayload);
    }
    if (created.error || !created.data.user) return fail("kakao_signup_failed");
    authUserId = created.data.user.id;

    // 이 라우트는 서버에서 방금 생성을 확정한 데이터를 그대로 쓰므로, /api/notify처럼
    // DB를 재조회해 신뢰성을 검증할 필요 없이 바로 알림을 보낸다. 텔레그램 발송은 사용자
    // 리다이렉트와 무관하므로 await하지 않고 fire-and-forget으로 처리해 응답 지연을 없앤다.
    sendTelegramMessage(
      ["🆕 <b>신규 회원가입</b> (카카오 3초 로그인)", `이름: ${account.name ?? "-"}`, `연락처: ${phone ?? "-"}`].join(
        "\n",
      ),
    ).catch((err) => console.error("[kakao_signup_telegram_notify_failed]", err));
  }

  // 6-1) 기존 회원이 이번 로그인에서 처음으로 인증된 이메일을 동의했다면 백필한다(예: 콘솔에서
  //      이메일 동의항목을 뒤늦게 켠 경우). 이미 다른 계정이 그 이메일을 쓰고 있으면 조용히 스킵.
  if (isReturningUser && email) {
    const { data: existing } = await admin.auth.admin.getUserById(authUserId);
    if (!existing.user?.email) {
      const { error: backfillError } = await admin.auth.admin.updateUserById(authUserId, {
        email,
        email_confirm: true,
      });
      if (backfillError) {
        // 다른 계정이 이미 이 이메일을 쓰고 있는 등으로 실패해도 로그인 자체는 막지 않되,
        // 조용히 삼키지 않고 남겨서 "왜 이 회원은 이메일이 안 채워지지" 문의 시 추적 가능하게 한다.
        console.error(`[kakao_email_backfill_failed] user=${authUserId} reason=${backfillError.message}`);
      }
    }
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
