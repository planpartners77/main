// 서버 전용. TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID가 없으면(로컬 개발 등) 조용히 스킵한다 —
// 알림 발송 실패가 회원가입/신청서 접수 같은 핵심 플로우를 막아서는 안 된다.
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID 미설정 — 알림 스킵");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    console.error("[telegram] sendMessage 실패", res.status, await res.text());
  }
}
