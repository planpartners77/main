import { NextResponse, type NextRequest } from "next/server";
import { logLoginEvent, type LoginProvider, type LoginResult } from "@/lib/auth/log-login-event";

const VALID_PROVIDERS = new Set(["email", "admin"]);
const VALID_RESULTS = new Set(["success", "failure"]);

// 클라이언트 전용 로그인(이메일/관리자)이 결과를 알려오면 이 라우트의 요청 헤더에서 IP/UA를
// 뽑아 login_events(0036)에 기록한다. 카카오 로그인은 서버 라우트(kakao/callback)라 자체적으로
// 직접 logLoginEvent를 호출하므로 이 엔드포인트를 거치지 않는다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider;
  const result = body?.result;
  if (!VALID_PROVIDERS.has(provider) || !VALID_RESULTS.has(result)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent");

  await logLoginEvent({
    provider: provider as LoginProvider,
    result: result as LoginResult,
    ip,
    userAgent,
    userId: typeof body.userId === "string" ? body.userId : null,
    identifier: typeof body.identifier === "string" ? body.identifier.slice(0, 200) : null,
    failureReason: typeof body.failureReason === "string" ? body.failureReason.slice(0, 200) : null,
  }).catch((err) => console.error("[login_event_log_failed]", err));

  return NextResponse.json({ ok: true });
}
