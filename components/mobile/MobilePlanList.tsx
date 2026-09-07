"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DATA_USAGE_PRESETS,
  EMPTY_FILTER_STATE,
  QUICK_CHIPS,
  SORT_OPTIONS,
  activeFilterCount,
  effectiveMonthlyPrice,
  matchesFilter,
  matchesQuickChip,
  sortPlans,
  type MobileFilterState,
  type MobilePlanListItem,
  type QuickChipId,
  type SortId,
} from "@/lib/mobile/filters";
import { MobilePlanCard } from "./MobilePlanCard";
import { MobileFilterModal } from "./MobileFilterModal";

const PAGE_SIZE = 12;

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetIso]);
  if (!targetIso) return null;
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

function PromoBanner({ items }: { items: MobilePlanListItem[] }) {
  const withDeadline = items
    .filter((i) => i.promotion?.valid_until)
    .sort((a, b) => new Date(a.promotion!.valid_until!).getTime() - new Date(b.promotion!.valid_until!).getTime());
  const featured = withDeadline[0] ?? items.find((i) => i.promotion) ?? null;
  const countdown = useCountdown(featured?.promotion?.valid_until ?? null);
  if (!featured) return null;

  return (
    <a
      href={`/mobile/${featured.id}`}
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-blue)] p-5 text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-xs font-semibold text-white/70">이번 달 한정 페이백 요금제</p>
        <p className="mt-1 text-base font-bold">{featured.title}</p>
        <p className="mt-1 text-sm text-white/80">
          월 {formatWon(effectiveMonthlyPrice(featured))} · {featured.partner_name ?? "통신사 미지정"}
        </p>
      </div>
      {countdown && (
        <div className="flex shrink-0 gap-2 text-center text-xs font-semibold">
          {[
            [countdown.days, "일"],
            [countdown.hours, "시간"],
            [countdown.minutes, "분"],
          ].map(([v, u]) => (
            <div key={u as string} className="rounded-lg bg-white/15 px-3 py-2">
              <p className="text-lg">{v}</p>
              <p className="text-[10px] font-normal text-white/70">{u}</p>
            </div>
          ))}
        </div>
      )}
    </a>
  );
}

export function MobilePlanList({ items }: { items: MobilePlanListItem[] }) {
  const [filters, setFilters] = useState<MobileFilterState>(EMPTY_FILTER_STATE);
  const [sort, setSort] = useState<SortId>("recommended");
  const [activeChips, setActiveChips] = useState<QuickChipId[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters, sort, activeChips]);

  function toggleChip(id: QuickChipId) {
    setActiveChips((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const filtered = useMemo(() => {
    const byFilter = items.filter((item) => matchesFilter(item, filters));
    const byChips = activeChips.length > 0 ? byFilter.filter((item) => activeChips.every((c) => matchesQuickChip(item, c))) : byFilter;
    return sortPlans(byChips, sort);
  }, [items, filters, activeChips, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filterCount = activeFilterCount(filters);

  return (
    <div>
      <PromoBanner items={items} />

      <div className="mt-6">
        <p className="text-xs font-bold tracking-wider text-[var(--brand-blue)]">월 데이터 사용량</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, dataUsage: null }))}
            className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition ${
              filters.dataUsage === null
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-blue)]/50"
            }`}
          >
            전체
          </button>
          {DATA_USAGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, dataUsage: f.dataUsage === preset.id ? null : preset.id }))}
              className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition ${
                filters.dataUsage === preset.id
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-blue)]/50"
              }`}
              title={preset.helper}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-[var(--brand-blue)]"
        >
          필터{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-600">
          <input
            type="checkbox"
            checked={filters.paybackOnly}
            onChange={(e) => setFilters((f) => ({ ...f, paybackOnly: e.target.checked }))}
            className="h-4 w-4 accent-[var(--brand-blue)]"
          />
          페이백 포함 요금만
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => toggleChip(chip.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              activeChips.includes(chip.id)
                ? "border-[var(--brand-blue)] bg-[var(--surface-tint)] text-[var(--brand-blue-dark)]"
                : "border-gray-200 bg-white text-gray-500 hover:border-[var(--brand-blue)]/50"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="요금제 이름 또는 통신사로 검색"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none sm:max-w-sm"
        />
      </div>

      <p className="mt-6 text-sm text-gray-500">총 {filtered.length}개 요금제</p>

      {paged.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          조건에 맞는 요금제가 없습니다. 필터를 조정해 보세요.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((item) => (
            <MobilePlanCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-full text-xs font-semibold ${
                p === page ? "bg-[var(--brand-blue)] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <MobileFilterModal
          products={items}
          value={filters}
          onClose={() => setModalOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
