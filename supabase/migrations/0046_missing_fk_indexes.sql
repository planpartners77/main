-- 0038에서 처리하지 않은 나머지 FK 컬럼들. Postgres는 FK 제약을 걸어도 참조하는 쪽
-- 컬럼에 자동으로 인덱스를 만들어주지 않아서, 데이터가 쌓일수록 해당 컬럼으로 필터링/조인하는
-- 쿼리가 순차 스캔이 된다. member_notes.admin_id만 not null이고 나머지는 전부 nullable이라
-- 0038의 leads_user_id_idx/profiles_tier_id_idx와 동일하게 partial index로 만든다.
create index consultations_lead_id_idx on consultations (lead_id) where lead_id is not null;
create index consultations_assigned_agent_id_idx on consultations (assigned_agent_id) where assigned_agent_id is not null;
create index partners_category_id_idx on partners (category_id) where category_id is not null;
create index products_category_id_idx on products (category_id) where category_id is not null;
create index products_partner_id_idx on products (partner_id) where partner_id is not null;
create index referral_codes_parent_code_id_idx on referral_codes (parent_code_id) where parent_code_id is not null;
create index referral_codes_root_code_id_idx on referral_codes (root_code_id) where root_code_id is not null;
create index leads_category_id_idx on leads (category_id) where category_id is not null;
create index leads_product_id_idx on leads (product_id) where product_id is not null;
create index referral_conversions_root_code_id_idx on referral_conversions (root_code_id) where root_code_id is not null;
create index media_assets_uploaded_by_idx on media_assets (uploaded_by) where uploaded_by is not null;
create index banners_category_id_idx on banners (category_id) where category_id is not null;
create index settlements_lead_id_idx on settlements (lead_id) where lead_id is not null;
create index settlements_created_by_idx on settlements (created_by) where created_by is not null;
create index settlements_approved_by_idx on settlements (approved_by) where approved_by is not null;
create index coupons_category_id_idx on coupons (category_id) where category_id is not null;
create index coupons_min_tier_id_idx on coupons (min_tier_id) where min_tier_id is not null;
create index profiles_my_ref_code_id_idx on profiles (my_ref_code_id) where my_ref_code_id is not null;
create index profiles_referred_by_code_id_idx on profiles (referred_by_code_id) where referred_by_code_id is not null;
create index reviews_category_id_idx on reviews (category_id) where category_id is not null;
create index member_notes_admin_id_idx on member_notes (admin_id);
create index popups_category_id_idx on popups (category_id) where category_id is not null;
create index apply_clicks_category_id_idx on apply_clicks (category_id) where category_id is not null;
create index apply_clicks_product_id_idx on apply_clicks (product_id) where product_id is not null;
create index apply_clicks_user_id_idx on apply_clicks (user_id) where user_id is not null;
create index apply_clicks_referral_code_id_idx on apply_clicks (referral_code_id) where referral_code_id is not null;
