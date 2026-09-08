-- 관리자 "회사 정보" 메뉴 신설: 그동안 lib/business-info.ts에 하드코딩돼 있던 상호/대표자/
-- 사업자등록번호 등 footer·회사소개 페이지 정보를 site_settings 키-값 패턴으로 옮겨 코드
-- 배포 없이 admin에서 수정할 수 있게 한다(§11-4 원칙: 새 키 추가 시 기본값을 함께 심는다).
-- 값은 기존 BUSINESS_INFO 상수와 동일하게 시딩 — 실제 데이터 변경이 아니라 저장 위치 이전.
-- RLS는 0008_site_settings_policies.sql에서 테이블 단위로 이미 적용되어 있어 별도 정책 불필요.
insert into site_settings (key, value) values
  (
    'company_info',
    '{
      "companyName": "플랜파트너스",
      "ceo": "유현",
      "bizRegNo": "176-81-04087",
      "corpRegNo": "110111-0966888",
      "address": "서울특별시 종로구 인사동5길 25, 8층 812호(인사동, 하나로빌딩)",
      "bizType": "도매 및 소매업",
      "bizItem": "전자상거래 소매업",
      "mailOrderRegNo": null,
      "privacyOfficer": null,
      "insuranceAgentRegNo": null,
      "funeralInstallmentRegNo": null,
      "introText": "플랜파트너스는 여러 통신사·보험사·상조회사를 비교해 가장 유리한 조건을 찾아드리는 비교·중개 전문 플랫폼입니다.",
      "disclaimerText": "플랜파트너스는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 상품, 상품정보, 거래에 관한 의무와 책임은 거래당사자에게 있습니다."
    }'
  )
on conflict (key) do nothing;
