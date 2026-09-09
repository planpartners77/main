import { NextResponse, type NextRequest } from "next/server";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import { logLoginEvent, type LoginProvider } from "@/lib/auth/log-login-event";

const VALID_PROVIDERS = new Set(["email", "admin"]);

// 이메일/관리자 로그인은 클라이언트가 supabase.auth.signInWithPassword를 직접 호출하므로,
// 그 전에 이 라우트로 먼저 물어봐서 최근 실패가 과도하면 아예 시도 자체를 막는다(§보안 2단계).
// 서버를 거치지 않는 구조라 완벽한 차단은 아니지만(직접 Supabase REST를 두드리면 우회 가능),
// 정상적인 우리 로그인 폼을 통한 무차별 대입은 막고 시도 자체를 login_events에 남긴다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider;
  const identifier = typeof body?.identifier === "string" ? body.identifier.slice(0, 200) : null;
  if (!VALID_PROVIDERS.has(provider)) {
    return NextResponse.json({ blocked: false }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent");

  const { blocked, reason } = await checkLoginRateLimit({ identifier, ip });
  if (blocked) {
    logLoginEvent({
      provider: provider as LoginProvider,
      result: "failure",
      ip,
      userAgent,
      identifier,
      failureReason: reason ?? "rate_limited",
    }).catch((err) => console.error("[login_event_log_failed]", err));
  }

  return NextResponse.json({ blocked });
}
