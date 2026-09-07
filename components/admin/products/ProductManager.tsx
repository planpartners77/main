"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UsimPlanSpecFields, parseUsimExtra } from "./UsimPlanSpecFields";
import { EMPTY_USIM_PLAN_EXTRA, type UsimPlanExtra } from "@/lib/usim/plan-spec";

export interface ProductRow {
  id: string;
  category_id: string | null;
  partner_id: string | null;
  title: string;
  base_price: number | null;
  incentive_min: number | null;
  incentive_max: number | null;
  incentive_exact: number | null;
  image_url: string | null;
  apply_url: string | null;
  extra: Record<string, unknown>;
  is_active: boolean;
  categories: { name: string } | null;
  partners: { name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface PartnerOption {
  id: string;
  name: string;
  category_id: string | null;
}

const EMPTY_FORM = {
  category_id: "",
  partner_id: "",
  title: "",
  base_price: "",
  incentive_min: "",
  incentive_max: "",
  incentive_exact: "",
  image_url: "",
  apply_url: "",
  is_active: true,
  extra: "{}",
};

function formatWon(value: number | null) {
  return value != null ? `${value.toLocaleString("ko-KR")}원` : "-";
}

type SortKey = "title" | "category" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "category", label: "카테고리순" },
  { value: "title", label: "상품명순" },
  { value: "price_asc", label: "기본가 낮은순" },
  { value: "price_desc", label: "기본가 높은순" },
];

function sortProducts(products: ProductRow[], sortKey: SortKey): ProductRow[] {
  const sorted = [...products];
  switch (sortKey) {
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    case "category":
      return sorted.sort((a, b) =>
        (a.categories?.name ?? "").localeCompare(b.categories?.name ?? "", "ko") ||
        a.title.localeCompare(b.title, "ko"),
      );
    case "price_asc":
      return sorted.sort((a, b) => (a.base_price ?? Infinity) - (b.base_price ?? Infinity));
    case "price_desc":
      return sorted.sort((a, b) => (b.base_price ?? -Infinity) - (a.base_price ?? -Infinity));
  }
}

