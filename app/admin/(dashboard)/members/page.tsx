import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MembersTable, type MemberRow } from "@/components/admin/members/MembersTable";

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "active", label: "정상" },
  { value: "suspended", label: "정지" },
  { value: "withdrawn", label: "탈퇴" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "전체 구분" },
  { value: "member", label: "일반회원" },
  { value: "partner", label: "파트너" },
];

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; status?: string; role?: string; page?: string }>;
}) {
  const { q, tier, status, role, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // 예전에는 이메일이 profiles에 없어(auth.users 전용) 검색/표시 때마다 listUsers({perPage:1000})로
  // 전체 회원을 가져와 매칭했는데, 가입자가 1000명을 넘으면 뒷 페이지 회원은 검색도, 이메일 표시도
  // 안 되는 버그였다. profiles.email 컬럼(0039 마이그레이션, auth.users와 트리거로 동기화)이
  // 생긴 뒤로는 display_name/phone과 동일하게 이 쿼리 안에서 바로 검색·조회한다.
  let query = supabase
    .from("profiles")
    .select(
      "id, email, display_name, phone, marketing_opt_in, referral_role, status, created_at, auth_provider, kakao_user_id, gender, birthdate, shipping_name, shipping_address, shipping_phone, customer_tiers(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const needle = q.trim();
    query = query.or(`display_name.ilike.%${needle}%,phone.ilike.%${needle}%,email.ilike.%${needle}%`);
  }
  if (tier && tier !== "all") query = query.eq("tier_id", tier);
  if (status && status !== "all") query = query.eq("status", status);
  if (role && role !== "all") query = query.eq("referral_role", role);

  const { data, error, count } = await query.range(from, to);
  const members = (data ?? []) as unknown as (MemberRow & { email: string | null })[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const emailById = new Map(members.map((m) => [m.id, m.email ?? "-"]));

  const { data: tiersData } = await supabase.from("customer_tiers").select("id, name").order("point_earn_rate");

  const exportQuery = new URLSearchParams();
  if (q) exportQuery.set("q", q);
  if (tier) exportQuery.set("tier", tier);
  if (status) exportQuery.set("status", status);
  if (role) exportQuery.set("role", role);

  function pageHref(p: number) {
    const params = new URLSearchParams(exportQuery);
    params.set("page", String(p));
    return `/admin/members?${params.toString()}`;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--brand-navy)]">회원 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {count ?? 0}명 · 상세보기 열람은 개인정보보호법상 접근기록(audit_logs)에 자동으로 남습니다.
          </p>
        </div>
        <a
          href={`/admin/members/export?${exportQuery.toString()}`}
          className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]"
        >
          엑셀(CSV) 내보내기
        </a>
      </div>

      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름 / 이메일 / 연락처 검색"
          className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select name="tier" defaultValue={tier ?? "all"} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="all">전체 등급</option>
          {(tiersData ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? "all"} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="role" defaultValue={role ?? "all"} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white"
        >
          검색
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          회원 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && members.length === 0 && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          조건에 맞는 회원이 없습니다.
        </p>
      )}

      {!error && members.length > 0 && (
        <>
          <MembersTable members={members} emailById={emailById} tierOptions={tiersData ?? []} />

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Link
              href={pageHref(Math.max(1, currentPage - 1))}
              className={`rounded-lg border border-gray-300 px-3 py-1.5 ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:border-[var(--brand-navy)]"}`}
            >
              이전
            </Link>
            <span className="text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <Link
              href={pageHref(Math.min(totalPages, currentPage + 1))}
              className={`rounded-lg border border-gray-300 px-3 py-1.5 ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:border-[var(--brand-navy)]"}`}
            >
              다음
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
