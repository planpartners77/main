-- 관리자 SEO 메뉴 신설: 검색엔진(구글/네이버) 사이트 소유확인 코드와 노출 설정을
-- site_settings 키-값 패턴으로 저장한다(§11-4 원칙: 새 키 추가 시 기본값을 함께 심는다).
-- RLS는 0008_site_settings_policies.sql에서 테이블 단위로 이미 적용되어 있어 별도 정책 불필요.
insert into site_settings (key, value) values
  (
    'seo',
    '{
      "googleSiteVerification": null,
      "naverSiteVerification": null,
      "metaDescription": null,
      "indexable": true
    }'
  )
on conflict (key) do nothing;
