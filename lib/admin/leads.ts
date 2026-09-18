export interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  guest_contact: Record<string, unknown> | null;
  consent: Record<string, unknown> | null;
  admin_memo: string | null;
  categories: { name: string; slug: string } | null;
  products: { title: string } | null;
  referral_code_id: string | null;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

// 목록 화면(LeadsTable)에서 빠르게 스캔하기 위한 요약 — guest_contact은 카테고리(신청서)마다
// 필드 구성이 달라 공용 키 후보 중 있는 값만 뽑아 보여준다. 전체 항목은 LeadDetailPanel에서 본다.
// travel은 guardianName/childInfo, usim/mobile 등은 name 키를 쓴다.
export function summarizeContact(contact: Record<string, unknown> | null) {
  if (!contact) return { name: "-", phone: "-" };
  const name =
    (contact.guardianName as string) ?? (contact.childInfo as string) ?? (contact.name as string) ?? "-";
  const phone = (contact.phone as string) ?? "-";
  return { name, phone };
}

export const LEADS_PAGE_SIZE = 50;

export const LEAD_DETAIL_SELECT_COLUMNS =
  "id, status, created_at, guest_contact, consent, admin_memo, categories(name, slug), products(title), referral_code_id, referrer_url, utm_source, utm_medium, utm_campaign";
