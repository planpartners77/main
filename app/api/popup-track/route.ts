import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 팝업 노출/클릭 카운터 기록. anon 클라이언트는 popups 테이블에 쓸 권한이 없어(RLS 관리자 전용)
// /api/referral과 동일하게 서비스 롤 키로만 쓰고, 클라이언트가 보낸 popupId가 실제 존재하는
// 행인지 재확인한 뒤에만 카운터를 증가시킨다.
export async function POST(request: Request) {
  let body: { type?: string; popupId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { type, popupId } = body;
  if (!popupId || (type !== "impression" && type !== "click")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: popup } = await supabase.from("popups").select("id").eq("id", popupId).maybeSingle();
  if (!popup) return NextResponse.json({ ok: false }, { status: 404 });

  await supabase.rpc(type === "impression" ? "increment_popup_impression" : "increment_popup_click", {
    p_popup_id: popupId,
  });

  return NextResponse.json({ ok: true });
}
