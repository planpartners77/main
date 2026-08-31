"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { HomePageSettings } from "@/lib/design/site-settings";

const SECTION_LABELS: Record<keyof HomePageSettings["sections"], string> = {
  incentive: "혜택 배너",
  trust: "신뢰 지표",
  reviews: "후기",
  popular: "인기 상품",
  why: "왜 가능한가",
  cta: "하단 CTA",
};

export function HomePageManager({ settings }: { settings: HomePageSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSection(key: keyof HomePageSettings["sections"]) {
    setForm((prev) => ({ ...prev, sections: { ...prev.sections, [key]: !prev.sections[key] } }));
  }

  async function handleSave() {
    if (!form.heroHeadline.trim()) {
      setError("헤드라인은 필수입니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({ value: form })
      .eq("key", "home_page");

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">히어로 카피</p>
        <div className="mt-3 grid gap-3">
          <label className="text-sm">
            상단 태그라인
            <input
              value={form.heroTagline}
              onChange={(e) => setForm({ ...form, heroTagline: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            헤드라인 (줄바꿈은 새 줄로 입력)
            <textarea
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            서브카피
            <input
              value={form.heroSubcopy}
              onChange={(e) => setForm({ ...form, heroSubcopy: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">홈 화면 섹션 노출</p>
        <p className="mt-1 text-xs text-gray-400">히어로·카테고리 카드는 구조상 항상 노출됩니다.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as (keyof HomePageSettings["sections"])[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.sections[key]} onChange={() => toggleSection(key)} />
              {SECTION_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
