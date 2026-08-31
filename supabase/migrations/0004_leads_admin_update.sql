-- 0002_rls.sql은 leads에 select/insert 정책만 두어, 관리자 페이지에서 리드 상태를
-- 변경(접수 -> 상담중 -> 완료 등)하려는 update가 RLS에 막혀 전부 실패하는 상태였다.
-- products_write_admin과 동일한 패턴으로 담당 카테고리 관리자(또는 super_admin)에게만 허용한다.
create policy "leads_update_admin" on leads
  for update using (is_admin_for_category(category_id)) with check (is_admin_for_category(category_id));
