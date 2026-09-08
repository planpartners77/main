"use client";

import { useEffect } from "react";

// 관리자 SEO 화면에서 붙여넣은 GA4/픽셀 등 <script> 스니펫을 head에 삽입한다.
// innerHTML로 넣으면 브라우저가 <script>를 실행하지 않으므로, Range.createContextualFragment로
// 만든 노드를 appendChild해 실제로 실행되게 한다. 페이지 하이드레이션 이후 실행되므로
// 사이트 소유확인용 메타태그(서버 렌더링 필요)는 이 필드가 아니라 위 인증 코드 입력란을 써야 한다.
export function CustomHeadScript({ html }: { html: string | null }) {
  useEffect(() => {
    if (!html) return;
    const range = document.createRange();
    range.selectNode(document.head);
    const fragment = range.createContextualFragment(html);
    const nodes = Array.from(fragment.childNodes);
    document.head.append(fragment);
    return () => {
      for (const node of nodes) node.parentNode?.removeChild(node);
    };
  }, [html]);

  return null;
}
