"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DATA_USAGE_PRESETS,
  QUICK_CHIPS,
  SORT_OPTIONS,
  activeFilterCount,
  effectiveMonthlyPrice,
  matchesFilter,
  matchesQuickChip,
  sortPlans,
  type UsimFilterState,
  type UsimPlanListItem,
  type QuickChipId,
  type SortId,
} from "@/lib/usim/filters";
import { PROMOTION_TYPE_SHORT_LABELS } from "@/lib/usim/plan-spec";
import { paramsToState, stateToParams, type UsimUrlState } from "@/lib/usim/url-state";
import { UsimPlanCard } from "./UsimPlanCard";
import { UsimFilterModal } from "./UsimFilterModal";
import { UsimRecentlyViewedPanel } from "./UsimRecentlyViewedPanel";

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

function PromoBanner({ items }: { items: UsimPlanListItem[] }) {
  const withDeadline = items
    .filter((i) => i.promotion?.valid_until)
    .sort((a, b) => new Date(a.promotion!.valid_until!).getTime() - new Date(b.promotion!.valid_until!).getTime());
  const featured = withDeadline[0] ?? items.find((i) => i.promotion) ?? null;
  const countdown = useCountdown(featured?.promotion?.valid_until ?? null);
  if (!featured) return null;

  return (
    <a
      href={`/usim/${featured.id}`}
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-blue)] p-5 text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-xs font-semibold text-white/70">
          이번 달 한정 {PROMOTION_TYPE_SHORT_LABELS[featured.promotion!.type]} 요금제
        </p>
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

export function UsimPlanList({ items }: { items: UsimPlanListItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 필터/정렬/퀵칩 상태는 URL 쿼리스트링을 원천으로 삼는다.
  // 상세 페이지에서 뒤로가기 하거나 새로고침해도 선택했던 조건이 그대로 유지되도록 하기 위함.
  const { filters, sort, chips: activeChips } = useMemo(() => paramsToState(searchParams), [searchParams]);

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  // 뒤로가기 등 URL 자체가 바뀐 경우, 렌더링 중 로컬 상태를 URL 값에 맞춰 되돌린다.
  // (리액트에서 "prop이 바뀌면 state를 조정"할 때 권장되는 방식 — effect 대신 렌더 중 처리)
  const qsKey = searchParams.toString();
  const [prevQsKey, setPrevQsKey] = useState(qsKey);
  if (qsKey !== prevQsKey) {
    setPrevQsKey(qsKey);
    setSearchDraft(filters.search);
    setPage(1);
  }

  function updateUrl(patch: Partial<UsimUrlState>) {
    const next: UsimUrlState = { filters, sort, chips: activeChips, ...patch };
    const qs = stateToParams(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setFilters(updater: (f: UsimFilterState) => UsimFilterState) {
    updateUrl({ filters: updater(filters) });
  }

  // 검색어는 입력할 때마다 URL을 바꾸면 타이핑이 끊기므로 살짝 지연시켜 반영한다.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== filters.search) updateUrl({ filters: { ...filters, search: searchDraft } });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  function toggleChip(id: QuickChipId) {
    updateUrl({ chips: activeChips.includes(id) ? activeChips.filter((c) => c !== id) : [...activeChips, id] });
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
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8">
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
            onChange={(e) => updateUrl({ sort: e.target.value as SortId })}
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
            혜택 포함 요금만
          </label>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {QUICK_CHIPS.map((chip) => {
            const active = activeChips.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleChip(chip.id)}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition ${
                    active ? "bg-[var(--brand-blue)] text-white" : `${chip.tint} text-gray-700`
                  }`}
                >
                  {chip.emoji}
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${active ? "text-[var(--brand-blue)]" : "text-gray-500"}`}>
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <input
            type="text"
            placeholder="요금제 이름 또는 통신사로 검색"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--brand-blue)] focus:outline-none"
          />
        </div>

        <p className="mt-6 text-sm text-gray-500">총 {filtered.length}개 요금제</p>

        {paged.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            조건에 맞는 요금제가 없습니다. 필터를 조정해 보세요.
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            {paged.map((item) => (
              <UsimPlanCard key={item.id} item={item} />
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
          <UsimFilterModal
            products={items}
            value={filters}
            onClose={() => setModalOpen(false)}
            onApply={(next) => {
              updateUrl({ filters: next });
              setModalOpen(false);
            }}
          />
        )}
      </div>

      <aside className="hidden lg:sticky lg:top-6 lg:block">
        <UsimRecentlyViewedPanel />
      </aside>
    </div>
  );
}
