-- 회원 관리 고도화 3종 세트: 계정 상태(정지/탈퇴), CS 메모, 관리자 수동 포인트 지급/차감.

-- 1) 회원 탈퇴/정지: 실제 auth.users 삭제는 leads/point_transactions/coupon_redemptions 등
--    여러 테이블의 FK를 깨뜨릴 위험이 커 하지 않는다 — 상태 플래그로 로그인/서비스 이용을
--    막는 방식(soft) 채택. proxy.ts가 매 요청마다 이 값을 확인해 정지/탈퇴 회원을 차단한다.
alter table profiles
  add column status text not null default 'active' check (status in ('active', 'suspended', 'withdrawn'));

-- 2) CS 메모: audit_logs(위변조 방지용 append-only)와 달리 상담 중 자유롭게 남기고 고칠 수 있는
--    작업 메모이므로 update/delete도 관리자에게 허용한다.
create table member_notes (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) not null,
  admin_id uuid references admin_users(id) not null,
  content text not null,
  created_at timestamptz default now()
);

create index member_notes_profile_id_idx on member_notes (profile_id);

alter table member_notes enable row level security;

create policy "member_notes_all_admin" on member_notes
  for all
  using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- 3) 관리자 수동 포인트 지급/차감: point_transactions에는 select 정책만 있고 insert 정책이
--    없다(0015) — 정산 트리거만 security definer로 우회 삽입 가능했다. 원장 조작을 아무 경로로나
--    허용하지 않고, 반드시 이 함수를 통해서만(호출자가 admin_users인지 재확인) 기록하게 한다.
create or replace function fn_admin_adjust_points(p_profile_id uuid, p_amount numeric, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admin_users where admin_users.id = auth.uid()) then
    raise exception 'insufficient_privilege: admin only';
  end if;
  if p_amount = 0 then
    raise exception 'amount must not be zero';
  end if;

  insert into point_transactions (profile_id, amount, reason, reference_table, reference_id)
  values (p_profile_id, p_amount, p_reason, 'admin_manual', auth.uid());
end;
$$;

grant execute on function fn_admin_adjust_points(uuid, numeric, text) to authenticated;
