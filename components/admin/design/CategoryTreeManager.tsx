"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TrackType, RegulationLevel } from "@/lib/categories";

export interface CategoryTreeRow {
  id: string;
  slug: string;
  name: string;
  track_type: TrackType;
  regulation_level: RegulationLevel;
  parent_id: string | null;
  sort_order: number;
  href: string | null;
  is_active: boolean;
  children: CategoryTreeRow[];
}

const EMPTY_FORM = { slug: "", name: "", href: "", track_type: "self_service" as TrackType, regulation_level: "low" as RegulationLevel };

export function CategoryTreeManager({ tree }: { tree: CategoryTreeRow[] }) {
  return (
    <div>
      <p className="text-sm text-gray-500">
        카테고리를 추가/숨김/순서 변경할 수 있습니다. 새 카테고리 추가는 최고관리자만 가능합니다(권한 부족 시 저장 실패
        메시지가 표시됩니다). 기존 페이지(여행/인터넷/휴대폰/가전렌탈/보험/상조)와 연결된 카테고리의 슬러그/href는
        실제 라우팅과 연결되어 있으니 변경 시 주의하세요.
      </p>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
        {tree.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">등록된 카테고리가 없습니다.</p>
        ) : (
          tree.map((node, index) => <CategoryNode key={node.id} node={node} siblings={tree} index={index} depth={0} />)
        )}
        <AddForm parentId={null} depth={0} />
      </div>
    </div>
  );
}

function CategoryNode({
  node,
  siblings,
  index,
  depth,
}: {
  node: CategoryTreeRow;
  siblings: CategoryTreeRow[];
  index: number;
  depth: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: node.name, href: node.href ?? "" });
  const [showAddChild, setShowAddChild] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("categories").update({ is_active: !node.is_active }).eq("id", node.id);
    if (err) setError(`저장 실패: ${err.message}`);
    else router.refresh();
  }

  async function move(direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const target = siblings[targetIndex];
    setError(null);
    const supabase = createClient();
    const [{ error: err1 }, { error: err2 }] = await Promise.all([
      supabase.from("categories").update({ sort_order: target.sort_order }).eq("id", node.id),
      supabase.from("categories").update({ sort_order: node.sort_order }).eq("id", target.id),
    ]);
    if (err1 || err2) setError(`저장 실패: ${(err1 ?? err2)?.message}`);
    else router.refresh();
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("이름은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .update({ name: form.name.trim(), href: form.href.trim() || null })
      .eq("id", node.id);
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message}`);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div style={{ marginLeft: depth * 20 }} className="border-t border-gray-100 py-2 first:border-t-0">
      {!editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium ${node.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
            {node.name}
          </span>
          <span className="text-xs text-gray-400">/{node.slug}</span>
          {!node.is_active && (
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
            <button onClick={() => setShowAddChild((v) => !v)} className="text-gray-500 hover:text-[var(--brand-navy)]">
              하위추가
            </button>
            <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-[var(--brand-navy)]">
              수정
            </button>
            <button onClick={toggleActive} className={node.is_active ? "text-red-500 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"}>
              {node.is_active ? "숨기기" : "노출하기"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            placeholder="이름"
          />
          <input
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            placeholder={`href (비우면 /${node.slug})`}
          />
          <button type="submit" disabled={saving} className="rounded-full bg-[var(--brand-blue)] px-3 py-1 text-xs font-semibold text-white">
            저장
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500">
            취소
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {showAddChild && <AddForm parentId={node.id} depth={depth + 1} onDone={() => setShowAddChild(false)} />}

      {node.children.map((child, childIndex) => (
        <CategoryNode key={child.id} node={child} siblings={node.children} index={childIndex} depth={depth + 1} />
      ))}
    </div>
  );
}

function AddForm({ parentId, depth, onDone }: { parentId: string | null; depth: number; onDone?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(depth === 0 ? false : true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) {
      setError("슬러그와 이름은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("categories").insert({
      slug: form.slug.trim(),
      name: form.name.trim(),
      href: form.href.trim() || null,
      track_type: form.track_type,
      regulation_level: form.regulation_level,
      parent_id: parentId,
      sort_order: 999,
    });
    setSaving(false);
    if (err) {
      setError(`저장 실패: ${err.message} (신규 카테고리 생성은 최고관리자 권한이 필요합니다)`);
      return;
    }
    setForm(EMPTY_FORM);
    setOpen(false);
    onDone?.();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ marginLeft: depth * 20 }}
        className="mt-2 text-xs font-semibold text-[var(--brand-navy)]"
      >
        + 카테고리 추가
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ marginLeft: depth * 20 }}
      className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-2"
    >
      <input
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="슬러그 (예: pet-insurance)"
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="이름"
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        value={form.href}
        onChange={(e) => setForm({ ...form, href: e.target.value })}
        placeholder="href (비우면 자동)"
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      />
      <select
        value={form.track_type}
        onChange={(e) => setForm({ ...form, track_type: e.target.value as TrackType })}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="self_service">셀프가입</option>
        <option value="consult_required">상담필수</option>
      </select>
      <select
        value={form.regulation_level}
        onChange={(e) => setForm({ ...form, regulation_level: e.target.value as RegulationLevel })}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="low">규제 낮음</option>
        <option value="medium">규제 중간</option>
        <option value="high">규제 높음</option>
      </select>
      <button type="submit" disabled={saving} className="rounded-full bg-[var(--brand-blue)] px-3 py-1 text-xs font-semibold text-white">
        {saving ? "저장 중..." : "추가"}
      </button>
      {depth > 0 && (
        <button type="button" onClick={() => (onDone ? onDone() : setOpen(false))} className="text-xs text-gray-500">
          취소
        </button>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
