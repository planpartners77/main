-- 간편로그인 관리 > 로그인 유도 팝업(LoginPromptPopup)의 "닫기" 버튼을 몇 초 뒤에 노출할지
-- 관리자가 조절할 수 있게 site_settings.login_methods(0033) 값에 필드를 추가한다.
-- 기본값 0은 기존 동작(즉시 닫기 버튼 노출)과 동일하므로 기존 사이트 동작은 바뀌지 않는다.
update site_settings
set value = value || '{"popupCloseButtonDelaySeconds": 0}'::jsonb
where key = 'login_methods'
  and not (value ? 'popupCloseButtonDelaySeconds');
