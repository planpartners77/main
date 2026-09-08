"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface TierRow {
  id: string;
  name: string | null;
  point_earn_rate: number | null;
  badge_color: string | null;
}

const EMPTY_FORM = { name: "", point_earn_rate: "1.0", badge_color: "#999999" };

export function TierManager({ tiers }: { tiers: TierRow[] }) {
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

  function startEdit(tier: TierRow) {
    setForm({
      name: tier.name ?? "",
      point_earn_rate: String(tier.point_earn_rate ?? 0),
      badge_color: tier.badge_color ?? "#999999",
    });
    setEditingId(tier.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const rate = Number(form.point_earn_rate);
    if (!form.name.trim()) {
      setError("등급명은 필수입니다.");
      return;
    }
    if (Number.isNaN(rate) || rate < 0) {
      setError("포인트 적립 배율은 0 이상의 숫자여야 합니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { name: form.name.trim(), point_earn_rate: rate, badge_color: form.badge_color };
    const { error: saveError } = editingId
      ? await supabase.from("customer_tiers").update(payload).eq("id", editingId)
      : await supabase.from("customer_tiers").insert(payload);
    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 등급을 삭제할까요? 이 등급을 사용 중인 회원/쿠폰 조건이 있으면 삭제가 거부됩니다.")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("customer_tiers").delete().eq("id", id);
    if (deleteError) {
      alert(`삭제 실패: ${deleteError.message}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          포인트 적립 배율은 정산 승인(paid) 시 회원 포인트 적립에 즉시 반영되고, 쿠폰의 최소 등급 조건과도
          연결됩니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 등급 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
          <label className="text-sm">
            등급명
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="브론즈"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            포인트 적립 배율
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.point_earn_rate}
              onChange={(e) => setForm({ ...form, point_earn_rate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            뱃지 색상
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.badge_color}
                onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                className="h-9 w-12 rounded-lg border border-gray-300"
              />
              <input
                value={form.badge_color}
                onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
          <div className="sm:col-span-3">
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

      {tiers.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 등급이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tier.badge_color ?? "#999999" }}
                />
                <span className="text-sm font-medium text-gray-900">{tier.name ?? "(이름 없음)"}</span>
                <span className="text-xs text-gray-400">적립 배율 {tier.point_earn_rate ?? 0}x</span>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => startEdit(tier)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  수정
                </button>
                <button onClick={() => handleDelete(tier.id)} className="text-red-500 hover:text-red-700">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