export function ProductManager({
  products,
  categories,
  partners,
}: {
  products: ProductRow[];
  categories: CategoryOption[];
  partners: PartnerOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [usimExtra, setUsimExtra] = useState<UsimPlanExtra>(EMPTY_USIM_PLAN_EXTRA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("category");

  const visiblePartners = partners.filter((p) => !form.category_id || p.category_id === form.category_id);
  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const isUsimCategory = selectedCategory?.slug === "usim";

  const displayedProducts = useMemo(() => {
    const filtered = categoryFilter
      ? products.filter((p) => p.category_id === categoryFilter)
      : products;
    return sortProducts(filtered, sortKey);
  }, [products, categoryFilter, sortKey]);

  function startCreate() {
    setForm(EMPTY_FORM);
    setUsimExtra(EMPTY_USIM_PLAN_EXTRA);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(product: ProductRow) {
    const category = categories.find((c) => c.id === product.category_id);
    setForm({
      category_id: product.category_id ?? "",
      partner_id: product.partner_id ?? "",
      title: product.title,
      base_price: product.base_price != null ? String(product.base_price) : "",
      incentive_min: product.incentive_min != null ? String(product.incentive_min) : "",
      incentive_max: product.incentive_max != null ? String(product.incentive_max) : "",
      incentive_exact: product.incentive_exact != null ? String(product.incentive_exact) : "",
      image_url: product.image_url ?? "",
      apply_url: product.apply_url ?? "",
      is_active: product.is_active,
      extra: JSON.stringify(product.extra ?? {}, null, 2),
    });
    if (category?.slug === "usim") {
      setUsimExtra(parseUsimExtra(JSON.stringify(product.extra ?? {})));
    } else {
      setUsimExtra(EMPTY_USIM_PLAN_EXTRA);
    }
    setEditingId(product.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.category_id) {
      setError("카테고리와 상품명은 필수입니다.");
      return;
    }

    let extraParsed: Record<string, unknown>;
    if (isUsimCategory) {
      extraParsed = usimExtra as unknown as Record<string, unknown>;
    } else {
      try {
        extraParsed = form.extra.trim() ? JSON.parse(form.extra) : {};
      } catch {
        setError("추가 정보(extra)는 올바른 JSON 형식이어야 합니다.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      category_id: form.category_id,
      partner_id: form.partner_id || null,
      title: form.title.trim(),
      base_price: form.base_price ? Number(form.base_price) : null,
      incentive_min: form.incentive_min ? Number(form.incentive_min) : null,
      incentive_max: form.incentive_max ? Number(form.incentive_max) : null,
      incentive_exact: form.incentive_exact ? Number(form.incentive_exact) : null,
      image_url: form.image_url.trim() || null,
      apply_url: form.apply_url.trim() || null,
      is_active: form.is_active,
      extra: extraParsed,
    };

    const { error: saveError } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(product: ProductRow) {
    if (!confirm(`"${product.title}" 상품을 삭제할까요?`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message}`);
      return;
    }
    router.refresh();
  }

  async function toggleActive(product: ProductRow) {
    const supabase = createClient();
    await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          incentive_min/max는 비회원에게 범위로, incentive_exact는 로그인 회원에게만 노출됩니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 상품 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            카테고리
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value, partner_id: "" })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            파트너 (선택)
            <select
              value={form.partner_id}
              onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">없음</option>
              {visiblePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            상품명
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            기본가 (선택)
            <input
              type="number"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            이미지 URL (선택)
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            신청하기 URL (선택)
            <input
              value={form.apply_url}
              onChange={(e) => setForm({ ...form, apply_url: e.target.value })}
              placeholder="비워두면 사이트 내 신청폼으로 연결돼요"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            인센티브 하한 (선택, 비회원 노출)
            <input
              type="number"
              value={form.incentive_min}
              onChange={(e) => setForm({ ...form, incentive_min: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            인센티브 상한 (선택, 비회원 노출)
            <input
              type="number"
              value={form.incentive_max}
              onChange={(e) => setForm({ ...form, incentive_max: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            인센티브 확정값 (선택, 로그인 회원만 노출)
            <input
              type="number"
              value={form.incentive_exact}
              onChange={(e) => setForm({ ...form, incentive_exact: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            활성화
          </label>
          {isUsimCategory ? (
            <UsimPlanSpecFields value={usimExtra} onChange={setUsimExtra} />
          ) : (
            <label className="text-sm sm:col-span-2">
              추가 정보(JSON, 선택 — 카테고리별 상이한 스펙)
              <textarea
                value={form.extra}
                onChange={(e) => setForm({ ...form, extra: e.target.value })}
                rows={4}
                spellCheck={false}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
              />
            </label>
          )}

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : editingId ? "수정 저장" : "등록"}
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 상품이 없습니다.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-500">
              카테고리{" "}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ml-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
              >
                <option value="">전체</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-500">
              정렬{" "}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="ml-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-gray-400">{displayedProducts.length}개 상품</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">이미지</th>
                <th className="px-4 py-3">상품명</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">파트너</th>
                <th className="px-4 py-3">기본가</th>
                <th className="px-4 py-3">인센티브</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션
                      <img src={product.image_url} alt={product.title} className="h-10 w-14 rounded-lg object-cover" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{product.title}</td>
                  <td className="px-4 py-3 text-gray-500">{product.categories?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{product.partners?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatWon(product.base_price)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {product.incentive_min != null || product.incentive_max != null
                      ? `${formatWon(product.incentive_min)} ~ ${formatWon(product.incentive_max)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        product.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      <button onClick={() => startEdit(product)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                        수정
                      </button>
                      <button onClick={() => handleDelete(product)} className="text-red-500 hover:text-red-700">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
