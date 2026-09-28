"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";

// 전 카테고리 상세페이지 스펙 컴포넌트가 공통으로 쓰는 "상세페이지 콘텐츠" 입력 필드.
// 카테고리마다 extra jsonb 타입은 다르지만 이 두 키(detail_html, show_detail_html)는
// 동일한 의미로 취급한다. 이미지 삽입은 URL 입력만 지원하며(업로드 API는 두지 않음),
// 저장된 HTML은 공개 페이지 렌더링 시 sanitizeDetailHtml()로 한 번 걸러진다.

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md border px-2 py-1 text-xs font-medium ${
        active
          ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function addLink() {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요 (비우면 링크 해제)", current ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  function addImage() {
    const url = window.prompt("이미지 URL을 입력하세요");
    if (!url || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-1.5">
      <ToolbarButton label="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="취소선" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolbarButton>
      <ToolbarButton
        label="제목 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="제목 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        label="글머리 목록"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • 목록
      </ToolbarButton>
      <ToolbarButton
        label="번호 목록"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. 목록
      </ToolbarButton>
      <ToolbarButton
        label="인용구"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        인용
      </ToolbarButton>
      <ToolbarButton label="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ─
      </ToolbarButton>
      <ToolbarButton label="링크" active={editor.isActive("link")} onClick={addLink}>
        링크
      </ToolbarButton>
      <ToolbarButton label="이미지" onClick={addImage}>
        이미지
      </ToolbarButton>
      <ToolbarButton label="되돌리기" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton label="다시 실행" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>
    </div>
  );
}

export function ProductDetailHtmlField({
  html,
  show,
  onChangeHtml,
  onChangeShow,
}: {
  html: string;
  show: boolean;
  onChangeHtml: (html: string) => void;
  onChangeShow: (show: boolean) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TiptapLink.configure({ openOnClick: false, autolink: true }), TiptapImage],
    content: html || "",
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[220px] px-3 py-2 focus:outline-none",
      },
    },
  });

  return (
    <div className="grid gap-2 rounded-xl border border-dashed border-[var(--brand-blue)]/40 bg-[var(--surface-tint)]/40 p-4 sm:col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--brand-blue-dark)]">상세페이지 콘텐츠</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={show} onChange={(e) => onChangeShow(e.target.checked)} />
          상세페이지에 노출
        </label>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-gray-400">
        여기서 작성한 내용이 상품 상세페이지에 노출됩니다. 체크를 꺼두면 내용은 저장된 채로 페이지에서만 숨겨집니다.
      </p>
    </div>
  );
}
