"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SECTION_TYPES,
  SECTION_LABELS,
  SECTION_HAS_CONFIG,
  defaultSectionConfig,
  type SectionType,
  type ProductDisplayConfig,
  type HeroSectionConfig,
  type RichTextConfig,
  type NoticeListConfig,
} from "@/lib/design/page-sections";
import type { PageRow, PageSectionRow } from "@/lib/design/pages-query";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

interface ProductInfo {
  title: string;
  image_url: string | null;
}

export function PageSectionBuilder({
  page,
  sections,
  categories,
  productTitleById,
}: {
  page: PageRow;
  sections: PageSectionRow[];
  categories: CategoryOption[];
  productTitleById: Record<string, ProductInfo>;
}) {
  const router = useRouter();
  const isHome = page.slug === "home";

  const [meta, setMeta] = useState({ title: page.title, slug: page.slug, status: page.status });
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  async function saveMeta(event: FormEvent) {
    event.preventDefault();
    if (!meta.title.trim() || (!isHome && !meta.slug.trim())) {
      setMetaError("제목과 슬러그는 필수입니다.");
      return;
    }
    setMetaSaving(true);
    setMetaError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("pages")
      .update({
        title: meta.title.trim(),
        slug: isHome ? "home" : meta.slug.trim(),
        status: isHome ? "published" : meta.status,
      })
      .eq("id", page.id);
    setMetaSaving(false);
    if (error) {
      setMetaError(
        error.code === "23505" ? "이미 사용 중인 슬러그입니다." : `저장 실패: ${error.message}`,
      );
      return;
    }
    router.refresh();
  }

  const [addType, setAddType] = useState<SectionType>(SECTION_TYPES[0]);

  async function addSection() {
    const supabase = createClient();
    const nextOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) + 1 : 0;
    const { error } = await supabase.from("page_sections").insert({
      page_id: page.id,
      type: addType,
      sort_order: nextOrder,
      is_active: true,
      config: defaultSectionConfig(addType),
    });
    if (error) {
      alert(`추가 실패: ${error.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={saveMeta} className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">페이지 정보</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            제목
            <input
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            슬러그
            <input
              value={isHome ? "home" : meta.slug}
              disabled={isHome}
              onChange={(e) => setMeta({ ...meta, slug: e.target.value.trim() })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </label>
          <label className="text-sm">
            상태
            <select
              value={isHome ? "published" : meta.status}
              disabled={isHome}
              onChange={(e) => setMeta({ ...meta, status: e.target.value as "draft" | "published" })}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="draft">비공개</option>
              <option value="published">공개</option>
            </select>
          </label>
        </div>
        {isHome && <p className="mt-2 text-xs text-gray-400">홈페이지는 슬러그와 공개 상태를 변경할 수 없습니다.</p>}
        {metaError && <p className="mt-2 text-xs text-red-600">{metaError}</p>}
        <button
          type="submit"
          disabled={metaSaving}
          className="mt-3 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {metaSaving ? "저장 중..." : "정보 저장"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          섹션을 추가하고 순서를 조정하세요. 위에서부터 화면에 그려지는 순서입니다.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as SectionType)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SECTION_LABELS[type]}
              </option>
            ))}
          </select>
          <button
            onClick={addSection}
            className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white"
          >
            섹션 추가
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            아직 섹션이 없습니다. 위에서 추가해 주세요.
          </p>
        ) : (
          sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              siblings={sections}
              categories={categories}
              productTitleById={productTitleById}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  index,
  siblings,
  categories,
  productTitleById,
}: {
  section: PageSectionRow;
  index: number;
  siblings: PageSectionRow[];
  categories: CategoryOption[];
  productTitleById: Record<string, ProductInfo>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasConfig = SECTION_HAS_CONFIG[section.type];

  async function move(direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const target = siblings[targetIndex];
    const supabase = createClient();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("page_sections").update({ sort_order: target.sort_order }).eq("id", section.id),
      supabase.from("page_sections").update({ sort_order: section.sort_order }).eq("id", target.id),
    ]);
    if (e1 || e2) setError(`순서 변경 실패: ${(e1 ?? e2)?.message}`);
    else router.refresh();
  }

  async function toggleActive() {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("page_sections")
      .update({ is_active: !section.is_active })
      .eq("id", section.id);
    if (err) setError(`변경 실패: ${err.message}`);
    else router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`"${SECTION_LABELS[section.type]}" 섹션을 삭제할까요?`)) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("page_sections").delete().eq("id", section.id);
    if (err) setError(`삭제 실패: ${err.message}`);
    else router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span className={`text-sm font-semibold ${section.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
          {SECTION_LABELS[section.type]}
        </span>
        {!section.is_active && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">숨김</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold">
          <button onClick={() => move(-1)} disabled={index === 0} className="text-gray-400 hover:text-[var(--brand-navy)] disabled:opacity-30">
            ↑
          </button>
          <button
            onClick={() => move(1)}
            disabled={index === siblings.length - 1}
            className="text-gray-400 hover:text-[var(--brand-navy)] disabled:opacity-30"
          >
            ↓
          </button>
          {hasConfig && (
            <button onClick={() => setExpanded((v) => !v)} className="text-gray-500 hover:text-[var(--brand-navy)]">
              {expanded ? "설정 닫기" : "설정"}
            </button>
          )}
          <button
            onClick={toggleActive}
            className={section.is_active ? "text-red-500 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"}
          >
            {section.is_active ? "숨기기" : "노출하기"}
          </button>
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700">
            삭제
          </button>
        </div>
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
      {expanded && hasConfig && (
        <div className="border-t border-gray-100 px-4 py-4">
          <SectionConfigForm
            section={section}
            categories={categories}
            productTitleById={productTitleById}
            onSaved={() => router.refresh()}
          />
        </div>
      )}
    </div>
  );
}

function SectionConfigForm({
  section,
  categories,
  productTitleById,
  onSaved,
}: {
  section: PageSectionRow;
  categories: CategoryOption[];
  productTitleById: Record<string, ProductInfo>;
  onSaved: () => void;
}) {
  switch (section.type) {
    case "hero":
      return <HeroConfigForm section={section} onSaved={onSaved} />;
    case "product_display":
      return (
        <ProductDisplayConfigForm
          section={section}
          categories={categories}
          productTitleById={productTitleById}
          onSaved={onSaved}
        />
      );
    case "rich_text":
      return <RichTextConfigForm section={section} onSaved={onSaved} />;
    case "notice_list":
      return <NoticeListConfigForm section={section} onSaved={onSaved} />;
    default:
      return <p className="text-xs text-gray-400">이 섹션은 별도 설정이 없습니다.</p>;
  }
}

function HeroConfigForm({ section, onSaved }: { section: PageSectionRow; onSaved: () => void }) {
  const initial = section.config as Partial<HeroSectionConfig>;
  const [form, setForm] = useState({
    tagline: initial.tagline ?? "",
    headline: initial.headline ?? "",
    subcopy: initial.subcopy ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("page_sections").update({ config: form }).eq("id", section.id);
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    onSaved();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        태그라인
        <input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        헤드라인 (줄바꿈 가능)
        <textarea
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        서브카피
        <input
          value={form.subcopy}
          onChange={(e) => setForm({ ...form, subcopy: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function RichTextConfigForm({ section, onSaved }: { section: PageSectionRow; onSaved: () => void }) {
  const initial = section.config as Partial<RichTextConfig>;
  const [form, setForm] = useState({ title: initial.title ?? "", text: initial.text ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("page_sections").update({ config: form }).eq("id", section.id);
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        제목 (선택)
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        본문
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={5}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}

function NoticeListConfigForm({ section, onSaved }: { section: PageSectionRow; onSaved: () => void }) {
  const initial = section.config as Partial<NoticeListConfig>;
  const [form, setForm] = useState({ title: initial.title ?? "공지사항", limit: initial.limit ?? 5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("page_sections")
      .update({ config: { title: form.title, limit: Number(form.limit) || 5 } })
      .eq("id", section.id);
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    onSaved();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        제목
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm">
        노출 개수
        <input
          type="number"
          min={1}
          max={20}
          value={form.limit}
          onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function ProductDisplayConfigForm({
  section,
  categories,
  productTitleById,
  onSaved,
}: {
  section: PageSectionRow;
  categories: CategoryOption[];
  productTitleById: Record<string, ProductInfo>;
  onSaved: () => void;
}) {
  const initial = section.config as Partial<ProductDisplayConfig>;
  const [title, setTitle] = useState(initial.title ?? "추천 상품");
  const [mode, setMode] = useState<"latest" | "manual">(initial.mode ?? "latest");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds ?? []);
  const [limit, setLimit] = useState(initial.limit ?? 6);
  const [productIds, setProductIds] = useState<string[]>(initial.productIds ?? []);
  const [localTitles, setLocalTitles] = useState<Record<string, ProductInfo>>(productTitleById);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; image_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function runSearch() {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, title, image_url")
      .ilike("title", `%${search.trim()}%`)
      .eq("is_active", true)
      .limit(10);
    setSearching(false);
    setSearchResults(data ?? []);
  }

  function addProduct(product: { id: string; title: string; image_url: string | null }) {
    if (!productIds.includes(product.id)) {
      setProductIds((prev) => [...prev, product.id]);
      setLocalTitles((prev) => ({ ...prev, [product.id]: { title: product.title, image_url: product.image_url } }));
    }
    setSearch("");
    setSearchResults([]);
  }

  function removeProduct(id: string) {
    setProductIds((prev) => prev.filter((p) => p !== id));
  }

  function moveProduct(index: number, direction: -1 | 1) {
    setProductIds((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const config: ProductDisplayConfig = {
      title: title.trim() || "추천 상품",
      mode,
      categoryIds,
      productIds,
      limit: Number(limit) || 6,
    };
    const supabase = createClient();
    const { error: err } = await supabase.from("page_sections").update({ config }).eq("id", section.id);
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        섹션 제목
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "latest"} onChange={() => setMode("latest")} /> 자동(카테고리별 최신
          상품)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "manual"} onChange={() => setMode("manual")} /> 수동(상품 직접 선택)
        </label>
      </div>

      {mode === "latest" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="text-sm sm:col-span-2">
            노출 카테고리 (선택 안 하면 전체 최상위 카테고리)
            <div className="mt-1 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] ${
                    categoryIds.includes(c.id)
                      ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="hidden"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <label className="text-sm">
            카테고리당 노출 개수
            <input
              type="number"
              min={1}
              max={20}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="상품명으로 검색"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searching}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600"
            >
              검색
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {searchResults.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{p.title}</span>
                  <button
                    type="button"
                    onClick={() => addProduct(p)}
                    className="text-xs font-semibold text-[var(--brand-blue)]"
                  >
                    추가
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs font-semibold text-gray-500">선택된 상품 ({productIds.length})</p>
          {productIds.length === 0 ? (
            <p className="mt-1 text-xs text-gray-400">검색해서 진열할 상품을 추가해 주세요.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {productIds.map((id, index) => (
                <li key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{localTitles[id]?.title ?? id}</span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => moveProduct(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-[var(--brand-navy)] disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === productIds.length - 1}
                      className="text-gray-400 hover:text-[var(--brand-navy)] disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => removeProduct(id)} className="text-red-500 hover:text-red-700">
                      제거
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-[var(--brand-blue)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
