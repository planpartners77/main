import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 상품/파트너 이미지는 업로드·자체 저장소 없이 외부 URL을 그대로 참조한다(호스팅 비용 절감 방침).
    // 출처 도메인을 미리 알 수 없으므로 remotePatterns 화이트리스트 대신 최적화 자체를 끈다.
    unoptimized: true,
  },
  async redirects() {
    // mobile -> usim 카테고리 명칭 정정에 따른 구 URL 리다이렉트.
    // "휴대폰"은 별도 신규 카테고리로 추후 생성될 예정이라 /mobile 자체를 재사용하지 않는다.
    return [
      { source: "/mobile", destination: "/usim", permanent: true },
      { source: "/mobile/:id*", destination: "/usim/:id*", permanent: true },
      { source: "/apply/mobile", destination: "/apply/usim", permanent: true },
    ];
  },
};

export default nextConfig;
