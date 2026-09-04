"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ROLES, ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin/permissions";

interface AdminRow {
  id: string;
  role: string;
  managedCategories: string[];
  email: string;
  displayName: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

async function callApi(method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const res = await fetch("/api/admin/admins", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
}

const ERROR_MESSAGES: Record<string, string> = {
  user_not_found: "해당 이메일로 가입한 회원을 찾을 수 없습니다. 먼저 일반 회원가입이 필요합니다.",
  last_super_admin: "마지막 남은 최고 관리자는 등급을 낮추거나 해제할 수 없습니다.",
  forbidden: "권한이 없습니다.",
  invalid_input: "입력값을 확인해 주세요.",
};

function errorMessage(err: unknown) {
  const key = err instanceof Error ? err.message : "";
  return ERROR_MESSAGES[key] ?? key ?? "요청에 실패했습니다.";
}

export function AdminUserManager({
  currentUserId,
  admins,
  categories,
}: {
  currentUserId: string;
  admins: AdminRow[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("member_manager");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    try {
      await callApi("POST", { email: email.trim(), role });
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleRoleChange(id: string, nextRole: string, managedCategories: string[]) {
    setError(null);
    try {
      await callApi("PATCH", { id, role: nextRole, managedCategories });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm("이 관리자의 권한을 해제하시겠습니까?")) return;
    setError(null);
    try {
      await callApi("DELETE", { id });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">관리자 추가</p>
        <p className="mt-1 text-xs text-gray-400">
          이미 일반 회원으로 가입된 이메일만 등록할 수 있습니다.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-gray-500">이메일</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="mt-1 w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">등급</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="mt-1 w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className="rounded-full bg-[var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "추가 중..." : "추가"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">등급</th>
              <th className="px-4 py-3">담당 카테고리</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <AdminRowItem
                key={a.id}
                admin={a}
                categories={categories}
                isSelf={a.id === currentUserId}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRowItem({
  admin,
  categories,
  isSelf,
  onRoleChange,
  onRemove,
}: {
  admin: AdminRow;
  categories: CategoryOption[];
  isSelf: boolean;
  onRoleChange: (id: string, role: string, managedCategories: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const [role, setRole] = useState(admin.role);
  const [managedCategories, setManagedCategories] = useState<string[]>(admin.managedCategories);

  function toggleCategory(id: string) {
    const next = managedCategories.includes(id)
      ? managedCategories.filter((c) => c !== id)
      : [...managedCategories, id];
    setManagedCategories(next);
    onRoleChange(admin.id, role, next);
  }

  return (
    <tr className="border-b border-gray-50 last:border-0 align-top">
      <td className="px-4 py-3 font-medium">
        {admin.displayName ?? "-"} {isSelf && <span className="text-xs text-gray-400">(나)</span>}
      </td>
      <td className="px-4 py-3 text-gray-500">{admin.email}</td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => {
            const next = e.target.value;
            setRole(next);
            onRoleChange(admin.id, next, managedCategories);
          }}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs"
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {ADMIN_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {role === "category_manager" ? (
          <div className="flex max-w-xs flex-wrap gap-1.5">
            {categories.map((c) => (
              <label
                key={c.id}
                className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] ${
                  managedCategories.includes(c.id)
                    ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={managedCategories.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                  className="hidden"
                />
                {c.name}
              </label>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onRemove(admin.id)}
          className="text-xs font-semibold text-red-500 hover:text-red-700"
        >
          권한 해제
        </button>
      </td>
    </tr>
  );
}
