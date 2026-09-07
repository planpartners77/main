"use client";

export interface RangeValue {
  min: number;
  max: number;
}

// 요금제 종류가 늘어나도 구간 프리셋을 계속 추가할 필요 없이 연속값으로 필터링할 수 있도록
// 만든 듀얼 핸들 슬라이더. 두 <input type="range">를 겹쳐 각 핸들만 pointer-events를 열어둔다.
export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
}: {
  min: number;
  max: number;
  step?: number;
  value: RangeValue;
  onChange: (next: RangeValue) => void;
  formatValue?: (v: number) => string;
}) {
  const format = formatValue ?? ((v: number) => String(v));
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;

  return (
    <div className="w-full pt-2">
      <div className="relative h-1.5 rounded-full bg-gray-200">
        <div
          className="absolute h-1.5 rounded-full bg-[var(--brand-blue)]"
          style={{ left: `${pct(value.min)}%`, right: `${100 - pct(value.max)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: Math.min(Number(e.target.value), value.max) })}
          className="range-thumb pointer-events-none absolute inset-0 w-full"
          style={{ zIndex: value.min >= max ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value.max}
          onChange={(e) => onChange({ ...value, max: Math.max(Number(e.target.value), value.min) })}
          className="range-thumb pointer-events-none absolute inset-0 w-full"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>{format(value.min)}</span>
        <span>{format(value.max)}</span>
      </div>
    </div>
  );
}
