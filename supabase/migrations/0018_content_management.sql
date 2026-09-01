-- 디자인관리 확장: 카테고리관리(트리 CRUD) + 공지사항 + 이벤트 + 약관 오버라이드 + 후기.
-- categories는 지금까지 lib/categories.ts에 하드코딩된 트리(하위카테고리 포함)를 그대로
-- DB로 옮겨 관리자가 추가/숨김/순서 변경을 할 수 있게 한다. 기존 슬러그·href는 그대로
-- 보존해 실제 페이지 라우팅이 깨지지 않게 한다.

alter table categories add column parent_id uuid references categories(id);
alter table categories add column sort_order int not null default 0;
alter table categories add column href text; -- 최상위는 /{slug}로 코드에서 유도, 하위는 기존 라우팅과
                                               -- 다를 수 있어(예: '에듀'는 /travel을 그대로 가리킴) 명시 저장

-- 슬러그는 지금까지 테이블 전체에서 유일해야 했지만, 하위카테고리가 생기면 다른 상위
-- 카테고리 밑에서 같은 슬러그를 쓸 수 있어야 하므로 "형제 사이에서만 유일"로 완화한다.
alter table categories drop constraint categories_slug_key;
create unique index categories_slug_unique_within_parent
  on categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

update categories set sort_order = 0 where slug = 'travel';
update categories set sort_order = 1 where slug = 'internet';
update categories set sort_order = 2 where slug = 'mobile';
update categories set sort_order = 3 where slug = 'rental';
update categories set sort_order = 4 where slug = 'insurance';
update categories set sort_order = 5 where slug = 'funeral';

insert into categories (slug, name, track_type, regulation_level, parent_id, sort_order, href, is_active)
select 'general', '여행', 'self_service', 'low', id, 0, '/travel/general', true
from categories where slug = 'travel' and parent_id is null
union all
select 'edu', '에듀', 'self_service', 'low', id, 1, '/travel', true
from categories where slug = 'travel' and parent_id is null;

insert into categories (slug, name, track_type, regulation_level, parent_id, sort_order, href, is_active)
select 'english-camp', '영어캠프', 'self_service', 'low', id, 0, '/travel', true
from categories where slug = 'edu' and parent_id = (select id from categories where slug = 'travel' and parent_id is null)
union all
select 'video-english', '화상영어', 'self_service', 'low', id, 1, '/travel/video-english', true
from categories where slug = 'edu' and parent_id = (select id from categories where slug = 'travel' and parent_id is null);

-- 공지사항
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz default now()
);
alter table notices enable row level security;
create policy "notices_select_public" on notices
  for select using (is_active = true and published_at <= now());
create policy "notices_select_admin_all" on notices
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "notices_write_content_admin" on notices
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

-- 이벤트
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
alter table events enable row level security;
create policy "events_select_public" on events
  for select using (is_active = true);
create policy "events_select_admin_all" on events
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "events_write_content_admin" on events
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

-- 약관 오버라이드: lib/legal-content.ts의 초안 문구가 기본값이고, 법무 검토가 끝난 문서만
-- 여기 행을 만들어 덮어쓴다(행이 없으면 화면은 기존 초안을 그대로 보여준다).
create table legal_docs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  intro text not null,
  sections jsonb not null default '[]',
  updated_at timestamptz default now()
);
alter table legal_docs enable row level security;
create policy "legal_docs_select_public" on legal_docs
  for select using (true);
create policy "legal_docs_write_content_admin" on legal_docs
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );

-- 후기: 표시광고법 리스크 때문에 임의로 채우지 않고 빈 테이블로 시작한다. 실제 후기가
-- 접수되면 관리자가 검수 후 is_active=true로 승인해 공개한다.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  author_label text not null,
  rating int check (rating between 1 and 5),
  body text not null,
  is_active boolean not null default false,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
create policy "reviews_select_public_active" on reviews
  for select using (is_active = true);
create policy "reviews_select_admin_all" on reviews
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));
create policy "reviews_write_content_admin" on reviews
  for all using (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  )
  with check (
    exists (select 1 from admin_users where admin_users.id = auth.uid() and role in ('super_admin', 'content_manager'))
  );
