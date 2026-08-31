-- Phase 1: 등급을 3단계(일반/실버/골드)에서 10단계로 확장 시드.
-- 이전까지 customer_tiers가 완전히 비어 있어(0001에 컬럼만 있고 seed insert가 없었음)
-- 관리자 회원수정 화면의 등급 드롭다운이 빈 선택지였다.
insert into customer_tiers (name, point_earn_rate, badge_color) values
  ('브론즈', 0.5, '#A97142'),
  ('실버', 0.8, '#B0B0B0'),
  ('골드', 1.2, '#D4AF37'),
  ('플래티넘', 1.5, '#8FA6CB'),
  ('사파이어', 2.0, '#2E5AAC'),
  ('에메랄드', 2.5, '#2E8B57'),
  ('루비', 3.0, '#C0392B'),
  ('다이아몬드', 3.5, '#4FD3E0'),
  ('마스터', 4.5, '#6A0DAD'),
  ('VIP', 5.0, '#1B2A4A');

-- Phase 2: 포인트 원장. profiles에 잔액 컬럼을 별도로 두지 않고 항상 이 테이블의 합계로
-- 계산한다 — 잔액 컬럼과 원장이 서로 어긋나는 이중부기 버그를 애초에 만들지 않기 위함.
create table point_transactions (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) not null,
  amount numeric not null,
  reason text not null,
  reference_table text,
  reference_id uuid,
  created_at timestamptz default now()
);

alter table point_transactions enable row level security;

create policy "point_transactions_select_own" on point_transactions
  for select using (auth.uid() = profile_id);

create policy "point_transactions_select_admin" on point_transactions
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- settlements가 'paid'로 바뀌는 순간 회원 등급의 point_earn_rate로 자동 적립한다.
-- customer_tiers.point_earn_rate는 0001부터 있었지만 이걸 실제로 읽어서 쓰는 곳이 지금까지
-- 전혀 없었다(§11-3의 "죽은 필드" 경고 대상) — 이 트리거가 그 필드를 처음으로 살리는 지점.
-- security definer로 만들어 RLS(point_transactions는 본인/관리자 select만 허용)를 우회해 삽입한다.
create or replace function fn_award_points_on_settlement_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_rate numeric;
  v_amount numeric;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and new.lead_id is not null then
    select leads.user_id into v_user_id from leads where leads.id = new.lead_id;

    if v_user_id is not null then
      select customer_tiers.point_earn_rate into v_rate
      from profiles
      join customer_tiers on customer_tiers.id = profiles.tier_id
      where profiles.id = v_user_id;

      if v_rate is not null and v_rate > 0 then
        v_amount := round(new.amount * v_rate / 100);
        if v_amount > 0 then
          insert into point_transactions (profile_id, amount, reason, reference_table, reference_id)
          values (v_user_id, v_amount, '정산 지급 적립', 'settlements', new.id);
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_award_points_on_settlement_paid
  after update on settlements
  for each row
  execute function fn_award_points_on_settlement_paid();
