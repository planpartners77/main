import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMemberManager } from "@/lib/admin/member-manager";

// 회원 "삭제"는 물리 삭제가 아니라 탈퇴 처리 + 개인정보 익명화다. leads/point_transactions/
// coupon_redemptions/referral_codes/member_notes가 profiles를 ON DELETE CASCADE 없이
// 참조하고 있어(정산/포인트/추천인 트리 이력 보존 목적), 물리 삭제 시 FK 위반으로 실패하거나
// 강행할 경우 정산·추천인 트리 데이터가 통째로 사라진다. 대신 로그인을 영구 차단하고
// profiles의 개인식별정보만 익명화해 "관리자 화면에서 사라진 것처럼" 처리한다.
const ANONYMIZED_FIELDS = [
  "display_name",
  "phone",
  "gender",
  "birthdate",
  "ci_hash",
  "kakao_user_id",
  "shipping_name",
  "shipping_address",
  "shipping_phone",
  "marketing_opt_in",
  "status",
];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireMemberManager();
  if (!actor) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  // 1) 로그인 영구 차단 (약 10년 밴 — Admin API는 무기한 밴을 지원하지 않는다).
  const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: "87600h" });
  if (banError) return NextResponse.json({ error: banError.message }, { status: 500 });

  // 2) profiles 개인정보 익명화.
  const { error: anonError } = await admin
    .from("profiles")
    .update({
      display_name: "탈퇴한 회원",
      phone: null,
      gender: null,
      birthdate: null,
      ci_hash: null,
      kakao_user_id: null,
      shipping_name: null,
      shipping_address: null,
      shipping_phone: null,
      marketing_opt_in: false,
      status: "withdrawn",
    })
    .eq("id", id);
  if (anonError) return NextResponse.json({ error: anonError.message }, { status: 500 });

  // §9-1 개인정보 처리 로그: 삭제(익명화) 자체도 남긴다.
  await admin.from("audit_logs").insert({
    actor_id: actor.id,
    action: "delete",
    target_table: "profiles",
    target_id: id,
    accessed_fields: ANONYMIZED_FIELDS,
  });

  return NextResponse.json({ ok: true });
}
