export interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  guest_contact: Record<string, unknown> | null;
  admin_memo: string | null;
  categories: { name: string; slug: string } | null;
  referral_code_id: string | null;
}

// guest_contact은 카테고리(신청서)마다 필드 구성이 달라 공용 키 후보 중 있는 값만 뽑아 보여준다.
// travel은 guardianName/childInfo, usim/mobile 등은 name 키를 쓴다.
export function summarizeContact(contact: Record<string, unknown> | null) {
  if (!contact) return { name: "-", phone: "-" };
  const name =
    (contact.guardianName as string) ?? (contact.childInfo as string) ?? (contact.name as string) ?? "-";
  const phone = (contact.phone as string) ?? "-";
  return { name, phone };
}

export const LEADS_PAGE_SIZE = 50;
