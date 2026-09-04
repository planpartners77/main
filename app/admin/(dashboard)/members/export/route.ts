import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 회원 목록 화면과 동일한 필터 조건으로 최대 5000명까지 CSV로 내보낸다(엑셀에서 바로 열림).
// 별도 xlsx 라이브러리 없이 UTF-8 BOM + CSV로 충분 — 회원 목록 화면의 필터/검색 로직을
// 그대로 재사용하지 않고 여기서 다시 구성하는 이유는 반환 형태(테이블 렌더 vs 파일)가 달라서다.
const EXPORT_LIMIT = 5000;

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const tier = searchParams.get("tier");
  const status = searchParams.get("status");
  const role = searchParams.get("role");

  const supabase = await createClient();

  let emailMatchIds: string[] = [];
  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? "-"]));

  if (q) {
    const needle = q.toLowerCase();
    emailMatchIds = (usersData?.users ?? [])
      .filter((u) => u.email?.toLowerCase().includes(needle))
      .map((u) => u.id);
  }

  let query = supabase
    .from("profiles")
    .select("id, display_name, phone, referral_role, status, created_at, customer_tiers(name)")
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT);

  if (q) {
    const orParts = [`display_name.ilike.%${q}%`, `phone.ilike.%${q}%`];
    if (emailMatchIds.length > 0) orParts.push(`id.in.(${emailMatchIds.join(",")})`);
    query = query.or(orParts.join(","));
  }
  if (tier && tier !== "all") query = query.eq("tier_id", tier);
  if (status && status !== "all") query = query.eq("status", status);
  if (role && role !== "all") query = query.eq("referral_role", role);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as {
    id: string;
    display_name: string | null;
    phone: string | null;
    referral_role: string;
    status: string;
    created_at: string;
    customer_tiers: { name: string | null } | null;
  }[];

  const header = ["가입일", "이름", "이메일", "연락처", "구분", "등급", "상태"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.created_at).toLocaleDateString("ko-KR"),
        r.display_name ?? "",
        emailById.get(r.id) ?? "",
        r.phone ?? "",
        r.referral_role === "partner" ? "파트너" : "일반회원",
        r.customer_tiers?.name ?? "일반",
        r.status === "active" ? "정상" : r.status === "suspended" ? "정지" : "탈퇴",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }

  const csv = "﻿" + lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
