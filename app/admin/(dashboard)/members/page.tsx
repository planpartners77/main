import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface MemberRow {
  id: string;
  display_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  customer_tiers: { name: string | null } | null;
}

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, phone, marketing_opt_in, created_at, customer_tiers(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const members = (data ?? []) as unknown as MemberRow[];

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">회원 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        상세보기를 열람하면 개인정보보호법상 접근기록(audit_logs)에 자동으로 남습니다.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          회원 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && members.length === 0 && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          가입한 회원이 없습니다.
        </p>
      )}

      {!error && members.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">등급</th>
                <th className="px-4 py-3">마케팅동의</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(member.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{member.display_name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{member.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{member.customer_tiers?.name ?? "일반"}</td>
                  <td className="px-4 py-3 text-gray-500">{member.marketing_opt_in ? "동의" : "미동의"}</td>
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
      )}
    </div>
  );
}
