// 사업자 정보 (제공된 "기본사업자정보 .txt" 기준). 미확보 항목은 실제 등록/발급 후 채워야
// 하며, 임의의 값을 넣지 않는다(§7 컴플라이언스 체크리스트 대상).
export const BUSINESS_INFO = {
  companyName: "플랜파트너스", // 확정 상호명 필요 시 교체
  bizRegNo: "176-81-04087",
  ceo: "유현",
  corpRegNo: "110111-0966888",
  address: "서울특별시 종로구 인사동5길 25, 8층 812호(인사동, 하나로빌딩)",
  bizType: "도매 및 소매업",
  bizItem: "전자상거래 소매업",
  // 아래는 §12-2/§7에서 요구하지만 아직 확보되지 않은 값 — 발급/등록 완료 후 채울 것
  mailOrderRegNo: null as string | null, // 통신판매중개업 신고번호
  privacyOfficer: null as string | null, // 개인정보 보호책임자
  insuranceAgentRegNo: null as string | null, // 보험 모집인 등록번호
  funeralInstallmentRegNo: null as string | null, // 상조 선불식 할부거래업 등록번호
};
