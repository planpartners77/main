-- referral_codes/referral_clicks/referral_conversions는 0003_rls_gaps.sql에서 RLS만 켜고
-- 정책이 없어 전체 차단 상태였다. 이번에 추천인코드 관리 기능을 구현하며 관리자 전용 정책을
-- 연다. 공개(anon) 클릭 기록/전환 기록은 RLS를 열지 않고 서비스 롤 키를 쓰는 /api/referral
-- 라우트(lib/supabase/admin.ts)를 통해서만 쓰도록 한다 — 추천인 코드/집계 데이터를 anon에게
-- 노출할 필요가 없고, 클릭당 카운트 증가가 원자적이어야 하기 때문이다.

create policy "referral_codes_admin_all" on referral_codes
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

create policy "referral_clicks_admin_all" on referral_clicks
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

create policy "referral_conversions_admin_all" on referral_conversions
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- 클릭/전환 집계 카운터를 원자적으로 증가시키는 함수. 항상 서비스 롤 키(RLS 우회)로만
-- 호출되므로 anon/authenticated의 실행 권한은 명시적으로 제거한다.
create function increment_referral_click(p_code_id uuid) returns void as $$
  update referral_codes set total_clicks = total_clicks + 1 where id = p_code_id;
$$ language sql;

create function increment_referral_conversion(p_code_id uuid) returns void as $$
  update referral_codes set total_registrations = total_registrations + 1 where id = p_code_id;
$$ language sql;

revoke execute on function increment_referral_click(uuid) from public;
revoke execute on function increment_referral_conversion(uuid) from public;
