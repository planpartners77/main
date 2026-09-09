-- 조사 결과 두 가지 문제를 추가로 발견해 이번에 같이 반영한다.
--
-- 1) FK 컬럼인데 인덱스가 없어서, 데이터가 쌓일수록 해당 컬럼으로 필터링하는 쿼리가
--    순차 스캔이 되는 컬럼들. (Postgres는 FK 제약을 걸어도 참조하는 쪽 컬럼에는 자동으로
--    인덱스를 만들어주지 않는다 — referral_code_stats 때와 동일한 문제.)
--    leads.status / leads.user_id, point_transactions.profile_id(RLS 정책에도 쓰임),
--    visitor_logs.user_id, coupon_redemptions.profile_id(RLS 정책에도 쓰임),
--    audit_logs(target_table, target_id)(회원 상세 페이지를 열 때마다 조회+삽입이 같이
--    일어나 조회량과 데이터량이 함께 느는 테이블), settlements(status, partner_id),
--    profiles(tier_id, status, referral_role).
--
-- 2) app/admin/(dashboard)/statistics/page.tsx와 coupons/page.tsx가 leads/profiles/
--    settlements/coupon_redemptions/referral_clicks/referral_conversions 원본 행을
--    통째로 가져와 JS에서 Map/reduce로 집계하고 있었다 — referrals 페이지에서 고친 것과
--    동일한 문제. group by 집계를 DB 함수로 옮긴다.

create index leads_status_idx on leads (status);
create index leads_user_id_idx on leads (user_id) where user_id is not null;
create index point_transactions_profile_id_idx on point_transactions (profile_id);
create index visitor_logs_user_id_idx on visitor_logs (user_id) where user_id is not null;
create index coupon_redemptions_profile_id_idx on coupon_redemptions (profile_id);
create index audit_logs_target_idx on audit_logs (target_table, target_id);
create index settlements_status_idx on settlements (status);
create index settlements_partner_id_idx on settlements (partner_id);
create index profiles_tier_id_idx on profiles (tier_id) where tier_id is not null;
create index profiles_status_idx on profiles (status);
create index profiles_referral_role_idx on profiles (referral_role);

-- 쿠폰별 사용 횟수. coupons/page.tsx와 statistics/page.tsx 둘 다에서 재사용한다.
-- coupon_redemptions에는 이미 (coupon_id, lead_id) unique index가 있어(coupon_id가
-- 선두 컬럼) 이 group by에 별도 인덱스가 필요 없다.
create or replace function public.coupon_redemption_counts()
returns table (coupon_id uuid, redemption_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
    select cr.coupon_id, count(*)::bigint as redemption_count
    from coupon_redemptions cr
    group by cr.coupon_id;
end;
$$;

revoke execute on function public.coupon_redemption_counts() from public;
grant execute on function public.coupon_redemption_counts() to authenticated;

-- 통계 페이지의 "리드/회원/정산/추천인" 섹션이 필요로 하는 집계를 한 번의 호출로 반환한다.
-- 이 네 테이블(leads/profiles/settlements/referral_clicks·conversions)은 사용자 활동에
-- 비례해 계속 커지는 테이블이라 원본 행을 그대로 가져오면 안 되고, products/partners/
-- reviews/coupons처럼 관리자가 직접 등록하는 소규모 카탈로그 테이블은 기존처럼 그대로
-- fetch해서 화면에서 집계해도 무방하므로 이번 변경 대상에서 제외했다.
create or replace function public.admin_statistics_summary(p_month_range int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  start_month date;
begin
  if not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  start_month := (date_trunc('month', now()) - ((p_month_range - 1) || ' months')::interval)::date;

  with months as (
    select generate_series(start_month::timestamp, date_trunc('month', now()), interval '1 month')::date as month_start
  ),
  lead_status_counts as (
    select status, count(*) as cnt from leads group by status
  ),
  lead_category_counts as (
    select coalesce(c.name, '미분류') as label, count(*) as cnt
    from leads l left join categories c on c.id = l.category_id
    group by coalesce(c.name, '미분류')
  ),
  lead_monthly as (
    select m.month_start, count(l.id) as cnt
    from months m
    left join leads l on date_trunc('month', l.created_at)::date = m.month_start
    group by m.month_start
  ),
  profile_monthly as (
    select m.month_start, count(p.id) as cnt
    from months m
    left join profiles p on date_trunc('month', p.created_at)::date = m.month_start
    group by m.month_start
  ),
  profile_tier_counts as (
    select coalesce(t.name, '일반') as label, count(*) as cnt
    from profiles p left join customer_tiers t on t.id = p.tier_id
    group by coalesce(t.name, '일반')
  ),
  settlement_status_amount as (
    select status, coalesce(sum(amount), 0) as amt from settlements group by status
  ),
  settlement_monthly as (
    select m.month_start, coalesce(sum(s.amount), 0) as amt
    from months m
    left join settlements s on date_trunc('month', s.created_at)::date = m.month_start
    group by m.month_start
  ),
  settlement_partner_amount as (
    select coalesce(pt.name, '미지정') as label, coalesce(sum(s.amount), 0) as amt
    from settlements s left join partners pt on pt.id = s.partner_id
    group by coalesce(pt.name, '미지정')
  ),
  referral_counts as (
    select
      rc.id as code_id,
      coalesce(clicks.cnt, 0) as clicks,
      coalesce(conv.cnt, 0) as conversions
    from referral_codes rc
    left join (select code_id, count(*) as cnt from referral_clicks group by code_id) clicks
      on clicks.code_id = rc.id
    left join (
      select code_id, count(*) as cnt from referral_conversions
      where conversion_type = 'registration' group by code_id
    ) conv on conv.code_id = rc.id
  )
  select jsonb_build_object(
    'leads_total', (select count(*) from leads),
    'leads_by_status', (select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb) from lead_status_counts),
    'leads_by_category', (select coalesce(jsonb_object_agg(label, cnt), '{}'::jsonb) from lead_category_counts),
    'leads_monthly', (
      select coalesce(jsonb_agg(jsonb_build_object('key', to_char(month_start, 'YYYY-MM'), 'value', cnt) order by month_start), '[]'::jsonb)
      from lead_monthly
    ),
    'profiles_total', (select count(*) from profiles),
    'profiles_monthly', (
      select coalesce(jsonb_agg(jsonb_build_object('key', to_char(month_start, 'YYYY-MM'), 'value', cnt) order by month_start), '[]'::jsonb)
      from profile_monthly
    ),
    'profiles_by_tier', (select coalesce(jsonb_object_agg(label, cnt), '{}'::jsonb) from profile_tier_counts),
    'profiles_marketing_opted_in', (select count(*) from profiles where marketing_opt_in),
    'settlements_total_amount', (select coalesce(sum(amount), 0) from settlements),
    'settlements_by_status_amount', (select coalesce(jsonb_object_agg(status, amt), '{}'::jsonb) from settlement_status_amount),
    'settlements_monthly_amount', (
      select coalesce(jsonb_agg(jsonb_build_object('key', to_char(month_start, 'YYYY-MM'), 'value', amt) order by month_start), '[]'::jsonb)
      from settlement_monthly
    ),
    'settlements_by_partner_amount', (select coalesce(jsonb_object_agg(label, amt), '{}'::jsonb) from settlement_partner_amount),
    'referral_counts', (
      select coalesce(jsonb_object_agg(code_id, jsonb_build_object('clicks', clicks, 'conversions', conversions)), '{}'::jsonb)
      from referral_counts
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_statistics_summary(int) from public;
grant execute on function public.admin_statistics_summary(int) to authenticated;
