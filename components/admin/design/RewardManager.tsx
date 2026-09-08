"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface RewardRow {
  id: string;
  recipient_name: string;
  reward_item: string;
  category: string | null;
  awarded_at: string;
  is_active: boolean;
}

const EMPTY_FORM = { recipient_name: "", reward_item: "", category: "", awarded_at: "", is_active: true };

export function RewardManager({ rewards }: { rewards: RewardRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function startCreate() {
    setForm({ ...EMPTY_FORM, awarded_at: todayStr() });
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(reward: RewardRow) {
    setForm({
      recipient_name: reward.recipient_name,
      reward_item: reward.reward_item,
      category: reward.category ?? "",
      awarded_at: reward.awarded_at,
      is_active: reward.is_active,
    });
    setEditingId(reward.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.recipient_name.trim() || !form.reward_item.trim() || !form.awarded_at) {
      setError("이름, 사은품, 지급일은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      recipient_name: form.recipient_name.trim(),
      reward_item: form.reward_item.trim(),
      category: form.category.trim() === "" ? null : form.category.trim(),
      awarded_at: form.awarded_at,
      is_active: form.is_active,
    };
    const { error: saveError } = editingId
      ? await supabase.from("reward_recipients").update(payload).eq("id", editingId)
      : await supabase.from("reward_recipients").insert(payload);
    setSaving(false);
    if (saveError) {
      setError(`저장 실패: ${saveError.message}`);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 지급 내역을 삭제할까요?")) return;
    const supabase = createClient();
    await supabase.from("reward_recipients").delete().eq("id", id);
    router.refresh();
  }

  async function toggleActive(reward: RewardRow) {
    const supabase = createClient();
    await supabase.from("reward_recipients").update({ is_active: !reward.is_active }).eq("id", reward.id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          게시함으로 표시된 항목만 /rewards 페이지에 공개됩니다. 이름은 사이트에 자동으로 일부 마스킹되어 노출됩니다.
        </p>
        <button
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "닫기" : "새 지급 내역 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <label className="text-sm">
            이름
            <input
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="홍길동"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            사은품
            <input
              value={form.reward_item}
              onChange={(e) => setForm({ ...form, reward_item: e.target.value })}
              placeholder="스타벅스 기프티콘"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            카테고리(선택)
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="유심/여행자보험 등"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            지급일
            <input
              type="date"
              value={form.awarded_at}
              onChange={(e) => setForm({ ...form, awarded_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            게시함
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

      {rewards.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          등록된 지급 내역이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${reward.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                    {reward.recipient_name} · {reward.reward_item}
                  </span>
                  {reward.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {reward.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">{new Date(reward.awarded_at).toLocaleDateString("ko-KR")}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => toggleActive(reward)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  {reward.is_active ? "숨기기" : "게시"}
                </button>
                <button onClick={() => startEdit(reward)} className="text-gray-500 hover:text-[var(--brand-navy)]">
                  수정
                </button>
                <button onClick={() => handleDelete(reward.id)} className="text-red-500 hover:text-red-700">
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
