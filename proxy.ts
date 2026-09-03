import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// 관리자페이지 보안 경계: 서브도메인 대신 /admin 경로 + 미들웨어로 분리하기로 결정(§9 원칙의 변형).
// admin_users 테이블에 role이 없는 사용자는 /admin 어디에도 접근할 수 없다.
const ADMIN_LOGIN_PATH = "/admin/login";
const VISITOR_ID_COOKIE = "pp_visitor_id";
const VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2년

// 통계 "접속자 현황" 집계 대상 여부: 관리자 본인 방문과 라우터 프리페치(실제 방문 아님)는 제외한다.
function shouldLogVisit(request: NextRequest) {
  if (request.method !== "GET") return false;
  if (request.nextUrl.pathname.startsWith("/admin")) return false;
  if (request.headers.get("next-router-prefetch")) return false;
  if (request.headers.get("purpose") === "prefetch") return false;
  return true;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPath = request.nextUrl.pathname === ADMIN_LOGIN_PATH;

  if (isAdminPath && !isAdminLoginPath) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }

    // admin_users에 등록되지 않은 계정(일반 고객 등급 등)은 role 조회 결과가 없어 즉시 차단된다.
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminUser) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
  }

  // 사이트 전역 방문 기록: 응답을 막지 않도록 세션 조회 + insert를 waitUntil로 백그라운드 처리한다.
  if (shouldLogVisit(request)) {
    let visitorId = request.cookies.get(VISITOR_ID_COOKIE)?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      response.cookies.set(VISITOR_ID_COOKIE, visitorId, {
        maxAge: VISITOR_ID_MAX_AGE,
        path: "/",
        sameSite: "lax",
      });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent");
    const path = request.nextUrl.pathname;

    event.waitUntil(
      supabase.auth.getSession().then(({ data: { session } }) =>
        supabase.from("visitor_logs").insert({
          visitor_id: visitorId,
          user_id: session?.user?.id ?? null,
          ip,
          user_agent: userAgent,
          path,
        }),
      ),
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)"],
};
