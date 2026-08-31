import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 추천인 링크(?ref=CODE) 클릭 기록과, 그 클릭이 실제 리드로 이어졌을 때의 전환 기록을
// 처리하는 라우트. 둘 다 anon에게 열려 있지 않은 referral_codes/clicks/conversions 테이블에
// 써야 해서 서비스 롤 키(RLS 우회)를 쓴다 — /api/notify와 동일하게 클라이언트가 보낸 값을
// 그대로 믿지 않고 DB를 다시 조회해 확인한 뒤에만 기록한다.
export async function POST(request: Request) {
  let body: { type?: string; code?: string; leadId?: string; codeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { type } = body;
  const supabase = createAdminClient();

  if (type === "click") {
    const code = body.code?.trim();
    if (!code) return NextResponse.json({ ok: false }, { status: 400 });

    const { data: referral } = await supabase
      .from("referral_codes")
      .select("id, is_active, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (!referral || !referral.is_active || (referral.expires_at && new Date(referral.expires_at) < new Date())) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await supabase.from("referral_clicks").insert({
      code_id: referral.id,
      user_agent: request.headers.get("user-agent"),
    });
    await supabase.rpc("increment_referral_click", { p_code_id: referral.id });

    return NextResponse.json({ ok: true, codeId: referral.id });
  }

  if (type === "convert") {
    const { leadId, codeId } = body;
    if (!leadId || !codeId) return NextResponse.json({ ok: false }, { status: 400 });

    const { data: lead } = await supabase
      .from("leads")
      .select("id, referral_code_id")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead || lead.referral_code_id !== codeId) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const { data: referral } = await supabase
      .from("referral_codes")
      .select("id, root_code_id, depth")
      .eq("id", codeId)
      .maybeSingle();
    if (!referral) return NextResponse.json({ ok: false }, { status: 404 });

    await supabase.from("referral_conversions").insert({
      code_id: referral.id,
      root_code_id: referral.root_code_id,
      lead_id: leadId,
      conversion_type: "lead",
      depth: referral.depth,
    });
    await supabase.rpc("increment_referral_conversion", { p_code_id: referral.id });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
