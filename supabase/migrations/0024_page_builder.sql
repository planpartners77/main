-- 페이지 관리 고도화: "페이지"(pages) + "섹션"(page_sections)으로 구성하는 범용 페이지 빌더.
-- 지금까지 홈페이지 하나만 site_settings.home_page(§0018 이전 방식)로 편집 가능했던 것을,
-- 여러 페이지를 만들고 각 페이지를 레이어(섹션) 단위로 조립할 수 있는 구조로 확장한다.
-- 섹션 타입별 렌더링/설정폼은 코드(lib/design/page-sections.ts)의 레지스트리가 담당하고,
-- 이 테이블은 "어떤 페이지에 어떤 타입의 섹션이 어떤 순서·설정으로 켜져 있는지"만 저장한다.
-- RLS는 0018_content_management.sql의 notices/events/reviews와 동일한 3정책 패턴을 그대로 따른다:
--   공개 select(공개 조건) / 관리자 전체 select / super_admin·content_manager만 쓰기.

create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  template text not null default 'blank',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table pages enable row level security;
create policy "pages_select_public" on pages
  for select using (status = 'published');
create policy "pages_select_admin_all" on pages
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "pages_write_content_admin" on pages
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

create table page_sections (
  id bigint generated always as identity primary key,
  page_id uuid not null references pages(id) on delete cascade,
  type text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index page_sections_page_id_idx on page_sections (page_id, sort_order);
alter table page_sections enable row level security;
create policy "page_sections_select_public" on page_sections
  for select using (
    is_active = true
    and exists (select 1 from pages where pages.id = page_sections.page_id and pages.status = 'published')
  );
create policy "page_sections_select_admin_all" on page_sections
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "page_sections_write_content_admin" on page_sections
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

-- 기존 site_settings.home_page 값을 그대로 'home' 페이지로 이관해, 관리자가 이미 설정해 둔
-- 히어로 카피/섹션 on-off가 초기화되지 않게 한다. 값이 없으면 기존 DEFAULT_HOME_PAGE_SETTINGS와
-- 동일한 기본값으로 채운다(lib/design/site-settings.ts 참고).
do $$
declare
  v_home jsonb;
  v_page_id uuid;
begin
  select value into v_home from site_settings where key = 'home_page';
  if v_home is null then
    v_home := jsonb_build_object(
      'heroTagline', '비교하지 않으면 놓치는 혜택',
      'heroHeadline', E'대신 비교하고,\n더 유리한 조건을 찾아드려요',
      'heroSubcopy', '인터넷·휴대폰·가전렌탈·보험·상조, 다섯 개 카테고리를 한 곳에서 비교하세요.',
      'sections', jsonb_build_object(
        'incentive', true, 'trust', true, 'reviews', true, 'popular', true, 'why', true, 'cta', true
      )
    );
  end if;

  insert into pages (slug, title, template, status)
  values ('home', '홈', 'home', 'published')
  returning id into v_page_id;

  insert into page_sections (page_id, type, sort_order, is_active, config) values
    (v_page_id, 'hero', 0, true, jsonb_build_object(
      'tagline', coalesce(v_home->>'heroTagline', ''),
      'headline', coalesce(v_home->>'heroHeadline', ''),
      'subcopy', coalesce(v_home->>'heroSubcopy', '')
    )),
    (v_page_id, 'banner_strip', 1, true, '{}'::jsonb),
    (v_page_id, 'category_nav', 2, true, '{}'::jsonb),
    (v_page_id, 'incentive', 3, coalesce((v_home #>> '{sections,incentive}')::boolean, true), '{}'::jsonb),
    (v_page_id, 'trust_points', 4, coalesce((v_home #>> '{sections,trust}')::boolean, true), '{}'::jsonb),
    (v_page_id, 'reviews', 5, coalesce((v_home #>> '{sections,reviews}')::boolean, true), '{}'::jsonb),
    (v_page_id, 'product_display', 6, coalesce((v_home #>> '{sections,popular}')::boolean, true), jsonb_build_object(
      'title', '누적 기록이 만든 인기 상품', 'mode', 'latest', 'categoryIds', '[]'::jsonb, 'productIds', '[]'::jsonb, 'limit', 6
    )),
    (v_page_id, 'why_steps', 7, coalesce((v_home #>> '{sections,why}')::boolean, true), '{}'::jsonb),
    (v_page_id, 'cta', 8, coalesce((v_home #>> '{sections,cta}')::boolean, true), '{}'::jsonb);
end $$;
