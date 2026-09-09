-- 추천인 코드/클릭/전환 로그가 쌓일수록 관리자 페이지가 느려지는 두 가지 문제를 해결한다.
-- 1) referral_clicks.code_id / referral_conversions.code_id / leads.referral_code_id에
--    인덱스가 없어 코드별 집계 쿼리가 전부 순차 스캔(Seq Scan)이었다.
-- 2) app/admin/(dashboard)/referrals/page.tsx가 로그 원본 행을 통째로 가져와 JS에서
--    Map으로 집계했다 — 로그가 누적될수록 DB→서버→브라우저로 옮기는 데이터량이
--    선형으로 늘어난다. 이를 DB 쪽 group by로 옮겨 집계된 결과만 반환하게 한다.

create index referral_clicks_code_id_idx on referral_clicks (code_id);
create index referral_conversions_code_id_idx on referral_conversions (code_id);
create index leads_referral_code_id_idx on leads (referral_code_id) where referral_code_id is not null;

-- LeadStatusSelect.recordCompletionConversion()의 중복 방지 체크
-- (`.eq("lead_id", leadId).eq("conversion_type", "completed")`)가 사용하는 조합.
create index referral_conversions_lead_id_type_idx on referral_conversions (lead_id, conversion_type);

-- 코드별 클릭수/등록전환수/주요 채널을 DB에서 한 번에 집계해 반환한다.
-- mobile_plan_lead_counts()와 동일하게 security definer로 만들되, 저 함수는 공개
-- 페이지용이라 anon에게 열려 있는 반면 이 함수는 추천인 코드/채널별 실적이라는
-- 관리자 전용 데이터를 다루므로 함수 내부에서 admin_users 소속을 직접 확인한다
-- (RLS를 우회하는 security definer 함수이므로 이 체크가 없으면 아무 로그인 사용자나
-- 전체 파트너 실적을 조회할 수 있게 된다).
create or replace function public.referral_code_stats(p_code_ids uuid[])
returns table (
  code_id uuid,
  click_count bigint,
  registration_count bigint,
  top_channel text,
  top_channel_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
  with target as (
    select unnest(p_code_ids) as id
  ),
  clicks as (
    select rc.code_id, count(*) as click_count
    from referral_clicks rc
    where rc.code_id = any(p_code_ids)
    group by rc.code_id
  ),
  conversions as (
    select rcv.code_id, count(*) as registration_count
    from referral_conversions rcv
    where rcv.code_id = any(p_code_ids) and rcv.conversion_type = 'registration'
    group by rcv.code_id
  ),
  channel_counts as (
    select
      l.referral_code_id as code_id,
      coalesce(l.utm_medium, '(미기록)') as channel,
      count(*) as channel_count
    from leads l
    where l.referral_code_id = any(p_code_ids)
    group by l.referral_code_id, coalesce(l.utm_medium, '(미기록)')
  ),
  ranked_channels as (
    select
      code_id, channel, channel_count,
      row_number() over (partition by code_id order by channel_count desc) as rn
    from channel_counts
  )
  select
    target.id as code_id,
    coalesce(clicks.click_count, 0) as click_count,
    coalesce(conversions.registration_count, 0) as registration_count,
    ranked_channels.channel as top_channel,
    ranked_channels.channel_count as top_channel_count
  from target
  left join clicks on clicks.code_id = target.id
  left join conversions on conversions.code_id = target.id
  left join ranked_channels on ranked_channels.code_id = target.id and ranked_channels.rn = 1;
end;
$$;

revoke execute on function public.referral_code_stats(uuid[]) from public;
grant execute on function public.referral_code_stats(uuid[]) to authenticated;
