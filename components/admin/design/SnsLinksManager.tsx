"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SnsLink } from "@/lib/design/site-settings";

export function SnsLinksManager({ links }: { links: SnsLink[] }) {
  const router = useRouter();
  const [items, setItems] = useState(links);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(platform: string, patch: Partial<SnsLink>) {
    setItems((prev) => prev.map((item) => (item.platform === platform ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({ value: { links: items.map((item) => ({ ...item, url: item.url?.trim() || null })) } })
      .eq("key", "sns_links");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        URL을 입력하고 활성화하면 하단 Footer에 실제 링크로 노출됩니다. 비활성화된 채널은 &ldquo;오픈
        예정&rdquo;으로 표시됩니다.
      </p>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.platform}
            className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-[var(--brand-navy)]">{item.label}</span>
            <input
              value={item.url ?? ""}
              onChange={(e) => updateItem(item.platform, { url: e.target.value })}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="flex shrink-0 items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => updateItem(item.platform, { enabled: e.target.checked })}
              />
              활성화
            </label>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
