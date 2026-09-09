"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "삭제"는 물리 삭제가 아니라 로그인 영구 차단 + 개인정보 익명화다(포인트/쿠폰/추천인 이력은
// 정산 근거로 남아야 해서 물리 삭제하지 않는다). API route(app/api/admin/members/[id]/delete)가
// 서비스 롤 키로 auth.users 밴 처리와 profiles 익명화를 함께 수행한다.
export function MemberDeleteButton({
  memberId,
  memberName,
  redirectOnSuccess,
  alreadyWithdrawn,
}: {
  memberId: string;
  memberName: string;
  redirectOnSuccess?: string;
  alreadyWithdrawn?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyWithdrawn) {
    return <span className="text-xs font-medium text-gray-400">탈퇴됨</span>;
  }

  async function handleDelete() {
    if (
      !confirm(
        `"${memberName}" 회원을 삭제할까요?\n\n로그인이 영구 차단되고 이름/연락처/카카오정보 등 개인정보가 익명화됩니다.\n포인트/쿠폰/추천인 이력은 정산 근거 보존을 위해 남습니다.\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admin/members/${memberId}/delete`, { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setDeleting(false);
      setError(body.error ?? "삭제에 실패했습니다.");
      return;
    }

    if (redirectOnSuccess) {
      router.push(redirectOnSuccess);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
      >
        {deleting ? "삭제 중..." : "삭제"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
