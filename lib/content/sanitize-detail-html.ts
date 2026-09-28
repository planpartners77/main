import sanitizeHtml from "sanitize-html";

// ProductDetailHtmlField(Tiptap: StarterKit + Link + Image)가 실제로 만들어낼 수 있는
// 태그만 허용한다. 관리자 전용 입력이라도 저장된 값이 그대로 서버 렌더링되므로
// 방어적으로 화이트리스트를 둔다.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "img",
];

export function sanitizeDetailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
  });
}
