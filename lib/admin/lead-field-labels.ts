// guest_contact/consent은 신청서(카테고리)마다 필드 구성이 다른 자유형 jsonb라 원본 영문 키가
// 그대로 저장돼 있다. 상담원이 알아볼 수 있게 카테고리별로 알려진 키만 한글 라벨로 매핑하고,
// 매핑에 없는 키(새 폼 추가 등)는 camelCase를 사람이 읽기 쉬운 형태로 자동 변환해 최소한의
// 표시는 항상 보장한다.
const COMMON_LABELS: Record<string, string> = {
  name: "이름",
  phone: "연락처",
  memo: "문의 내용",
  channel: "유입 채널",
  preferredTime: "상담 희망 시간대",
  preferredDate: "희망일",
  birthDate: "생년월일",
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  travel: {
    program: "프로그램",
    childInfo: "자녀 정보",
    nickname: "닉네임",
    guardianName: "보호자 이름",
    guardianNameEn: "보호자 영문 이름",
    address: "주소",
    session: "회차",
    experience: "골프 경험",
    experienceDetail: "골프 경험 상세",
    heardFrom: "유입 경로",
    heardFromDetail: "유입 경로 상세",
    notes: "요청사항",
    notesDetail: "요청사항 상세",
    mediaConsent: "사진/영상 활용 동의",
  },
  usim: {
    applicantName: "신청자 이름",
    activationType: "개통 유형",
    activationTypeLabel: "개통 유형",
    simType: "유심 종류",
    simTypeLabel: "유심 종류",
  },
  mobile: {
    activationType: "개통 유형",
    carrier: "통신사",
  },
};

const CONSENT_LABELS: Record<string, string> = {
  privacy: "개인정보 수집·이용 동의",
  thirdParty: "제3자 정보제공 동의",
  terms: "이용약관 동의",
  marketing: "마케팅 활용 동의",
};

// camelCase -> "Camel Case" 형태로 최소한의 가독성을 확보하는 fallback.
function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
  return spaced;
}

export function getFieldLabel(categorySlug: string | undefined, key: string): string {
  return CATEGORY_LABELS[categorySlug ?? ""]?.[key] ?? COMMON_LABELS[key] ?? humanizeKey(key);
}

export function getConsentLabel(key: string): string {
  return CONSENT_LABELS[key] ?? humanizeKey(key);
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (Array.isArray(value)) return value.map((v) => formatFieldValue(v)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
