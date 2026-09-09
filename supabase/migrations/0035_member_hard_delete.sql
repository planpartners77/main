-- 회원의 "즉시 데이터 삭제" 요구(개인정보 삭제 요구권) 대응. 기존 회원 삭제
-- (app/api/admin/members/[id]/delete)는 탈퇴처리+익명화라 정산/추천인 이력을 보존하지만,
-- 이 함수는 실제로 행을 지운다. 단, referral_codes 행 자체를 지우면 이 회원이 발급한 코드를
-- 부모/루트로 참조하는 다른 회원의 추천인 트리(parent_code_id/root_code_id)와 그 하위
-- clicks/leads/conversions/partner_category_terms가 통째로 깨지므로, referral_codes는 남기고
-- 소유자 연결(profile_id)과 이름만 끊는다. 여러 테이블에 걸친 삭제라 중간에 실패해도 부분
-- 삭제가 남지 않도록 함수 전체를 하나의 트랜잭션으로 묶는다(plpgsql 함수는 기본적으로
-- 트랜잭셔널하다).
create or replace function fn_purge_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_ids uuid[];
begin
  select array_agg(id) into v_lead_ids from leads where user_id = p_profile_id;

  if v_lead_ids is not null then
    delete from consultations where lead_id = any(v_lead_ids);
    -- 이 리드가 발생시킨 추천 전환 기록은 리드 당사자(고객)와 무관하게 추천인(파트너)의
    -- 실적 집계 근거이므로 삭제하지 않고 lead_id 연결만 끊는다.
    update referral_conversions set lead_id = null where lead_id = any(v_lead_ids);
    delete from leads where user_id = p_profile_id;
  end if;

  delete from coupon_redemptions where profile_id = p_profile_id;
  delete from point_transactions where profile_id = p_profile_id;
  delete from member_notes where profile_id = p_profile_id;

  update referral_codes
  set profile_id = null, name = '탈퇴한 회원'
  where profile_id = p_profile_id;

  delete from profiles where id = p_profile_id;
end;
$$;

revoke all on function fn_purge_member(uuid) from public, anon, authenticated;
