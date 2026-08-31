"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CategoryItem {
  slug: string;
  name: string;
}

export function CategoryOrderManager({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(categories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("site_settings")
      .update({ value: { order: order.map((c) => c.slug) } })
      .eq("key", "category_order");

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
        상단 메뉴(GNB)와 홈 화면 카테고리 카드에 표시되는 순서입니다. 위로 갈수록 먼저 노출됩니다.
      </p>

      <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
        {order.map((category, index) => (
          <div key={category.slug} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-[var(--brand-navy)]">
              {index + 1}. {category.name}
            </span>
            <div className="flex gap-2 text-xs font-semibold text-gray-500">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-full border border-gray-200 px-2.5 py-1 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-30"
              >
                위로
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                className="rounded-full border border-gray-200 px-2.5 py-1 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] disabled:opacity-30"
              >
                아래로
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-[var(--brand-blue)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중..." : "순서 저장"}
      </button>
    </div>
  );
}
