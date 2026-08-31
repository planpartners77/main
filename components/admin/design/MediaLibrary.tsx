"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface MediaAsset {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const BUCKET = "design-assets";
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function publicUrlFor(path: string) {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function MediaLibrary({ assets, uploaderId }: { assets: MediaAsset[]; uploaderId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("png, jpg, webp, gif 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("5MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }

    setError(null);
    setUploading(true);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) {
      setError(`업로드 실패: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("media_assets").insert({
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploaderId,
    });

    setUploading(false);
    if (insertError) {
      setError(`저장 실패: ${insertError.message}`);
      return;
    }
    router.refresh();
  }

  async function handleDelete(asset: MediaAsset) {
    if (!confirm(`"${asset.file_name}"을(를) 삭제할까요? 배너·팝업 등에서 이미 쓰고 있으면 그쪽 화면이 깨질 수 있습니다.`)) {
      return;
    }
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    await supabase.from("media_assets").delete().eq("id", asset.id);
    router.refresh();
  }

  async function handleCopy(asset: MediaAsset) {
    await navigator.clipboard.writeText(publicUrlFor(asset.storage_path));
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          배너·팝업 등에서 쓸 이미지를 업로드합니다. png/jpg/webp/gif, 5MB 이하.
        </p>
        <label className="shrink-0 cursor-pointer rounded-full bg-[var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          {uploading ? "업로드 중..." : "이미지 업로드"}
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      {assets.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          업로드된 이미지가 없습니다.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <div key={asset.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- Storage 이미지, next/image 미사용 프로젝트 컨벤션(unoptimized) */}
              <img
                src={publicUrlFor(asset.storage_path)}
                alt={asset.file_name}
                className="h-32 w-full object-cover"
              />
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-gray-700" title={asset.file_name}>
                  {asset.file_name}
                </p>
                <p className="text-[11px] text-gray-400">{formatSize(asset.size_bytes)}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => handleCopy(asset)}
                    className="flex-1 rounded-lg border border-gray-200 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    {copiedId === asset.id ? "복사됨" : "URL 복사"}
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    className="rounded-lg border border-red-100 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
