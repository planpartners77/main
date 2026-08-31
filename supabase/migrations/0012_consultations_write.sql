-- 0002_rls.sql은 consultations에 select 정책만 두고 insert/update 정책이 없어(공개 상담예약
-- 폼이 아직 없어 쓰기 요구가 없었음) 전체 차단 상태였다. 상담 관리 화면을 만들며 select 정책과
-- 동일하게 leads.category_id를 통해 is_admin_for_category로 스코프한 쓰기 정책을 추가한다.
create policy "consultations_insert_admin" on consultations
  for insert with check (
    exists (
      select 1 from leads
      where leads.id = consultations.lead_id
        and is_admin_for_category(leads.category_id)
    )
  );

create policy "consultations_update_admin" on consultations
  for update using (
    exists (
      select 1 from leads
      where leads.id = consultations.lead_id
        and is_admin_for_category(leads.category_id)
    )
  );
