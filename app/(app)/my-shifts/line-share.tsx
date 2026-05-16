"use client";

interface ShiftLine {
  date: string;
  label: string;
  range: string;
}

export function LineShareButton({ shifts }: { shifts: ShiftLine[] }) {
  if (shifts.length === 0) return null;
  const text = [
    "📅 今月のシフト",
    ...shifts.map((s) => `${s.date} ${s.range} (${s.label})`),
  ].join("\n");
  const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;

  return (
    <div className="flex justify-end">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#06c755] px-4 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width={16}
          height={16}
          fill="currentColor"
        >
          <path d="M19 11.4c0-3.4-3.4-6.2-7.5-6.2S4 7.9 4 11.4c0 3.1 2.7 5.6 6.4 6.1.2 0 .4.1.5.3.1.1.1.3.1.5l-.1.7c0 .2.1.3.4.2 4.6-2.2 7.7-5.7 7.7-7.8z" />
        </svg>
        LINE で共有
      </a>
    </div>
  );
}
