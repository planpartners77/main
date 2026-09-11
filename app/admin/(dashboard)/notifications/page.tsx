import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { getTelegramNotificationSettings, TELEGRAM_NOTIFICATION_TYPE_INFO } from "@/lib/design/site-settings";
import { TelegramNotificationSettingsManager } from "@/components/admin/notifications/TelegramNotificationSettingsManager";

export default async function AdminNotificationsPage() {
  const session = await getAdminSession();
  // 전체 스위치로 신청서 접수 알림 자체를 끌 수 있는 운영 민감 설정이라 super_admin만 접근
  // 가능하게 한다(permissions.ts의 notifications 메뉴 키 — login_methods/security와 동일 취급).
  if (!session || session.role !== "super_admin") {
    redirect("/admin");
  }

  const settings = await getTelegramNotificationSettings();

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[var(--brand-navy)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)]">텔레그램 알림 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        회원가입/신청서 접수 시 텔레그램으로 전송되는 알림을 종류별로 켜고 끌 수 있습니다.
        저장 즉시 다음 접수 건부터 반영됩니다.
      </p>

      <div className="mt-6">
        <TelegramNotificationSettingsManager settings={settings} typeInfo={TELEGRAM_NOTIFICATION_TYPE_INFO} />
      </div>
    </div>
  );
}
