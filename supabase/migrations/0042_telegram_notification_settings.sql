-- 관리자가 텔레그램 알림을 종류별로 켜고 끌 수 있게 site_settings 키-값 패턴을 재사용한다
-- (0008/0019/0031/0033과 동일 계열). masterEnabled는 전체 알림을 한 번에 끄는 비상 스위치,
-- types는 알림 종류별(회원가입/여행·유심·휴대폰·상담 신청서 접수) 개별 on/off.
-- RLS는 0008_site_settings_policies.sql에서 테이블 단위로 이미 적용되어 있어 별도 정책 불필요.
insert into site_settings (key, value) values
  (
    'telegram_notifications',
    '{
      "masterEnabled": true,
      "types": {
        "signup": true,
        "travel_lead": true,
        "usim_lead": true,
        "mobile_lead": true,
        "consult_lead": true
      }
    }'
  )
on conflict (key) do nothing;
