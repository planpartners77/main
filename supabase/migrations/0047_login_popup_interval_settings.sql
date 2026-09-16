-- 간편로그인 관리 > 로그인 유도 팝업(LoginPromptPopup) 노출 주기를 관리자가 조절할 수 있게
-- site_settings.login_methods(0033_kakao_sync_login.sql에서 생성) 값에 필드를 추가한다.
-- 기존 하드코딩 값(즉시 노출)은 유지하고, 반복 주기만 너무 잦았던 10초에서 1분으로 완화해
-- 기본값으로 심는다(lib/design/site-settings.ts의 DEFAULT_LOGIN_METHODS_SETTINGS와 동일).
update site_settings
set value = value || '{"popupFirstDelaySeconds": 0, "popupRepeatMinutes": 1}'::jsonb
where key = 'login_methods'
  and not (value ? 'popupRepeatMinutes');
