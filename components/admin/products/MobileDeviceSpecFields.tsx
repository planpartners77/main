"use client";

import {
  PHONE_ACTIVATION_TYPES,
  PHONE_CARRIERS,
  PHONE_MANUFACTURERS,
  PHONE_STOCK_STATUS_LABELS,
  PHONE_STORAGE_OPTIONS,
  type PhoneActivationType,
  type PhoneCarrier,
  type PhoneDeviceExtra,
  type PhoneStockStatus,
} from "@/lib/mobile/device-spec";
import { normalizePhoneDeviceExtra } from "@/lib/mobile/device-spec";

export function parsePhoneExtra(json: string): PhoneDeviceExtra {
  try {
    return normalizePhoneDeviceExtra(JSON.parse(json));
  } catch {
    return normalizePhoneDeviceExtra(null);
  }
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function MobileDeviceSpecFields({
  value,
  onChange,
}: {
  value: PhoneDeviceExtra;
  onChange: (next: PhoneDeviceExtra) => void;
}) {
  function set<K extends keyof PhoneDeviceExtra>(key: K, v: PhoneDeviceExtra[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:col-span-2 sm:grid-cols-2">
      <p className="text-xs font-bold text-gray-500 sm:col-span-2">휴대폰 단말기 스펙</p>

      <label className="text-sm">
        제조사
        <select
          value={value.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value as PhoneDeviceExtra["manufacturer"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {PHONE_MANUFACTURERS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        모델명
        <input
          value={value.model}
          onChange={(e) => set("model", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        저장용량
        <select
          value={value.storage_gb}
          onChange={(e) => set("storage_gb", Number(e.target.value) as PhoneDeviceExtra["storage_gb"])}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {PHONE_STORAGE_OPTIONS.map((gb) => (
            <option key={gb} value={gb}>
              {gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        색상
        <input
          value={value.color}
          onChange={(e) => set("color", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        출고가 (선택)
        <input
          type="number"
          value={value.release_price ?? ""}
          onChange={(e) => set("release_price", e.target.value ? Number(e.target.value) : null)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        재고 상태
        <select
          value={value.stock_status}
          onChange={(e) => set("stock_status", e.target.value as PhoneStockStatus)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {(Object.keys(PHONE_STOCK_STATUS_LABELS) as PhoneStockStatus[]).map((s) => (
            <option key={s} value={s}>
              {PHONE_STOCK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="text-sm sm:col-span-2">
        <p className="text-gray-500">개통 가능 통신사</p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          {PHONE_CARRIERS.map((c) => (
            <label key={c} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={value.carriers.includes(c)}
                onChange={() => set("carriers", toggleInArray(value.carriers, c) as PhoneCarrier[])}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="text-sm sm:col-span-2">
        <p className="text-gray-500">신청 가능한 개통 방식</p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          {PHONE_ACTIVATION_TYPES.map((a) => (
            <label key={a} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={value.activation_types.includes(a)}
                onChange={() => set("activation_types", toggleInArray(value.activation_types, a) as PhoneActivationType[])}
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.self_provided_available}
          onChange={(e) => set("self_provided_available", e.target.checked)}
        />
        자급제(단말기만 구매) 가능
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.esim_available}
          onChange={(e) => set("esim_available", e.target.checked)}
        />
        eSIM 지원
      </label>
    </div>
  );
}
