export type ExposureStatus = "active" | "scheduled" | "ended" | "inactive";

interface ExposureRow {
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

// 배너·팝업 공용: is_active + 노출기간을 조합해 관리자 목록에 보여줄 상태를 계산한다.
export function getExposureStatus(row: ExposureRow): ExposureStatus {
  if (!row.is_active) return "inactive";
  const now = Date.now();
  if (row.start_at && new Date(row.start_at).getTime() > now) return "scheduled";
  if (row.end_at && new Date(row.end_at).getTime() < now) return "ended";
  return "active";
}

export const EXPOSURE_STATUS_LABEL: Record<ExposureStatus, string> = {
  active: "노출중",
  scheduled: "예약",
  ended: "종료",
  inactive: "비활성",
};

export const EXPOSURE_STATUS_STYLE: Record<ExposureStatus, string> = {
  active: "bg-green-50 text-green-700",
  scheduled: "bg-blue-50 text-blue-700",
  ended: "bg-gray-100 text-gray-500",
  inactive: "bg-gray-100 text-gray-400",
};
