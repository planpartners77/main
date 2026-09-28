"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { ProductDetailHtmlField } from "./ProductDetailHtmlField";

// usim/mobile/lp/insurance처럼 전용 스펙 UI가 없는 카테고리(인터넷·가전렌탈·상조 등)를 위한
// 범용 편집기. 상세페이지 콘텐츠(detail_html/show_detail_html)는 다른 카테고리와 동일한
// 리치 에디터로, 그 외 카테고리별 임의 필드는 JSON 코드 에디터로 편집한다.
export function GenericCategorySpecFields({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const detailHtml = typeof value.detail_html === "string" ? value.detail_html : "";
  const showDetailHtml = value.show_detail_html === true;
  const rest: Record<string, unknown> = { ...value };
  delete rest.detail_html;
  delete rest.show_detail_html;

  const [restJson, setRestJson] = useState(() => JSON.stringify(rest, null, 2));
  const [jsonError, setJsonError] = useState(false);

  function updateRest(text: string) {
    setRestJson(text);
    try {
      const parsed = JSON.parse(text || "{}");
      setJsonError(false);
      onChange({ ...parsed, detail_html: detailHtml, show_detail_html: showDetailHtml });
    } catch {
      setJsonError(true);
    }
  }

  return (
    <>
      <ProductDetailHtmlField
        html={detailHtml}
        show={showDetailHtml}
        onChangeHtml={(html) => onChange({ ...rest, detail_html: html, show_detail_html: showDetailHtml })}
        onChangeShow={(show) => onChange({ ...rest, detail_html: detailHtml, show_detail_html: show })}
      />
      <label className="text-sm sm:col-span-2">
        추가 정보(JSON, 선택 — 카테고리별 상이한 스펙)
        <div className={`mt-1 overflow-hidden rounded-lg border ${jsonError ? "border-red-400" : "border-gray-300"}`}>
          <CodeMirror
            value={restJson}
            height="140px"
            extensions={[json()]}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
            className="text-xs"
            onChange={updateRest}
          />
        </div>
        {jsonError && (
          <p className="mt-1 text-xs text-red-500">JSON 형식이 올바르지 않습니다. 마지막으로 유효했던 값이 저장됩니다.</p>
        )}
      </label>
    </>
  );
}
