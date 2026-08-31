import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";

export interface ConsultProduct {
  id: string;
  title: string;
  partnerName: string | null;
  insurer: string | null;
  coverageSummary: string | null;
  monthlyPremium: string | null;
}

const PROCESS_STEPS = [
  { step: "1", title: "정보입력", body: "이름·연락처와 상담 희망 시간대를 남겨주세요." },
  { step: "2", title: "상담사 배정", body: "담당 상담사가 배정되어 순차적으로 연락드립니다." },
  { step: "3", title: "상담 진행", body: "전화 상담을 통해 필요한 보장 내용을 함께 확인합니다." },
  {
    step: "4",
    title: "가입 확정",
    body: "가입 확정 시 청약철회(청약 철회 청구권) 절차를 함께 안내해 드립니다.",
  },
] as const;

// 가이드 §12-5 상담필수형 템플릿. /insurance, /funeral이 이 컴포넌트를 공유한다.
// 모집인 등록번호 등 아직 확보되지 않은 실제 고지 데이터는 빈 값으로 두고, 그 자리를
// "등록 예정" 표시로만 남겨 추후 실제 값이 들어오면 바로 대체할 수 있게 한다.
export function CategoryConsultLanding({
  category,
  products,
  registrationNumber = null,
}: {
  category: CategoryConfig;
  products: ConsultProduct[];
  registrationNumber?: string | null;
}) {
  return (
    <main className="pb-16">
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <TrackBadge trackType={category.trackType} />
          <h1 className="mt-4 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            {category.name}은 상품 구조와 약관이 복잡해 온라인 셀프가입만으로는 충분한 설명을 드리기 어렵습니다.
            플랜파트너스는 등록된 상담사가 필요한 보장 내용을 확인해 드리는 상담 중심 서비스를 제공합니다.
          </p>
          <div className="mt-6">
            <Link
              href={`/consult/${category.slug}`}
              className="inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
            >
              무료 상담 예약하기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">왜 상담이 필요한가요?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            보장 범위, 면책 조항, 해지 환급금 등은 상품마다 차이가 커서 서면만으로는 오해가 생기기 쉽습니다.
            등록된 상담사가 직접 설명해 드립니다.
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            가입 이후에도 완전판매 모니터링(해피콜) 및 청약철회 절차를 통해 불완전판매를 방지합니다.
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-xs text-gray-500">
          <p className="font-semibold text-gray-600">모집인 등록번호 및 자격 정보</p>
          <p className="mt-1">{registrationNumber ?? "등록 예정 — 확인되는 대로 표기합니다."}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">플랜 요약</h2>
        {products.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            현재 등록된 플랜이 준비 중입니다. 상담을 예약해 주시면 가능한 플랜을 안내해 드립니다.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-semibold text-[var(--brand-navy)]">{product.title}</p>
                {product.coverageSummary && (
                  <p className="mt-2 text-sm text-gray-600">{product.coverageSummary}</p>
                )}
                {product.monthlyPremium && (
                  <p className="mt-2 text-xs text-gray-500">보험료: {product.monthlyPremium}</p>
                )}
                <p className="mt-3 text-[11px] text-gray-400">
                  본 상품은 {product.partnerName ?? product.insurer ?? "제휴사"}의 상품이며, 플랜파트너스는
                  비교·중개 서비스를 제공합니다.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">상담 진행 단계</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {PROCESS_STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl border border-gray-200 bg-white p-4">
              <span className="text-xs font-semibold text-[var(--brand-blue)]">STEP {s.step}</span>
              <p className="mt-1 text-sm font-semibold text-[var(--brand-navy)]">{s.title}</p>
              <p className="mt-1 text-xs text-gray-500">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href={`/consult/${category.slug}`}
            className="inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
          >
            무료 상담 예약하기
          </Link>
        </div>
      </section>
    </main>
  );
}
