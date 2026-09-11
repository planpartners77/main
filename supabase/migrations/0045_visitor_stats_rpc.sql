-- statistics/page.tsx가 dayRange(최대 30일)만큼 visitor_logs 원본 행을 통째로 가져와
-- JS에서 Map/Set으로 일별 집계하고 있었다(현재 하루 약 4,600건 → 30일이면 약 138,000행).
-- admin_statistics_summary()/coupon_redemption_counts()(0038)와 동일한 패턴으로 일별
-- 순 방문자/조회수 집계를 DB로 옮긴다.
create or replace function public.admin_visitor_stats(p_day_range int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  start_day date;
begin
  if not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  start_day := current_date - (p_day_range - 1);

  with days as (
    select generate_series(start_day::timestamp, current_date::timestamp, interval '1 day')::date as day_start
  ),
  range_logs as (
    select visitor_id, created_at::date as day
    from visitor_logs
    where created_at >= start_day
  ),
  daily_unique as (
    select d.day_start, count(distinct rl.visitor_id) as cnt
    from days d
    left join range_logs rl on rl.day = d.day_start
    group by d.day_start
  ),
  daily_pageviews as (
    select d.day_start, count(rl.visitor_id) as cnt
    from days d
    left join range_logs rl on rl.day = d.day_start
    group by d.day_start
  )
  select jsonb_build_object(
    'daily_unique', (
      select coalesce(jsonb_agg(jsonb_build_object('key', to_char(day_start, 'YYYY-MM-DD'), 'value', cnt) order by day_start), '[]'::jsonb)
      from daily_unique
    ),
    'daily_pageviews', (
      select coalesce(jsonb_agg(jsonb_build_object('key', to_char(day_start, 'YYYY-MM-DD'), 'value', cnt) order by day_start), '[]'::jsonb)
      from daily_pageviews
    ),
    'today_unique_count', (select count(distinct visitor_id) from range_logs where day = current_date),
    'today_pageview_count', (select count(*) from range_logs where day = current_date),
    'period_unique_count', (select count(distinct visitor_id) from range_logs)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_visitor_stats(int) from public;
grant execute on function public.admin_visitor_stats(int) to authenticated;
