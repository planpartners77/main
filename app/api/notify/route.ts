import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { getFieldLabel, getConsentLabel, formatFieldValue } from "@/lib/admin/lead-field-labels";
import {
  DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS,
  normalizeTelegramNotificationSettings,
  type TelegramNotificationSettings,
  type TelegramNotificationType,
} from "@/lib/design/site-settings";

// Telegram HTML parse_mode는 <, >, &를 태그로 해석하므로 사용자가 입력한 자유 텍스트
// (주소/직업/문의내용 등)에 이 문자가 섞이면 메시지 전송이 깨질 수 있어 이스케이프한다.
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// guest_contact/consent은 신청서마다 필드가 달라 하드코딩된 일부 필드만 골라 보여주면
// 새 폼이 추가되거나 필드가 늘어날 때마다 이 파일을 고쳐야 한다. 관리자 상세보기 패널
// (lib/admin/lead-field-labels.ts)과 동일한 라벨 매핑을 재사용해 제출된 내용 전체를
// 빠짐없이 텔레그램 메시지에 담는다 — "상담 접수 시 전체 내용을 알림에 포함" 원칙.
function buildContactLines(categorySlug: string | undefined, contact: Record<string, unknown>): string[] {
  return Object.entries(contact)
    .filter(([key, value]) => {
      if (key === "channel") return false;
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
    .map(([key, value]) => `${escapeHtml(getFieldLabel(categorySlug, key))}: ${escapeHtml(formatFieldValue(value))}`);
}

function buildConsentLines(consent: Record<string, unknown> | null | undefined): string[] {
  if (!consent) return [];
  return Object.entries(consent).map(
    ([key, value]) => `${escapeHtml(getConsentLabel(key))}: ${escapeHtml(formatFieldValue(value))}`,
  );
}

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

  // 관리자 > 텔레그램 알림 관리에서 종류별로 끈 알림은 여기서 조기 종료한다 — 전체 스위치가
  // 꺼져 있으면 개별 leads/profiles 조회조차 하지 않고 바로 스킵(불필요한 DB 조회 절약).
  if (type in DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS.types) {
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "telegram_notifications")
      .maybeSingle();
    const notifSettings = normalizeTelegramNotificationSettings(
      (settingsRow?.value as Partial<TelegramNotificationSettings>) ?? null,
    );
    const notifType = type as TelegramNotificationType;
    if (!notifSettings.masterEnabled || !notifSettings.types[notifType]) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  }

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
      .select("guest_contact, consent, created_at, categories(slug)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const categorySlug = (data.categories as unknown as { slug: string } | null)?.slug;
    const contact = (data.guest_contact ?? {}) as Record<string, unknown>;
    await sendTelegramMessage(
      [
        "✈️ <b>여행 신청서 접수</b> (CRIS 골프캠프)",
        ...buildContactLines(categorySlug, contact),
        ...buildConsentLines(data.consent as Record<string, unknown> | null),
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  if (type === "usim_lead") {
    const { data } = await supabase
      .from("leads")
      .select("guest_contact, consent, created_at, categories(slug), products(title)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const categorySlug = (data.categories as unknown as { slug: string } | null)?.slug;
    const contact = (data.guest_contact ?? {}) as Record<string, unknown>;
    const planTitle = (data.products as unknown as { title: string } | null)?.title ?? "-";
    await sendTelegramMessage(
      [
        "📱 <b>유심 요금제 신청</b>",
        `요금제: ${escapeHtml(planTitle)}`,
        ...buildContactLines(categorySlug, contact),
        ...buildConsentLines(data.consent as Record<string, unknown> | null),
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  if (type === "mobile_lead") {
    const { data } = await supabase
      .from("leads")
      .select("guest_contact, consent, created_at, categories(slug), products(title)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const categorySlug = (data.categories as unknown as { slug: string } | null)?.slug;
    const contact = (data.guest_contact ?? {}) as Record<string, unknown>;
    const deviceTitle = (data.products as unknown as { title: string } | null)?.title ?? "-";
    await sendTelegramMessage(
      [
        "📱 <b>휴대폰 개통/기기변경 신청</b>",
        `기종: ${escapeHtml(deviceTitle)}`,
        ...buildContactLines(categorySlug, contact),
        ...buildConsentLines(data.consent as Record<string, unknown> | null),
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  if (type === "consult_lead") {
    const { data } = await supabase
      .from("leads")
      .select("guest_contact, consent, created_at, categories(slug, name), products(title)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: false }, { status: 404 });

    const categorySlug = (data.categories as unknown as { slug: string; name: string } | null)?.slug;
    const categoryName = (data.categories as unknown as { slug: string; name: string } | null)?.name ?? "-";
    const productTitle = (data.products as unknown as { title: string } | null)?.title ?? null;
    const contact = (data.guest_contact ?? {}) as Record<string, unknown>;
    await sendTelegramMessage(
      [
        "📞 <b>상담 신청 접수</b>",
        `카테고리: ${escapeHtml(categoryName)}`,
        productTitle ? `상품/페이지: ${escapeHtml(productTitle)}` : null,
        ...buildContactLines(categorySlug, contact),
        ...buildConsentLines(data.consent as Record<string, unknown> | null),
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
