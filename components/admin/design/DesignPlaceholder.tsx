export function DesignPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <p className="mt-4 text-xs text-gray-400">준비 중입니다.</p>
    </div>
  );
}
