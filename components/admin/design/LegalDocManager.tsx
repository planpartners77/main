"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_NAV, type LegalDocSlug, type LegalSection } from "@/lib/legal-content";

interface DocContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocManager({ docsBySlug }: { docsBySlug: Record<string, DocContent> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<LegalDocSlug>(LEGAL_NAV[0].slug);
  const current = docsBySlug[slug];
  const [form, setForm] = useState<DocContent>(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectDoc(next: LegalDocSlug) {
    setSlug(next);
    setForm(docsBySlug[next]);
    setError(null);
  }

  function updateSection(index: number, patch: Partial<LegalSection>) {
    setForm({ ...form, sections: form.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  function addSection() {
    setForm({ ...form, sections: [...form.sections, { heading: "", body: [""] }] });
  }

  function removeSection(index: number) {
    setForm({ ...form, sections: form.sections.filter((_, i) => i !== index) });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveError } = await supabase.from("legal_docs").upsert(
      {
        slug,
        title: form.title.trim(),
        intro: form.intro.trim(),
        sections: form.sections.map((s) => ({ heading: s.heading.trim(), body: s.body.filter((line) => line.trim()) })),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
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
        여기서 저장하면 사이트의 초안 문구를 덮어씁니다. 법률 검토가 끝난 문서만 등록하세요.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {LEGAL_NAV.map((item) => (
          <button
            key={item.slug}
            onClick={() => selectDoc(item.slug)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              item.slug === slug ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white" : "border-gray-200 text-gray-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5">
        <label className="text-sm">
          제목
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          서문
          <textarea
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="space-y-3">
          {form.sections.map((section, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={section.heading}
                  onChange={(e) => updateSection(index, { heading: e.target.value })}
                  placeholder="조항 제목"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm font-semibold"
                />
                <button type="button" onClick={() => removeSection(index)} className="text-xs text-red-500">
                  삭제
                </button>
              </div>
              <textarea
                value={section.body.join("\n")}
                onChange={(e) => updateSection(index, { body: e.target.value.split("\n") })}
                rows={3}
                placeholder="줄바꿈으로 항목 구분"
                className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
          <button type="button" onClick={addSection} className="text-xs font-semibold text-[var(--brand-navy)]">
            + 조항 추가
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
