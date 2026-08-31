-- 디자인관리 3단계: 페이지관리(홈 섹션 on/off·카피) + 카테고리 진열순서 + SNS 관리.
-- 신규 테이블 없이 기존 site_settings 키-값 패턴을 재사용한다(§11-1 "그대로 채택").
-- 0003_rls_gaps.sql에서 RLS는 켰지만 정책이 없어 전체 차단 상태였으므로 이번에 추가한다.
-- §11-4 원칙: 새 키를 추가할 때는 반드시 같은 마이그레이션에서 기본값을 함께 심는다.

insert into site_settings (key, value) values
  (
    'category_order',
    '{"order": ["travel","internet","mobile","rental","insurance","funeral"]}'
  ),
  (
    'sns_links',
    '{"links": [
      {"platform":"naver_cafe","label":"네이버 카페","url":null,"enabled":false},
      {"platform":"facebook","label":"페이스북","url":null,"enabled":false},
      {"platform":"youtube","label":"유튜브","url":null,"enabled":false},
      {"platform":"instagram","label":"인스타그램","url":null,"enabled":false},
      {"platform":"tiktok","label":"틱톡","url":null,"enabled":false}
    ]}'
  ),
  (
    'home_page',
    '{
      "heroTagline": "비교하지 않으면 놓치는 혜택",
      "heroHeadline": "대신 비교하고,\n더 유리한 조건을 찾아드려요",
      "heroSubcopy": "인터넷·휴대폰·가전렌탈·보험·상조, 다섯 개 카테고리를 한 곳에서 비교하세요.",
      "sections": {"incentive": true, "trust": true, "reviews": true, "popular": true, "why": true, "cta": true}
    }'
  )
on conflict (key) do nothing;

-- 공개 사이트가 anon 키로 위 설정을 읽어야 하므로 select는 전체 공개, 쓰기는 관리자만
-- (products_select_active + products_write_admin과 동일한 계열의 패턴).
create policy "site_settings_select_public" on site_settings
  for select using (true);
create policy "site_settings_write_admin" on site_settings
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));
