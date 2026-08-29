import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 관리자페이지 보안 경계: 서브도메인 대신 /admin 경로 + 미들웨어로 분리하기로 결정(§9 원칙의 변형).
// admin_users 테이블에 role이 없는 사용자는 /admin 어디에도 접근할 수 없다.
const ADMIN_LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
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

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
