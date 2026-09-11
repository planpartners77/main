-- "신청하기" 버튼 클릭 이력. 상품에 apply_url(외부 제휴사 링크)이 설정된 경우 지금까지는
-- 클릭 시점에 아무 기록도 남지 않았다(새 탭으로 이동해버리면 끝). 정식 신청(leads)은
-- consent가 not null이라 신청서를 작성하지 않은 단순 클릭까지 억지로 채워 넣으면 동의 여부가
-- 애매해지므로, 신청서와는 별도의 가벼운 클릭 이벤트 테이블로 분리한다.
create table apply_clicks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  product_id uuid references products(id),
  user_id uuid references profiles(id),
  target_url text,
  referral_code_id uuid references referral_codes(id),
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);

alter table apply_clicks enable row level security;

-- leads_insert_self_or_guest와 동일한 형태: 비회원(guest) 클릭은 user_id가 null이므로 허용하고,
-- 회원 클릭은 본인 계정으로만 기록되게 한다(다른 회원 명의로 위조 불가).
create policy "apply_clicks_insert_self_or_guest" on apply_clicks
  for insert with check (auth.uid() = user_id or user_id is null);

-- 본인 클릭 이력 또는 담당 카테고리 관리자만 조회 가능(leads_select_own_or_admin과 동일한 형태).
create policy "apply_clicks_select_own_or_admin" on apply_clicks
  for select using (auth.uid() = user_id or is_admin_for_category(category_id));
