export function RichTextSection({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      {title.trim() && <h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2>}
      <p className={`whitespace-pre-line text-sm leading-relaxed text-gray-600 ${title.trim() ? "mt-4" : ""}`}>{text}</p>
    </section>
  );
}
