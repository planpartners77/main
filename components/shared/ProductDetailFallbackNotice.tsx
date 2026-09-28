// 관리자가 상세페이지 콘텐츠(detail_html)를 아직 입력하지 않았거나 노출을 꺼둔 상품에서
// 7개 카테고리 상세페이지가 공통으로 보여주는 기본 안내. 카테고리별 실제 정책(환불 기한 등)을
// 단정하지 않고, 정확한 사항은 상담으로 안내받도록 유도하는 중립적인 문구만 담는다.
export function ProductDetailFallbackNotice({ className = "mt-6" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600 ${className}`}>
      <p className="font-semibold text-gray-700">이용 전 확인해 주세요</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>상세 안내 콘텐츠는 현재 준비 중입니다.</li>
        <li>정확한 요금·조건 및 신청·취소 절차는 상담을 통해 확인하실 수 있습니다.</li>
      </ul>
    </div>
  );
}
