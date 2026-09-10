"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveScannedId } from "@/lib/actions/materialen";

const SCANNER_ELEMENT_ID = "qr-scan-region";

export function ScanView() {
  const router = useRouter();
  const [manualId, setManualId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5QrcodeScanner | null>(null);
  const handledRef = useRef(false);

  const handleScan = useCallback(
    async (rawId: string) => {
      setBusy(true);
      setError(null);
      try {
        try {
          scannerRef.current?.pause(true);
        } catch {
          // Kan mislukken als de scanner net niet actief is — geen probleem.
        }
        const target = await resolveScannedId(rawId);
        router.push(target);
      } catch {
        setError("Kon dit materiaal niet opzoeken. Probeer opnieuw.");
        setBusy(false);
        handledRef.current = false;
        scannerRef.current?.resume();
      }
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        { fps: 10, qrbox: { width: 230, height: 230 }, rememberLastUsedCamera: true },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          void handleScan(decodedText);
        },
        () => {
          // Geen QR in beeld — normale, doorlopende toestand tijdens het scannen, geen actie nodig.
        }
      );
    });

    return () => {
      cancelled = true;
      scannerRef.current?.clear().catch(() => {});
    };
  }, [handleScan]);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const target = await resolveScannedId(manualId);
      router.push(target);
    } catch {
      setError("Kon dit materiaal niet opzoeken. Probeer opnieuw.");
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-3 text-xl text-ink">Scannen</h1>

      <div className="overflow-hidden rounded-2xl bg-panel p-2 shadow-sm">
        <div id={SCANNER_ELEMENT_ID} />
      </div>

      {busy && <p className="mt-2 text-center text-[13px] text-ink-soft">Bezig met opzoeken...</p>}
      {error && (
        <p className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-center text-[13px] text-danger">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-[12.5px] text-ink-soft">
        Camera niet beschikbaar? Voer het Materiaal-ID handmatig in.
      </p>
      <form onSubmit={handleManualSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={manualId}
          onChange={(e) => setManualId(e.target.value.toUpperCase())}
          placeholder="bv. SKI-001"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-[15px] uppercase text-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-graphite px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
        >
          Zoeken
        </button>
      </form>
    </div>
  );
}
