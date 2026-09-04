-- 관리자 등급이 10종으로 늘어나면서(0021) profiles_update_admin(0014)/member_notes_all_admin(0022)/
-- fn_admin_adjust_points(0022)가 여전히 "admin_users에 행이 존재하기만 하면" 통과되는 블랑켓
-- 조건으로 남아 있었다. 화면(AdminSidebar/proxy.ts)은 "members" 메뉴를 super_admin/member_manager
-- 등급에게만 보여주지만, RLS/RPC는 등급을 구분하지 않아 viewer·product_manager 등 회원 관리
-- 권한이 없는 등급도 브라우저 콘솔에서 supabase.from("profiles").update(...) 등을 직접 호출하면
-- 회원 정지/등급변경/포인트 지급 같은 최고관리자·회원담당 전용 작업을 그대로 수행할 수 있는
-- 구멍이었다. lib/admin/permissions.ts의 "members" 메뉴 보유 등급과 동일하게 DB 레벨에서도
-- super_admin/member_manager로 좁혀, 화면 숨김과 별개로 RLS 자체가 이중 방어선이 되게 한다.
-- (읽기 전용 profiles_select_admin(0005)은 대시보드/통계 등 다른 등급도 집계 조회가 필요해 그대로 둔다.)

drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles
  for update using (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
        and admin_users.role in ('super_admin', 'member_manager')
    )
  );

drop policy if exists "member_notes_all_admin" on member_notes;
create policy "member_notes_all_admin" on member_notes
  for all
  using (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
        and admin_users.role in ('super_admin', 'member_manager')
    )
  )
  with check (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
        and admin_users.role in ('super_admin', 'member_manager')
    )
  );

create or replace function fn_admin_adjust_points(p_profile_id uuid, p_amount numeric, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from admin_users
    where admin_users.id = auth.uid()
      and admin_users.role in ('super_admin', 'member_manager')
  ) then
    raise exception 'insufficient_privilege: member_manager or super_admin only';
  end if;
  if p_amount = 0 then
    raise exception 'amount must not be zero';
  end if;

  insert into point_transactions (profile_id, amount, reason, reference_table, reference_id)
  values (p_profile_id, p_amount, p_reason, 'admin_manual', auth.uid());
end;
$$;
