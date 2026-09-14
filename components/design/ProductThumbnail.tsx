// 상품 카드 썸네일 공통 틀: 항상 4:3 비율 박스에 이미지를 object-cover로 채운다.
// 원본 이미지가 박스보다 작으면 확대, 크면 축소해 비율에 맞게 자동으로 꽉 채워준다.
// 신규 카드 컴포넌트를 만들 때도 이 컴포넌트로 통일해서 쓴다.
export function ProductThumbnail({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-gray-300">이미지 준비중</div>
      )}
    </div>
  );
}
