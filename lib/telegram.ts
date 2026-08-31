// 서버 전용. TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID가 없으면(로컬 개발 등) 조용히 스킵한다 —
// 알림 발송 실패가 회원가입/신청서 접수 같은 핵심 플로우를 막아서는 안 된다.
// TELEGRAM_CHAT_ID는 콤마로 여러 개(개인 채팅 + 그룹 채팅 등) 지정 가능.
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!token || chatIds.length === 0) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID 미설정 — 알림 스킵");
    return;
  }

  await Promise.all(
    chatIds.map(async (chatId) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });

      if (!res.ok) {
        console.error("[telegram] sendMessage 실패", chatId, res.status, await res.text());
      }
    }),
  );
}
