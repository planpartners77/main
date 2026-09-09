import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 상품/파트너 이미지는 업로드·자체 저장소 없이 외부 URL을 그대로 참조한다(호스팅 비용 절감 방침).
    // 출처 도메인을 미리 알 수 없으므로 remotePatterns 화이트리스트 대신 최적화 자체를 끈다.
    unoptimized: true,
  },
};

export default nextConfig;
