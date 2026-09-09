"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "즉시 삭제"는 탈퇴처리+익명화(MemberDeleteButton)와 달리 실제로 행을 지우는 물리 삭제다.
// 회원이 개인정보 삭제를 명시적으로 요구한 경우에만 쓰도록, 이름을 정확히 타이핑해야
// 실행되게 해서 실수 클릭을 막는다. super_admin에게만 렌더링된다(호출부에서 gating).
export function MemberPurgeButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expected = memberName || "이름 없음";
  const canConfirm = confirmText === expected;

  async function handlePurge() {
    if (!canConfirm) return;
    setPurging(true);
    setError(null);

    const res = await fetch(`/api/admin/members/${memberId}/purge`, { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      setPurging(false);
      setError(body.error ?? "삭제에 실패했습니다.");
      return;
    }

    router.push("/admin/members");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-red-700 underline hover:text-red-900"
      >
        즉시 데이터 삭제(복구 불가)
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">즉시 데이터 삭제 — 되돌릴 수 없습니다</p>
      <p className="mt-1 text-xs text-red-600">
        회원의 요청으로 개인정보를 완전히 물리 삭제합니다(탈퇴처리와 달리 백업이나 복구가
        불가능합니다). 계속하려면 아래에 회원 이름 &quot;{expected}&quot;을(를) 정확히 입력하세요.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={expected}
        className="mt-3 w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handlePurge}
          disabled={!canConfirm || purging}
          className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          {purging ? "삭제 중..." : "영구 삭제 실행"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
          className="text-xs font-semibold text-gray-500"
        >
          취소
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
