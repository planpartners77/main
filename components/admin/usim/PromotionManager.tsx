"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getExposureStatus, EXPOSURE_STATUS_LABEL, EXPOSURE_STATUS_STYLE } from "@/lib/design/exposure-status";
import { PROMOTION_TYPES, PROMOTION_TYPE_OPTION_LABELS, PROMOTION_TYPE_SHORT_LABELS, type PromotionType } from "@/lib/usim/plan-spec";

export interface PromotionScheduleEntry {
  month: number;
  amount: number;
}

export interface PromotionRow {
  id: string;
  product_id: string;
  label: string;
  type: PromotionType;
  total_amount: number;
  schedule: PromotionScheduleEntry[];
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  products: { title: string } | null;
}

interface ProductOption {
  id: string;
  title: string;
}

type ScheduleMode = "lifetime" | "custom";

const EMPTY_FORM = {
  product_id: "",
  label: "",
  type: "fixed" as PromotionType,
  valid_from: "",
  valid_until: "",
  is_active: true,
};

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function PromotionManager({ promotions, products }: { promotions: PromotionRow[]; products: ProductOption[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("lifetime");
  const [lifetimeAmount, setLifetimeAmount] = useState("");
  const [schedule, setSchedule] = useState<PromotionScheduleEntry[]>([{ month: 1, amount: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm(EMPTY_FORM);
    setScheduleMode("lifetime");
    setLifetimeAmount("");
    setSchedule([{ month: 1, amount: 0 }]);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function loadPromotionIntoForm(promo: PromotionRow, label: string) {
    setForm({
      product_id: promo.product_id,
      label,
      type: promo.type,
      valid_from: promo.valid_from ?? "",
      valid_until: promo.valid_until ?? "",
      is_active: promo.is_active,
    });
    const isLifetime = promo.schedule.length === 1 && promo.schedule[0]?.month === 0;
    if (isLifetime) {
      setScheduleMode("lifetime");
      setLifetimeAmount(String(promo.schedule[0].amount));
      setSchedule([{ month: 1, amount: 0 }]);
    } else {
      setScheduleMode("custom");
      setSchedule(promo.schedule.length > 0 ? promo.schedule : [{ month: 1, amount: 0 }]);
      setLifetimeAmount("");
    }
    setShowForm(true);
    setError(null);
  }

  function startEdit(promo: PromotionRow) {
    loadPromotionIntoForm(promo, promo.label);
    setEditingId(promo.id);
  }

  function startCopy(promo: PromotionRow) {
    loadPromotionIntoForm(promo, `${promo.label} (복사)`);
    setEditingId(null);
  }

  function addScheduleRow() {
    setSchedule((rows) => [...rows, { month: rows.length + 1, amount: 0 }]);
  }

  function removeScheduleRow(index: number) {
    setSchedule((rows) => rows.filter((_, i) => i !== index));
  }

  function updateScheduleRow(index: number, field: "month" | "amount", value: number) {
    setSchedule((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.product_id || !form.label.trim()) {
      setError("요금제와 프로모션명은 필수입니다.");
      return;
    }

    const finalSchedule: PromotionScheduleEntry[] =
      scheduleMode === "lifetime" ? [{ month: 0, amount: Number(lifetimeAmount) || 0 }] : schedule;

    const totalAmount =
      scheduleMode === "lifetime"
        ? Number(lifetimeAmount) || 0
        : finalSchedule.reduce((sum, s) => sum + s.amount, 0);

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      product_id: form.product_id,
      label: form.label.trim(),
      type: form.type,
      total_amount: totalAmount,
      schedule: finalSchedule,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
    };

    const { error: saveError } = editingId
      ? await supabase.from("plan_promotions").update(payload).eq("id", editingId)
      : await supabase.from("plan_promotions").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 프로모션을 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("plan_promotions").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(promo: PromotionRow) {
    const supabase = createClient();
    await supabase.from("plan_promotions").update({ is_active: !promo.is_active }).eq("id", promo.id);
    router.refresh();
  }

  const hasProducts = products.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">요금제별 페이백/포인트지급/추가할인 프로모션을 관리합니다. &quot;평생&quot;은 매월 동일 금액이 무기한 지급됨을 의미합니다.</p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          disabled={!hasProducts}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {showForm ? "닫기" : "새 프로모션 추가"}
        </button>
      </div>

      {!hasProducts && (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          등록된 유심 요금제가 없어 프로모션을 추가할 수 없습니다.{" "}
          <Link href="/admin/products" className="font-semibold text-[var(--brand-blue)] hover:underline">
            상품 관리에서 요금제를 먼저 등록
          </Link>
          해 주세요.
        </p>
      )}

      {showForm && hasProducts && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm">
            대상 요금제
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            프로모션명
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="예: 개통 페이백"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            지급 유형
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {PROMOTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROMOTION_TYPE_OPTION_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            활성화
          </label>
          <label className="text-sm">
            노출 시작일 (선택)
            <input
              type="date"
              value={form.valid_from}
              onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            노출 종료일 (선택)
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="text-sm sm:col-span-2">
            <p className="mb-1.5 font-medium text-gray-700">지급 스케줄</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={scheduleMode === "lifetime"}
                  onChange={() => setScheduleMode("lifetime")}
                />
                평생(매월 동일 금액)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={scheduleMode === "custom"}
                  onChange={() => setScheduleMode("custom")}
                />
                월별 스케줄
              </label>
            </div>

            {scheduleMode === "lifetime" ? (
              <input
                type="number"
                value={lifetimeAmount}
                onChange={(e) => setLifetimeAmount(e.target.value)}
                placeholder="월 지급액"
                className="mt-2 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            ) : (
              <div className="mt-2 space-y-2">
                {schedule.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">월차</span>
                    <input
                      type="number"
                      value={row.month}
                      onChange={(e) => updateScheduleRow(i, "month", Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <span className="text-xs text-gray-400">금액</span>
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateScheduleRow(i, "amount", Number(e.target.value))}
                      className="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeScheduleRow(i)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addScheduleRow}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600"
                >
                  + 월 추가
                </button>
              </div>
            )}
          </div>

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

      {promotions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 프로모션이 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400">
                <th className="px-4 py-3">요금제</th>
                <th className="px-4 py-3">프로모션명</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">총 지급액</th>
                <th className="px-4 py-3">기간</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => {
                const status = getExposureStatus({
                  is_active: promo.is_active,
                  start_at: promo.valid_from,
                  end_at: promo.valid_until,
                });
                return (
                  <tr key={promo.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium">{promo.products?.title ?? "-"}</td>
                    <td className="px-4 py-3">{promo.label}</td>
                    <td className="px-4 py-3 text-gray-500">{PROMOTION_TYPE_SHORT_LABELS[promo.type]}</td>
                    <td className="px-4 py-3 text-gray-500">{formatWon(promo.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {promo.valid_from ?? "-"} ~ {promo.valid_until ?? "무기한"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(promo)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${EXPOSURE_STATUS_STYLE[status]}`}
                      >
                        {EXPOSURE_STATUS_LABEL[status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-semibold">
                        <button onClick={() => startEdit(promo)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                          수정
                        </button>
                        <button onClick={() => startCopy(promo)} className="text-[var(--brand-blue)] hover:opacity-70">
                          복사
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="text-red-500 hover:text-red-700">
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
