import Link from "next/link";
import type { CategoryConfig } from "@/lib/categories";
import { TrackBadge } from "@/components/shared/TrackBadge";
import { ProductThumbnail } from "@/components/design/ProductThumbnail";

export interface ConsultProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  partnerName: string | null;
  insurer: string | null;
  coverageSummary: string | null;
  monthlyPremium: string | null;
}

const SECTION_TITLE = "border-l-4 border-[var(--brand-blue)] pl-3 text-xl font-bold text-[var(--brand-navy)]";

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
// 가독성을 위해 구역마다 배경을 교차한다: 히어로(연블루) → 흰색 → 연회색(플랜) → 흰색 → 네이비 CTA.
export function CategoryConsultLanding({
  category,
  products,
}: {
  category: CategoryConfig;
  products: ConsultProduct[];
}) {
  return (
    <main>
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <TrackBadge trackType={category.trackType} />
          <h1 className="mt-4 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-700">
            {category.name}은 상품 구조와 약관이 복잡해 온라인 셀프가입만으로는 충분한 설명을 드리기 어렵습니다.
            플랜파트너스는 등록된 상담사가 필요한 보장 내용을 확인해 드리는 상담 중심 서비스를 제공합니다.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className={SECTION_TITLE}>왜 상담이 필요한가요?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700">
              보장 범위, 면책 조항, 해지 환급금 등은 상품마다 차이가 커서 서면만으로는 오해가 생기기 쉽습니다.
              등록된 상담사가 직접 설명해 드립니다.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700">
              가입 이후에도 완전판매 모니터링(해피콜) 및 청약철회 절차를 통해 불완전판매를 방지합니다.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className={SECTION_TITLE}>플랜 요약</h2>
          {products.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
              현재 등록된 플랜이 준비 중입니다. 상담을 예약해 주시면 가능한 플랜을 안내해 드립니다.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const detailHref = `/${category.slug}/${product.id}`;
                const insurerName = product.partnerName ?? product.insurer;
                return (
                  <div key={product.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <Link href={detailHref} className="flex gap-4">
                      <div className="w-24 shrink-0 sm:w-28">
                        <ProductThumbnail src={product.imageUrl} alt={product.title} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {insurerName && (
                          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-[var(--brand-blue)]">
                            {insurerName}
                          </span>
                        )}
                        <p className="mt-1 line-clamp-2 text-base font-bold leading-snug text-[var(--brand-navy)]">
                          {product.title}
                        </p>
                        {product.monthlyPremium && (
                          <p className="mt-1 text-lg font-bold text-[var(--brand-blue)]">{product.monthlyPremium}</p>
                        )}
                        {product.coverageSummary && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{product.coverageSummary}</p>
                        )}
                      </div>
                    </Link>
                    <Link
                      href={`${detailHref}#consult`}
                      className="mt-3 block rounded-full bg-[var(--brand-blue)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--brand-blue-dark)]"
                    >
                      이 플랜 상담하기
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className={SECTION_TITLE}>상담 진행 단계</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            {PROCESS_STEPS.map((s) => (
              <div key={s.step} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <span className="text-xs font-semibold text-[var(--brand-blue)]">STEP {s.step}</span>
                <p className="mt-1 text-sm font-semibold text-[var(--brand-navy)]">{s.title}</p>
                <p className="mt-1 text-sm text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--brand-navy)]">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <p className="text-lg font-bold text-white">어떤 플랜이 맞는지 고민되시나요?</p>
          <p className="mt-1 text-sm text-blue-100">등록된 상담사가 필요한 보장을 함께 확인해 드립니다.</p>
          <Link
            href={`/consult/${category.slug}`}
            className="mt-5 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] hover:bg-blue-50"
          >
            무료 상담 예약하기
          </Link>
        </div>
      </section>
    </main>
  );
}
