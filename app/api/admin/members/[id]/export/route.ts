import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMemberManager } from "@/lib/admin/member-manager";

// 삭제(탈퇴처리+익명화) 전 관리자가 원본 데이터를 보관해둘 수 있도록 profiles 전체 필드를
// JSON으로 내려준다 — 익명화는 되돌릴 수 없으므로 파기 전 백업 다운로드 용도.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireMemberManager();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin.from("profiles").select("*").eq("id", id).single();
  if (error || !profile) return NextResponse.json({ error: error?.message ?? "not_found" }, { status: 404 });

  const { data: authUser } = await admin.auth.admin.getUserById(id);

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "export",
    target_table: "profiles",
    target_id: id,
    accessed_fields: Object.keys(profile),
  });

  const payload = {
    exported_at: new Date().toISOString(),
    email: authUser?.user?.email ?? null,
    profile,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="member_${id}_backup.json"`,
    },
  });
}
