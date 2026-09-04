"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PAGE_TEMPLATES, defaultSectionConfig } from "@/lib/design/page-sections";
import type { PageRow } from "@/lib/design/pages-query";

const EMPTY_FORM = { title: "", slug: "", template: PAGE_TEMPLATES[0].key };

export function PageListManager({ pages }: { pages: PageRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title || !slug) {
      setError("제목과 슬러그는 필수입니다.");
      return;
    }
    if (slug === "home") {
      setError("'home' 슬러그는 홈페이지 전용이라 새로 만들 수 없습니다.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const template = PAGE_TEMPLATES.find((t) => t.key === form.template) ?? PAGE_TEMPLATES[0];

    const { data: page, error: insertError } = await supabase
      .from("pages")
      .insert({ title, slug, template: template.key, status: "draft" })
      .select("id")
      .single();

    if (insertError || !page) {
      setSaving(false);
      setError(
        insertError?.code === "23505"
          ? "이미 사용 중인 슬러그입니다."
          : `생성 실패: ${insertError?.message ?? "알 수 없는 오류"}`,
      );
      return;
    }

    if (template.sections.length > 0) {
      await supabase.from("page_sections").insert(
        template.sections.map((type, index) => ({
          page_id: page.id,
          type,
          sort_order: index,
          is_active: true,
          config: defaultSectionConfig(type),
        })),
      );
    }

    setSaving(false);
    router.push(`/admin/design/pages/${page.id}`);
  }

  async function toggleStatus(page: PageRow) {
    if (page.slug === "home" && page.status === "published") {
      alert("홈페이지는 비공개로 전환할 수 없습니다.");
      return;
    }
    const supabase = createClient();
    const nextStatus = page.status === "published" ? "draft" : "published";
    const { error: err } = await supabase.from("pages").update({ status: nextStatus }).eq("id", page.id);
    if (err) {
      alert(`변경 실패: ${err.message}`);
      return;
    }
    router.refresh();
  }

  async function handleDelete(page: PageRow) {
    if (page.slug === "home") {
      alert("홈페이지는 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`"${page.title}" 페이지를 삭제할까요? 구성된 섹션도 함께 삭제됩니다.`)) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("pages").delete().eq("id", page.id);
    if (err) {
      alert(`삭제 실패: ${err.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          페이지를 만들고 레이어(섹션) 단위로 구성을 조립할 수 있습니다. 홈페이지(slug: home)는 항상 공개 상태로 유지됩니다.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 페이지 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
          <label className="text-sm">
            제목
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="예: 여름 특가 이벤트"
            />
          </label>
          <label className="text-sm">
            슬러그 (URL, /pages/&#123;슬러그&#125;)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.trim() })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="summer-event"
            />
          </label>
          <label className="text-sm">
            템플릿
            <select
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {PAGE_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "생성 중..." : "생성 후 편집으로 이동"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">슬러그</th>
              <th className="px-4 py-3">템플릿</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">수정일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/design/pages/${page.id}`} className="hover:text-[var(--brand-navy)] hover:underline">
                    {page.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">/{page.slug === "home" ? "" : `pages/${page.slug}`}</td>
                <td className="px-4 py-3 text-gray-500">{page.template}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(page)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      page.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {page.status === "published" ? "공개" : "비공개"}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(page.updated_at).toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-xs font-semibold">
                    <Link href={`/admin/design/pages/${page.id}`} className="text-gray-500 hover:text-[var(--brand-navy)]">
                      편집
                    </Link>
                    <button onClick={() => handleDelete(page)} className="text-red-500 hover:text-red-700">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
