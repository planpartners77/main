"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface StoreRow {
  id: string;
  region: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  supported_categories: string[] | null;
}

export interface CategoryOption {
  slug: string;
  name: string;
}

const EMPTY_FORM = {
  region: "",
  address: "",
  lat: "",
  lng: "",
  supportedCategories: [] as string[],
};

export function StoreManager({
  stores,
  categories,
}: {
  stores: StoreRow[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function startEdit(store: StoreRow) {
    setEditingId(store.id);
    setForm({
      region: store.region ?? "",
      address: store.address ?? "",
      lat: store.lat?.toString() ?? "",
      lng: store.lng?.toString() ?? "",
      supportedCategories: store.supported_categories ?? [],
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function toggleCategory(slug: string) {
    setForm((f) => ({
      ...f,
      supportedCategories: f.supportedCategories.includes(slug)
        ? f.supportedCategories.filter((s) => s !== slug)
        : [...f.supportedCategories, slug],
    }));
  }

  async function handleSubmit() {
    setFormError(null);
    if (!form.region.trim() || !form.address.trim()) {
      setFormError("지역과 주소는 필수입니다.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const payload = {
      region: form.region.trim(),
      address: form.address.trim(),
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      supported_categories: form.supportedCategories,
    };

    const { error } = editingId
      ? await supabase.from("stores").update(payload).eq("id", editingId)
      : await supabase.from("stores").insert(payload);

    setSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("stores").delete().eq("id", id);
    if (editingId === id) resetForm();
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">
          {editingId ? "매장 정보 수정" : "매장 추가"}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="지역 (예: 서울 강남구)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="상세 주소"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.lat}
            onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
            placeholder="위도(선택)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={form.lng}
            onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
            placeholder="경도(선택)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">취급 카테고리</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <label
                key={c.slug}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs"
              >
                <input
                  type="checkbox"
                  checked={form.supportedCategories.includes(c.slug)}
                  onChange={() => toggleCategory(c.slug)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {formError && <p className="mt-3 text-xs text-red-600">{formError}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-[var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "저장 중..." : editingId ? "수정 저장" : "추가"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-600"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {stores.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 매장이 없습니다.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">지역</th>
                <th className="px-4 py-3">주소</th>
                <th className="px-4 py-3">취급 카테고리</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b border-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{store.region ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{store.address ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {(store.supported_categories ?? []).join(", ") || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(store)}
                      className="mr-3 text-xs font-semibold text-gray-500 hover:text-[var(--brand-navy)]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(store.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
