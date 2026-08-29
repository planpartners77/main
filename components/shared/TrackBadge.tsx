import type { TrackType } from "@/lib/categories";

// 가이드 §5-2: 트랙 표시 배지 — 셀프서비스/상담필수를 색으로 구분해 즉시 인지시킨다.
export function TrackBadge({ trackType }: { trackType: TrackType }) {
  const isConsult = trackType === "consult_required";
  return (
    <span
      className={
        isConsult
          ? "inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
          : "inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
      }
    >
      {isConsult ? "전문 상담 필수" : "셀프가입 가능"}
    </span>
  );
}
