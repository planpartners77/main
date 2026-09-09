import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin/session";

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: "all", label: "전체 동작" },
  { value: "view", label: "열람" },
  { value: "update", label: "수정" },
  { value: "bulk_update", label: "일괄 수정" },
  { value: "status_change", label: "상태 변경" },
];

interface AuditLogRow {
  id: number;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  accessed_fields: unknown;
  created_at: string;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; table?: string; page?: string }>;
}) {
  const session = await getAdminSession();
  // audit_logs는 회원 개인정보 열람 이력이라 super_admin만 볼 수 있게 이중으로 막는다
  // (0032 마이그레이션의 select 정책 자체도 super_admin 한정 — admins/page.tsx와 동일한 방어 이중화).
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const { action, table, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, action, target_table, target_id, accessed_fields, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action && action !== "all") query = query.eq("action", action);
  if (table?.trim()) query = query.eq("target_table", table.trim());

  const { data, count } = await query.range(from, to);
  const logs = (data ?? []) as AuditLogRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const actorIds = Array.from(new Set(logs.map((l) => l.actor_id).filter((v): v is string => !!v)));
  let emailById = new Map<string, string>();
  let nameById = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const admin = createAdminClient();
    // profiles.email(0039 마이그레이션)을 바로 조회한다 — 이전에는 listUsers({perPage:1000})로
    // 가입자를 통째로 가져와 매칭했는데 1000명이 넘으면 최근 행위자 이메일이 누락될 수 있었다.
    const { data: profilesData } = await admin.from("profiles").select("id, display_name, email").in("id", actorIds);
    nameById = new Map((profilesData ?? []).map((p) => [p.id, p.display_name]));
    emailById = new Map((profilesData ?? []).map((p) => [p.id, p.email ?? "-"]));
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (table) params.set("table", table);
    params.set("page", String(p));
    return `/admin/audit-logs?${params.toString()}`;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">감사 로그</h1>
      <p className="mt-1 text-sm text-gray-500">
        누가/언제/무엇을 열람·수정했는지 기록입니다. 위변조 방지를 위해 수정·삭제는 불가능하며 조회만 가능합니다.
      </p>

      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <select name="action" defaultValue={action ?? "all"} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          name="table"
          defaultValue={table ?? ""}
          placeholder="대상 테이블 (예: profiles)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white">
          검색
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          조건에 맞는 로그가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">일시</th>
                <th className="px-4 py-2">행위자</th>
                <th className="px-4 py-2">동작</th>
                <th className="px-4 py-2">대상 테이블</th>
                <th className="px-4 py-2">대상 ID</th>
                <th className="px-4 py-2">열람 필드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.actor_id ? (nameById.get(log.actor_id) ?? emailById.get(log.actor_id) ?? log.actor_id) : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium">{log.action}</td>
                  <td className="px-4 py-2 text-xs">{log.target_table}</td>
                  <td className="max-w-[160px] truncate px-4 py-2 text-xs text-gray-400">{log.target_id ?? "-"}</td>
                  <td className="max-w-[240px] truncate px-4 py-2 text-xs text-gray-400">
                    {log.accessed_fields ? JSON.stringify(log.accessed_fields) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                p === currentPage ? "bg-[var(--brand-navy)] text-white" : "border border-gray-200 text-gray-600"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
