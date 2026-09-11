"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TelegramNotificationSettings, TelegramNotificationType } from "@/lib/design/site-settings";

interface TypeInfo {
  key: TelegramNotificationType;
  label: string;
  description: string;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[var(--brand-blue)]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

export function TelegramNotificationSettingsManager({
  settings,
  typeInfo,
}: {
  settings: TelegramNotificationSettings;
  typeInfo: TypeInfo[];
}) {
  const router = useRouter();
  const [masterEnabled, setMasterEnabled] = useState(settings.masterEnabled);
  const [types, setTypes] = useState(settings.types);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleType(key: TelegramNotificationType) {
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({ value: { masterEnabled, types } })
      .eq("key", "telegram_notifications");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-[var(--brand-navy)]">전체 알림 발송</span>
            <span className="mt-0.5 block text-xs text-gray-500">
              끄면 아래 개별 설정과 무관하게 모든 텔레그램 알림 발송이 즉시 중단됩니다.
            </span>
          </span>
          <ToggleSwitch
            checked={masterEnabled}
            onChange={() => {
              setMasterEnabled((v) => !v);
              setSaved(false);
            }}
          />
        </label>
      </div>

      <div className={`space-y-3 transition ${masterEnabled ? "" : "opacity-50"}`}>
        {typeInfo.map((info) => (
          <div key={info.key} className="rounded-2xl border border-gray-200 bg-white p-4">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-[var(--brand-navy)]">{info.label}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{info.description}</span>
              </span>
              <ToggleSwitch checked={types[info.key]} onChange={() => toggleType(info.key)} />
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-[var(--brand-mint)]">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
