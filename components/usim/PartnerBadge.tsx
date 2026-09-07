export function PartnerBadge({ name, logoUrl }: { name: string | null; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <span className="inline-flex h-5 max-w-[88px] items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- 외부 URL 이미지, next/image 미사용 컨벤션 */}
        <img src={logoUrl} alt={name ?? "통신사 로고"} className="h-full w-full object-contain object-left" />
      </span>
    );
  }
  return <p className="text-xs font-semibold text-gray-500">{name ?? "통신사 미지정"}</p>;
}
