-- 팝업 관리자 통제 기능 확장(사용자 제안 승인분): 카테고리별 노출 범위, "보지 않기" 기간
-- 커스터마이즈, 노출/클릭 통계. category_id는 banners.category_id와 동일 패턴(null=사이트 전체).

alter table popups add column category_id uuid references categories(id);
alter table popups add column dismiss_days int not null default 1;
alter table popups add column impression_count int not null default 0;
alter table popups add column click_count int not null default 0;

-- 노출/클릭 카운터를 원자적으로 증가시키는 함수. referral_clicks와 동일하게 항상
-- 서비스 롤 키(RLS 우회)로만 호출되므로 anon/authenticated 실행 권한은 제거한다.
create function increment_popup_impression(p_popup_id uuid) returns void as $$
  update popups set impression_count = impression_count + 1 where id = p_popup_id;
$$ language sql;

create function increment_popup_click(p_popup_id uuid) returns void as $$
  update popups set click_count = click_count + 1 where id = p_popup_id;
$$ language sql;

revoke execute on function increment_popup_impression(uuid) from public;
revoke execute on function increment_popup_click(uuid) from public;
