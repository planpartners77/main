// 휴대폰(mobile) 카테고리 단말기 스펙 — products.extra jsonb에 이 형태로 저장한다.
// 유심(usim) 카테고리와는 무관한 완전히 별도의 계약이며, products/partners/leads 같은
// 플랫폼 공용 테이블만 그대로 재사용한다(카테고리 전용 테이블은 추가하지 않는다).

export type PhoneManufacturer = "Apple" | "Samsung" | "LG" | "기타";
export const PHONE_MANUFACTURERS: PhoneManufacturer[] = ["Apple", "Samsung", "LG", "기타"];

export type PhoneCarrier = "SKT" | "KT" | "LGU+" | "알뜰폰";
export const PHONE_CARRIERS: PhoneCarrier[] = ["SKT", "KT", "LGU+", "알뜰폰"];

export type PhoneActivationType = "번호이동" | "기기변경" | "신규가입";
export const PHONE_ACTIVATION_TYPES: PhoneActivationType[] = ["번호이동", "기기변경", "신규가입"];

export type PhoneStockStatus = "in_stock" | "low_stock" | "sold_out";
export const PHONE_STOCK_STATUS_LABELS: Record<PhoneStockStatus, string> = {
  in_stock: "재고 있음",
  low_stock: "재고 소진 임박",
  sold_out: "품절",
};

export const PHONE_STORAGE_OPTIONS = [64, 128, 256, 512, 1024] as const;
export type PhoneStorageGb = (typeof PHONE_STORAGE_OPTIONS)[number];

export interface PhoneDeviceExtra {
  manufacturer: PhoneManufacturer;
  model: string;
  storage_gb: PhoneStorageGb;
  color: string;
  release_price: number | null; // 출고가 (지원금 적용 전)
  carriers: PhoneCarrier[]; // 개통 가능 통신사
  activation_types: PhoneActivationType[]; // 신청 가능한 개통 방식
  self_provided_available: boolean; // 자급제(단말기만 구매) 가능 여부
  esim_available: boolean;
  stock_status: PhoneStockStatus;
}

export const EMPTY_PHONE_DEVICE_EXTRA: PhoneDeviceExtra = {
  manufacturer: "Apple",
  model: "",
  storage_gb: 128,
  color: "",
  release_price: null,
  carriers: [],
  activation_types: [],
  self_provided_available: false,
  esim_available: false,
  stock_status: "in_stock",
};

// DB에서 읽은 extra(Record<string, unknown>)를 안전하게 PhoneDeviceExtra로 정규화한다.
// 관리자 입력 누락/구버전 데이터가 있어도 목록·상세 페이지가 깨지지 않도록 방어한다.
export function normalizePhoneDeviceExtra(raw: Record<string, unknown> | null | undefined): PhoneDeviceExtra {
  const r = raw ?? {};
  const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    manufacturer: PHONE_MANUFACTURERS.includes(r.manufacturer as PhoneManufacturer)
      ? (r.manufacturer as PhoneManufacturer)
      : "Apple",
    model: typeof r.model === "string" ? r.model : "",
    storage_gb: (PHONE_STORAGE_OPTIONS as readonly number[]).includes(r.storage_gb as number)
      ? (r.storage_gb as PhoneStorageGb)
      : 128,
    color: typeof r.color === "string" ? r.color : "",
    release_price: typeof r.release_price === "number" ? r.release_price : null,
    carriers: asStringArray(r.carriers).filter((c): c is PhoneCarrier => (PHONE_CARRIERS as readonly string[]).includes(c)),
    activation_types: asStringArray(r.activation_types).filter((a): a is PhoneActivationType =>
      (PHONE_ACTIVATION_TYPES as readonly string[]).includes(a),
    ),
    self_provided_available: r.self_provided_available === true,
    esim_available: r.esim_available === true,
    stock_status: (["in_stock", "low_stock", "sold_out"] as const).includes(r.stock_status as PhoneStockStatus)
      ? (r.stock_status as PhoneStockStatus)
      : "in_stock",
  };
}

export function storageLabel(gb: number): string {
  return gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
}
