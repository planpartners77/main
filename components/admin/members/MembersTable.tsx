"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface MemberRow {
  id: string;
  display_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  referral_role: "member" | "partner";
  status: "active" | "suspended" | "withdrawn";
  created_at: string;
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
        {message && <span className="text-gray-500">{message}</span>}
      </div>

      <div className="overflow-x-auto rounded-b-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
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
                  {new Date(member.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3 font-medium">{member.display_name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{emailById.get(member.id) ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{member.phone ?? "-"}</td>
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
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/members/${member.id}`}
                    className="text-xs font-semibold text-gray-500 hover:text-[var(--brand-navy)]"
                  >
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
