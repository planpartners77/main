"use client";

import { useMemo, useState } from "react";
import { PHONE_ACTIVATION_TYPES, PHONE_CARRIERS, PHONE_MANUFACTURERS } from "@/lib/mobile/device-spec";
import {
  EMPTY_FILTER_STATE,
  PRICE_RANGES,
  SORT_OPTIONS,
  activeFilterCount,
  matchesFilter,
  sortDevices,
  type PhoneFilterState,
  type PriceRangeId,
  type SortId,
  type PhoneDeviceListItem,
} from "@/lib/mobile/filters";
import { PhoneDeviceCard } from "./PhoneDeviceCard";

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function PhoneDeviceList({ items }: { items: PhoneDeviceListItem[] }) {
  const [filter, setFilter] = useState<PhoneFilterState>(EMPTY_FILTER_STATE);
  const [priceRangeId, setPriceRangeId] = useState<PriceRangeId | null>(null);
  const [sort, setSort] = useState<SortId>("recommended");

  const filtered = useMemo(() => sortDevices(items.filter((item) => matchesFilter(item, filter)), sort), [items, filter, sort]);

  function selectPriceRange(id: PriceRangeId) {
    const range = PRICE_RANGES.find((r) => r.id === id);
    if (!range) return;
    if (priceRangeId === id) {
      setPriceRangeId(null);
      setFilter((f) => ({ ...f, priceRange: EMPTY_FILTER_STATE.priceRange }));
    } else {
      setPriceRangeId(id);
      setFilter((f) => ({ ...f, priceRange: { min: range.min, max: range.max } }));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          placeholder="모델명으로 검색"
          className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm sm:w-56"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortId)}
          className="rounded-full border border-gray-200 px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {activeFilterCount(filter) > 0 && (
          <button
            onClick={() => {
              setFilter(EMPTY_FILTER_STATE);
              setPriceRangeId(null);
            }}
            className="text-xs font-medium text-gray-400 hover:text-[var(--brand-navy)]"
          >
            필터 초기화 ({activeFilterCount(filter)})
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PHONE_MANUFACTURERS.map((m) => (
          <button
            key={m}
            onClick={() => setFilter((f) => ({ ...f, manufacturers: toggleInArray(f.manufacturers, m) }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter.manufacturers.includes(m)
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {m}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-gray-100" />
        {PRICE_RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => selectPriceRange(r.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              priceRangeId === r.id
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-gray-100" />
        {PHONE_CARRIERS.map((c) => (
          <button
            key={c}
            onClick={() => setFilter((f) => ({ ...f, carriers: toggleInArray(f.carriers, c) }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter.carriers.includes(c)
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {c}
          </button>
        ))}
        {PHONE_ACTIVATION_TYPES.map((a) => (
          <button
            key={a}
            onClick={() => setFilter((f) => ({ ...f, activationTypes: toggleInArray(f.activationTypes, a) }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter.activationTypes.includes(a)
                ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {a}
          </button>
        ))}
        <button
          onClick={() => setFilter((f) => ({ ...f, selfProvidedOnly: !f.selfProvidedOnly }))}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            filter.selfProvidedOnly
              ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
              : "border-gray-200 text-gray-500"
          }`}
        >
          자급제만
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-400">{filtered.length}개 기종</p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          조건에 맞는 기종이 없습니다. 필터를 조정해 보세요.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <PhoneDeviceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
