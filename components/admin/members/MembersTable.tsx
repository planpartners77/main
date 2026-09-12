"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MemberDeleteButton } from "./MemberDeleteButton";

export interface MemberRow {
  id: string;
  display_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  referral_role: "member" | "partner";
  status: "active" | "suspended" | "withdrawn";
  created_at: string;
  auth_provider: "email" | "kakao";
  kakao_user_id: string | null;
  gender: "male" | "female" | null;
  birthdate: string | null;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_phone: string | null;
  customer_tiers: { name: string | null } | null;
}

const STATUS_BADGE: Record<MemberRow["status"], string> = {
  active: "bg-green-50 text-green-700",
  suspended: "bg-amber-50 text-amber-700",
  withdrawn: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<MemberRow["status"], string> = {
  active: "정상",
  suspended: "정지",
  withdrawn: "탈퇴",
};

function formatJoinedAt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function MembersTable({
  members,
  emailById,
  tierOptions,
}: {
  members: MemberRow[];
  emailById: Map<string, string>;
  tierOptions: { id: string; name: string | null }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTier, setBulkTier] = useState("");
  const [applying, setApplying] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === members.length ? new Set() : new Set(members.map((m) => m.id))));
  }

  async function applyBulkTier() {
    if (selected.size === 0 || !bulkTier) return;
    setApplying(true);
    setMessage(null);

    const supabase = createClient();
    const ids = Array.from(selected);
    const { error } = await supabase.from("profiles").update({ tier_id: bulkTier || null }).in("id", ids);

    if (error) {
      setApplying(false);
      setMessage(`실패: ${error.message}`);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_logs").insert(
      ids.map((id) => ({
        actor_id: user?.id ?? null,
        action: "bulk_update",
        target_table: "profiles",
        target_id: id,
        accessed_fields: ["tier_id"],
      })),
    );

    setApplying(false);
    setMessage(`${ids.length}명의 등급을 변경했습니다.`);
    setSelected(new Set());
    router.refresh();
  }

  async function applyBulkDelete() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const names = ids
      .map((id) => members.find((m) => m.id === id)?.display_name ?? "이름 없음")
      .slice(0, 5)
      .join(", ");
    if (
      !confirm(
        `선택한 ${ids.length}명(${names}${ids.length > 5 ? " 외" : ""})을 삭제할까요?\n\n로그인이 영구 차단되고 이름/연락처/카카오정보 등 개인정보가 익명화됩니다.\n포인트/쿠폰/추천인 이력은 정산 근거 보존을 위해 남습니다.\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    setDeletingBulk(true);
    setMessage(null);

    const results = await Promise.all(
      ids.map((id) => fetch(`/api/admin/members/${id}/delete`, { method: "POST" })),
    );
    const failCount = results.filter((r) => !r.ok).length;

    setDeletingBulk(false);
    setMessage(
      failCount > 0
        ? `${ids.length - failCount}명 삭제 완료, ${failCount}명 실패했습니다.`
        : `${ids.length}명을 삭제했습니다.`,
    );
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2 rounded-t-2xl border border-b-0 border-gray-200 bg-gray-50 px-4 py-2.5 text-xs">
        <span className="font-semibold text-gray-500">{selected.size}명 선택됨</span>
        <select
          value={bulkTier}
          onChange={(e) => setBulkTier(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5"
        >
          <option value="">등급 선택</option>
          {tierOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name ?? "이름 없음"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={applyBulkTier}
          disabled={selected.size === 0 || !bulkTier || applying}
          className="rounded-full bg-[var(--brand-navy)] px-4 py-1.5 font-semibold text-white disabled:opacity-40"
        >
          {applying ? "적용 중..." : "일괄 등급변경"}
        </button>
        <button
          type="button"
          onClick={applyBulkDelete}
          disabled={selected.size === 0 || deletingBulk}
          className="rounded-full border border-red-300 px-4 py-1.5 font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
        >
          {deletingBulk ? "삭제 중..." : "선택 삭제"}
        </button>
        {message && <span className="text-gray-500">{message}</span>}
      </div>

      <div className="overflow-x-auto rounded-b-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === members.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3">가입경로</th>
              <th className="px-4 py-3">구분</th>
              <th className="px-4 py-3">등급</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(member.id)}
                    onChange={() => toggle(member.id)}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatJoinedAt(member.created_at)}
                </td>
                <td className="px-4 py-3 font-medium">{member.display_name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{emailById.get(member.id) ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{member.phone ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {member.auth_provider === "kakao" ? (
                    <span className="rounded-full bg-[#FEE500]/60 px-2 py-0.5 text-[10px] font-semibold text-[#3C1E1E]">
                      카카오
                    </span>
                  ) : (
                    "이메일"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {member.referral_role === "partner" ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      파트너
                    </span>
                  ) : (
                    "일반회원"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{member.customer_tiers?.name ?? "일반"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[member.status]}`}>
                    {STATUS_LABEL[member.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="text-xs font-semibold text-gray-500 hover:text-[var(--brand-navy)]"
                    >
                      상세보기
                    </Link>
                    <MemberDeleteButton
                      memberId={member.id}
                      memberName={member.display_name ?? "이름 없음"}
                      alreadyWithdrawn={member.status === "withdrawn"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
