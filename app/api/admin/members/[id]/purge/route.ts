import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/admin/member-manager";

// "즉시 삭제"(개인정보 삭제 요구권 대응) — 탈퇴처리+익명화([id]/delete)와 달리 실제로 행을
// 지운다. 되돌릴 수 없고 super_admin만 호출 가능하다(member_manager는 소프트삭제까지만).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSuperAdmin();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  // profiles.id가 auth.users(id)를 참조하므로(on delete 미지정), 반드시 profiles·종속 데이터를
  // 먼저 지운 뒤에 auth.users 계정을 지워야 FK 위반이 나지 않는다.
  const { error: purgeError } = await admin.rpc("fn_purge_member", { p_profile_id: id });
  if (purgeError) return NextResponse.json({ error: purgeError.message }, { status: 500 });

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(id);

  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "purge",
    target_table: "profiles",
    target_id: id,
    accessed_fields: [
      "profiles",
      "leads",
      "consultations",
      "coupon_redemptions",
      "point_transactions",
      "member_notes",
      "referral_codes.profile_id",
      "auth.users",
    ],
  });

  if (authDeleteError) {
    // 데이터는 이미 지워졌지만 로그인 계정만 남은 상태 — 드물지만 관리자가 인지해야 한다.
    return NextResponse.json(
      { error: `데이터는 삭제됐지만 로그인 계정 삭제에 실패했습니다: ${authDeleteError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
