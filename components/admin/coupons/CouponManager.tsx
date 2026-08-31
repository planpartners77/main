"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CouponRow {
  id: string;
  code: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  valid_from: string;
  valid_until: string | null;
  category_id: string | null;
  min_tier_id: string | null;
  max_redemptions: number | null;
  is_active: boolean;
  redemption_count: number;
}

interface Option {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  code: "",
  discount_type: "fixed" as "fixed" | "percent",
  discount_value: "",
  valid_from: "",
  valid_until: "",
  category_id: "",
  min_tier_id: "",
  max_redemptions: "",
  is_active: true,
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountLabel(row: CouponRow) {
  return row.discount_type === "percent" ? `${row.discount_value}%` : `${row.discount_value.toLocaleString("ko-KR")}원`;
}

function getStatus(row: CouponRow): "active" | "inactive" | "expired" | "exhausted" {
  if (row.valid_until && new Date(row.valid_until) < new Date()) return "expired";
  if (!row.is_active) return "inactive";
  if (row.max_redemptions !== null && row.redemption_count >= row.max_redemptions) return "exhausted";
  return "active";
}

const STATUS_LABEL: Record<string, string> = { active: "사용가능", inactive: "비활성", expired: "만료", exhausted: "소진" };
const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  expired: "bg-red-50 text-red-600",
  exhausted: "bg-orange-50 text-orange-600",
};

export function CouponManager({
  coupons,
  categories,
  tiers,
}: {
  coupons: CouponRow[];
  categories: Option[];
  tiers: Option[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(row: CouponRow) {
    setForm({
      code: row.code,
      discount_type: row.discount_type,
      discount_value: String(row.discount_value),
      valid_from: toDatetimeLocal(row.valid_from),
      valid_until: toDatetimeLocal(row.valid_until),
      category_id: row.category_id ?? "",
      min_tier_id: row.min_tier_id ?? "",
      max_redemptions: row.max_redemptions !== null ? String(row.max_redemptions) : "",
      is_active: row.is_active,
    });
    setEditingId(row.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.code.trim()) {
      setError("쿠폰 코드는 필수입니다.");
      return;
    }
    const discountValue = Number(form.discount_value);
    if (!form.discount_value || Number.isNaN(discountValue) || discountValue <= 0) {
      setError("할인 값을 올바르게 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: discountValue,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : new Date().toISOString(),
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      category_id: form.category_id || null,
      min_tier_id: form.min_tier_id || null,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      is_active: form.is_active,
    };

    const { error: saveError } = editingId
      ? await supabase.from("coupons").update(payload).eq("id", editingId)
      : await supabase.from("coupons").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(row: CouponRow) {
    if (!confirm(`"${row.code}" 쿠폰을 삭제할까요? (사용 이력이 있으면 대신 비활성화를 권장합니다)`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("coupons").delete().eq("id", row.id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message}`);
      return;
    }
    router.refresh();
  }

  async function toggleActive(row: CouponRow) {
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !row.is_active }).eq("id", row.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          카테고리를 지정하지 않으면 전체 카테고리, 최소 등급을 지정하지 않으면 비회원도 사용할 수 있는 쿠폰입니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 쿠폰 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            쿠폰 코드
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={!!editingId}
              placeholder="예: WELCOME10"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              할인 방식
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as "fixed" | "percent" })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="fixed">정액(원)</option>
                <option value="percent">정률(%)</option>
              </select>
            </label>
            <label className="text-sm">
              할인 값
              <input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="text-sm">
            시작일시
            <input
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            종료일시 (선택, 비우면 무기한)
            <input
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            적용 카테고리 (선택)
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            최소 등급 (선택)
            <select
              value={form.min_tier_id}
              onChange={(e) => setForm({ ...form, min_tier_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">제한 없음 (비회원 포함)</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} 이상
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            최대 사용 횟수 (선택, 비우면 무제한)
            <input
              type="number"
              min="1"
              value={form.max_redemptions}
              onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
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

      {coupons.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 쿠폰이 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">코드</th>
                <th className="px-4 py-3">할인</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">최소 등급</th>
                <th className="px-4 py-3">기간</th>
                <th className="px-4 py-3">사용 현황</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((row) => {
                const status = getStatus(row);
                const category = categories.find((c) => c.id === row.category_id);
                const tier = tiers.find((t) => t.id === row.min_tier_id);
                return (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.code}</td>
                    <td className="px-4 py-3 text-gray-500">{discountLabel(row)}</td>
                    <td className="px-4 py-3 text-gray-500">{category?.name ?? "전체"}</td>
                    <td className="px-4 py-3 text-gray-500">{tier ? `${tier.name} 이상` : "제한없음"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(row.valid_from).toLocaleDateString("ko-KR")} ~{" "}
                      {row.valid_until ? new Date(row.valid_until).toLocaleDateString("ko-KR") : "무기한"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.redemption_count}
                      {row.max_redemptions !== null ? ` / ${row.max_redemptions}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(row)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-semibold">
                        <button onClick={() => startEdit(row)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          수정
                        </button>
                        <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
