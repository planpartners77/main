import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

// 회원가입/여행 신청서 접수 완료 직후 클라이언트가 호출하는 알림 트리거.
// id로 실제 DB 행을 다시 조회해서 메시지를 만든다 — 클라이언트가 보낸 임의의 텍스트를
// 그대로 텔레그램에 전달하지 않기 위함(존재하지 않는 id면 그냥 무시됨).
export async function POST(request: Request) {
  let body: { type?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { type, id } = body;
  if (!type || !id) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();

  if (type === "signup") {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, phone, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    await sendTelegramMessage(
      [
        "🆕 <b>신규 회원가입</b>",
        `이름: ${data.display_name ?? "-"}`,
        `연락처: ${data.phone ?? "-"}`,
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  if (type === "travel_lead") {
    const { data } = await supabase
      .from("leads")
      .select("guest_contact, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const c = (data.guest_contact ?? {}) as Record<string, string | null | undefined>;
    await sendTelegramMessage(
      [
        "✈️ <b>여행 신청서 접수</b> (CRIS 골프캠프)",
        `아이 정보: ${c.childInfo ?? "-"}`,
        `보호자: ${c.guardianName ?? "-"}`,
        `연락처: ${c.phone ?? "-"}`,
        `참가 회차: ${c.session ?? "-"}`,
        c.heardFrom ? `유입 경로: ${c.heardFrom}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  if (type === "consult_lead") {
    const { data } = await supabase
      .from("leads")
      .select("guest_contact, created_at, categories(name)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const c = (data.guest_contact ?? {}) as Record<string, string | null | undefined>;
    const categoryName = (data.categories as unknown as { name: string } | null)?.name ?? "-";
    await sendTelegramMessage(
      [
        "📞 <b>상담 신청 접수</b>",
        `카테고리: ${categoryName}`,
        `이름: ${c.name ?? "-"}`,
        `연락처: ${c.phone ?? "-"}`,
        `희망 시간대: ${c.preferredTime ?? "-"}`,
        c.memo ? `문의: ${c.memo}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
