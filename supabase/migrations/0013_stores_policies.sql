-- stores는 0003_rls_gaps.sql에서 RLS만 켜고 정책이 없어 전체 차단 상태였다(§11-3 원칙대로
-- 실제 기능 구현 시점에 정책 추가). 매장 위치는 카테고리처럼 공개 정보이므로 조회는 누구나,
-- 쓰기는 관리자만 허용하는 banners/popups와 동일한 패턴을 사용한다(카테고리 단일 소유가 아니라
-- supported_categories jsonb 배열이라 is_admin_for_category 스코프는 적용하지 않음).
create policy "stores_select_public" on stores
  for select using (true);

create policy "stores_write_admin" on stores
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid())
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid())
  );
