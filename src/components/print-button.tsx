"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full bg-amber px-4 py-2 text-[13px] font-semibold text-graphite"
    >
      Printen
    </button>
  );
}
