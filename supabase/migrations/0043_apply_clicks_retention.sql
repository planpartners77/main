-- "신청하기" 클릭 이력(apply_clicks)은 사이트 전체 공통으로 최대 30일치만 보관하고
-- 이후에는 순차 삭제한다(카테고리별 예외 없음). 클릭 로그는 신청서(leads)와 달리 법적/CS
-- 근거로 장기 보관할 필요가 없고, 계속 쌓이면 관리자 화면 조회 성능도 떨어지므로
-- pg_cron으로 매일 새벽 배치 삭제한다 — 앱 배포 여부와 무관하게 DB 레벨에서 항상 동작한다.
create extension if not exists pg_cron with schema extensions;

-- 같은 이름으로 재실행(마이그레이션 재적용)해도 pg_cron이 기존 잡을 갱신하므로 중복 생성되지 않는다.
select cron.schedule(
  'purge-apply-clicks-30d',
  '0 3 * * *',
  $$ delete from public.apply_clicks where created_at < now() - interval '30 days'; $$
);
