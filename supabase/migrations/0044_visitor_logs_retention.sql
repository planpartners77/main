-- visitor_logs는 매 페이지 요청마다 proxy.ts가 기록하는 접속 로그라 다른 어떤 테이블보다도
-- 빠르게 쌓인다(하루 약 4,600건, 연 환산 약 168만 건). apply_clicks처럼 신청서 근거로 쓰이는
-- 데이터가 아니라 통계 화면의 최근 접속자/일별 추이용일 뿐이라 장기 보관할 이유가 없고,
-- 이미 DB 전체 용량의 대부분(약 7MB 중 6.8MB)을 이 테이블 하나가 차지하고 있다. 통계 화면이
-- 최대 30일 범위까지만 조회하므로(DAY_RANGE_OPTIONS) 여유를 두고 60일 보관 후 삭제한다.
select cron.schedule(
  'purge-visitor-logs-60d',
  '0 3 * * *',
  $$ delete from public.visitor_logs where created_at < now() - interval '60 days'; $$
);

-- visitor_id 인덱스는 pg_stat_user_indexes 기준 idx_scan=0이었고, 코드상으로도 visitor_id는
-- WHERE 조건이 아니라 JS에서 Set으로 중복 제거하는 용도로만 읽힌다(통계 페이지 admin_visitor_stats
-- RPC 전환 이후로도 동일). 448KB(pkey)+392KB(이 인덱스)가 매 insert마다 갱신 비용만 유발하므로 제거한다.
drop index if exists visitor_logs_visitor_id_idx;
