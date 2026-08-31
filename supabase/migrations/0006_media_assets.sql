-- 디자인관리 1단계: 이미지(미디어 라이브러리) 인프라 (가이드 §9-1/§11-1 "디자인 통합관리 탭" 중 첫 구현)
-- products/partners는 "업로드 저장소 없이 외부 URL만 참조"하는 방침(호스팅 비용 절감)이지만,
-- 배너·팝업처럼 관리자가 직접 소량 큐레이션하는 이미지는 성격이 달라 Storage 버킷을 새로 연다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-assets', 'design-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references admin_users(id),
  created_at timestamptz default now()
);

alter table media_assets enable row level security;

-- 메타데이터 테이블은 관리자만 조회/등록/삭제 (profiles_select_admin과 동일한 취지)
create policy "media_assets_admin_all" on media_assets
  for all using (exists (select 1 from admin_users where admin_users.id = auth.uid()))
  with check (exists (select 1 from admin_users where admin_users.id = auth.uid()));

-- Storage 오브젝트: 배너/팝업 등에서 공개 사이트가 그대로 읽어야 하므로 다운로드는 누구나,
-- 업로드·삭제는 관리자만 허용한다.
create policy "design_assets_public_read" on storage.objects
  for select using (bucket_id = 'design-assets');

create policy "design_assets_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'design-assets'
    and exists (select 1 from admin_users where admin_users.id = auth.uid())
  );

create policy "design_assets_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'design-assets'
    and exists (select 1 from admin_users where admin_users.id = auth.uid())
  );
