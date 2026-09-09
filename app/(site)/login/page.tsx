import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { getLoginMethodsSettings } from "@/lib/design/site-settings";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

const KAKAO_ERROR_MESSAGES: Record<string, string> = {
  kakao_not_configured: "카카오 로그인이 아직 설정되지 않았습니다.",
  kakao_invalid_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  kakao_token_failed: "카카오 인증에 실패했습니다. 다시 시도해 주세요.",
  kakao_profile_failed: "카카오 프로필 조회에 실패했습니다. 다시 시도해 주세요.",
  kakao_phone_required: "카카오 계정에 연락처 동의가 필요합니다.",
  kakao_signup_failed: "회원 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  kakao_session_failed: "로그인 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; error?: string; next?: string }>;
}) {
  const { confirmed, error, next: rawNext } = await searchParams;
  const next = sanitizeNextPath(rawNext) ?? "/mypage";
  const loginMethods = await getLoginMethodsSettings();

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">LOG IN</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">로그인</h1>
      <p className="mt-2 text-sm text-gray-500">가입하신 이메일과 비밀번호로 로그인해 주세요.</p>
      {confirmed === "1" && (
        <p className="mt-3 rounded-lg bg-[var(--brand-mint)]/10 px-3 py-2 text-sm font-medium text-[var(--brand-mint)]">
          이메일 인증이 완료되었습니다. 로그인해 주세요.
        </p>
      )}
      {error && KAKAO_ERROR_MESSAGES[error] && (
        <p className="mt-3 rounded-lg bg-[var(--brand-urgent)]/10 px-3 py-2 text-sm font-medium text-[var(--brand-urgent)]">
          {KAKAO_ERROR_MESSAGES[error]}
        </p>
      )}
      <LoginForm kakaoEnabled={loginMethods.kakao} next={next} />
      <p className="mt-6 text-center text-sm text-gray-500">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-semibold text-[var(--brand-blue)]">
          회원가입
        </Link>
      </p>
    </main>
  );
}
