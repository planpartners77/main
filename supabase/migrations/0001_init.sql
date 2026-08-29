-- 플랜파트너스 초기 스키마 (가이드 §10-2)
-- Supabase SQL Editor에서 이 파일 전체를 한 번에 실행하거나 `supabase db push`로 적용한다.
-- 주의: 가이드 원문의 테이블 선언 순서를 그대로 따르면 profiles→customer_tiers,
-- leads→referral_codes, consultations→admin_users처럼 아직 존재하지 않는 테이블을
-- 참조하는 순서라 실행이 실패한다. 아래는 외래키 의존성 순서로 재정렬한 버전이다.

-- 고객 등급 (관리자 권한과 완전히 분리 — §11 참고)
create table customer_tiers (
  id uuid primary key default gen_random_uuid(),
  name text,                          -- 일반 / 실버 / 골드
  point_earn_rate numeric default 0,
  badge_color text,
  perks jsonb default '{}'            -- 카테고리별 우대 혜택(예: 보험 상담 우선배정)
);

-- Supabase Auth의 auth.users를 확장하는 관례
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  phone text,
  tier_id uuid references customer_tiers(id),
  marketing_opt_in boolean default false,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'internet' | 'mobile' | 'rental' | 'insurance' | 'funeral'
  name text not null,
  track_type text not null check (track_type in ('self_service','consult_required')),
  regulation_level text not null check (regulation_level in ('low','medium','high')),
  is_active boolean default true
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  biz_reg_no text,
  settlement_rate numeric,
  contract_status text default 'active'
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  partner_id uuid references partners(id),
  title text not null,
  base_price numeric,
  incentive_min numeric,   -- 비회원에게 보여줄 범위값 하한
  incentive_max numeric,   -- 비회원에게 보여줄 범위값 상한
  incentive_exact numeric, -- 로그인 후에만 노출
  extra jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table admin_users (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('super_admin','category_manager','cs_agent','settlement_manager','content_manager')),
  managed_categories jsonb default '[]'
);

-- 추천인 코드 (다단계 트리 — §11 Bizmobile 분석에서 채택). parent_code_id/root_code_id는 자기 자신을 참조한다.
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  type text check (type in ('partner','member')),
  parent_code_id uuid references referral_codes(id),
  root_code_id uuid references referral_codes(id),
  depth int default 0,
  total_clicks int default 0,
  total_registrations int default 0,
  is_active boolean default true,
  expires_at timestamptz
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  product_id uuid references products(id),
  user_id uuid references profiles(id),
  guest_contact jsonb,
  consent jsonb not null,
  status text default 'received',
  referral_code_id uuid references referral_codes(id),
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);

create table consultations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  assigned_agent_id uuid references admin_users(id),
  preferred_time timestamptz,
  status text default 'booked',
  call_log text,
  withdrawal_notice_sent_at timestamptz,
  created_at timestamptz default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text,
  target_table text,
  target_id uuid,
  accessed_fields jsonb,
  created_at timestamptz default now()
);

-- 파트너별 카테고리 조건 오버라이드 (없으면 기본값 폴백)
create table partner_category_terms (
  referral_code_id uuid references referral_codes(id),
  category_id uuid references categories(id),
  benefit_type text check (benefit_type in ('none','fixed_discount','percent_discount','priority_consult')),
  benefit_value numeric,
  primary key (referral_code_id, category_id)
);

create table referral_clicks (
  id bigint generated always as identity primary key,
  code_id uuid references referral_codes(id),
  ip text, user_agent text, session_id text,
  created_at timestamptz default now()
);

create table referral_conversions (
  id bigint generated always as identity primary key,
  code_id uuid references referral_codes(id),
  root_code_id uuid references referral_codes(id),
  lead_id uuid references leads(id),
  conversion_type text,   -- 'registration' | 'lead' | 'consultation'
  depth int,
  created_at timestamptz default now()
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  region text,
  address text,
  lat double precision,
  lng double precision,
  supported_categories jsonb default '[]'
);

-- 운영 편의를 위한 키-값 설정 테이블 (§11 Bizmobile site_settings 패턴 채택)
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- 카테고리 시드 (§4 기준)
insert into categories (slug, name, track_type, regulation_level) values
  ('internet', '인터넷', 'self_service', 'low'),
  ('mobile', '휴대폰', 'self_service', 'medium'),
  ('rental', '가전렌탈', 'self_service', 'low'),
  ('insurance', '보험', 'consult_required', 'high'),
  ('funeral', '상조', 'consult_required', 'high');
