-- 휴대폰(mobile) 카테고리 요금제 비교 기능 (요고_휴대폰 카테고리 구성안.md 참고)
-- 요금제 스펙 자체는 신규 컬럼 없이 products.extra jsonb에 저장한다(§12-11 결정 유지,
-- 형태는 lib/mobile/plan-spec.ts의 MobilePlanExtra 타입으로 고정). 여기서는 페이백류
-- 프로모션만 스케줄(월별 지급액)을 가져 별도 테이블이 필요해 신설한다.

create table plan_promotions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,                       -- 예: "24개월 분할 페이백"
  type text not null check (type in ('fixed','point')) default 'fixed',
  total_amount numeric not null,
  schedule jsonb not null default '[]',       -- [{ "month": 1, "amount": 25000 }, ...]
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index plan_promotions_product_id_idx on plan_promotions(product_id);

alter table plan_promotions enable row level security;

-- 공개 조회: 활성 프로모션이면서 연결된 상품도 활성인 경우만 (비회원 상세 페이지 노출용)
create policy "plan_promotions_select_active" on plan_promotions
  for select using (
    is_active = true
    and exists (select 1 from products p where p.id = product_id and p.is_active = true)
  );

-- 쓰기: 연결된 상품의 카테고리를 담당하는 관리자만 (products_write_admin과 동일한 기준)
create policy "plan_promotions_write_admin" on plan_promotions
  for all using (
    exists (select 1 from products p where p.id = product_id and is_admin_for_category(p.category_id))
  )
  with check (
    exists (select 1 from products p where p.id = product_id and is_admin_for_category(p.category_id))
  );
