"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveScannedId } from "@/lib/actions/materialen";
import { ScanLine, ArrowRight } from "@/components/icons";

const SCANNER_ELEMENT_ID = "qr-scan-region";

export function ScanView({ departmentId }: { departmentId: string }) {
  const router = useRouter();
  const [manualId, setManualId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"starten" | "actief" | "onbeschikbaar">(
    "starten"
  );
  const html5QrRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  const handleScan = useCallback(
    async (rawId: string) => {
      setBusy(true);
      setError(null);
      try {
        const target = await resolveScannedId(departmentId, rawId);
        if (!target) {
          setError("Onbekend materiaal-ID.");
          setBusy(false);
          handledRef.current = false;
          return;
        }
        router.push(target);
      } catch {
        setError("Kon dit materiaal niet opzoeken. Probeer opnieuw.");
        setBusy(false);
        handledRef.current = false;
      }
    },
    [router, departmentId]
  );

  useEffect(() => {
    let cancelled = false;
    let instance: import("html5-qrcode").Html5Qrcode | null = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      instance = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
      html5QrRef.current = instance;

      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cancelled || !instance || cameras.length === 0) {
            if (!cancelled) setCameraStatus("onbeschikbaar");
            return;
          }
          return instance
            .start(
              cameras[0].id,
              { fps: 10 },
              (decodedText) => {
                if (handledRef.current) return;
                handledRef.current = true;
                void handleScan(decodedText);
              },
              () => {
                // Geen QR in beeld — normale, doorlopende toestand, geen actie nodig.
              }
            )
            .then(() => {
              if (!cancelled) setCameraStatus("actief");
            });
        })
        .catch(() => {
          if (!cancelled) setCameraStatus("onbeschikbaar");
        });
    });

    return () => {
      cancelled = true;
      if (instance) {
        instance
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              instance?.clear();
            } catch {
              // Kan mislukken als er al opgeruimd is — geen probleem.
            }
          });
      }
    };
  }, [handleScan]);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim() || busy) return;
    await handleScan(manualId);
  }

  return (
    <div className="mx-auto max-w-md px-[18px] pb-8 pt-6">
      <h1 className="text-[22px] text-ink">Scan de QR-code</h1>
      <p className="mb-4 mt-1 text-[13px] text-text-muted">
        Houd de camera op de sticker van het materiaal.
      </p>

      <div
        className="relative h-[330px] overflow-hidden rounded-[10px]"
        style={{ background: "linear-gradient(135deg, #1b2c36, #2f4350, #122028)" }}
      >
        <div
          id={SCANNER_ELEMENT_ID}
          className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-lg border-l-4 border-t-4 border-orange" />
          <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-lg border-r-4 border-t-4 border-orange" />
          <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-lg border-b-4 border-l-4 border-orange" />
          <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-lg border-b-4 border-r-4 border-orange" />
          {cameraStatus === "actief" && (
            <div
              className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-orange"
              style={{ boxShadow: "0 0 14px 2px rgba(244,98,43,.7)" }}
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-ink/95 to-transparent px-4 py-3">
          <ScanLine size={16} strokeWidth={1.9} className="text-orange" />
          <span className="text-[12px] text-white">
            {cameraStatus === "actief"
              ? "Camera actief · richt op de QR-sticker"
              : cameraStatus === "onbeschikbaar"
                ? "Camera niet beschikbaar — gebruik handmatige invoer"
                : "Camera wordt gestart..."}
          </span>
        </div>
      </div>

      {busy && (
        <p className="mt-3 text-center text-[12.5px] text-text-muted">Bezig met opzoeken...</p>
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-card-border" />
        <span className="text-[11px] uppercase tracking-[0.1em] text-text-muted">
          of handmatig
        </span>
        <span className="h-px flex-1 bg-card-border" />
      </div>

      <div className="rounded-[10px] bg-card p-4 shadow-[var(--shadow-card)]">
        <label
          htmlFor="manualId"
          className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-text-dark-secondary"
        >
          Materiaal-ID
        </label>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            id="manualId"
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
            placeholder="bv. SKI-0917"
            className="h-12 flex-1 rounded-lg border border-border-light bg-input-fill px-3 text-[15px] uppercase text-ink"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-14 shrink-0 items-center justify-center rounded-full bg-orange text-white transition-colors hover:bg-orange-hover disabled:opacity-60"
          >
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </form>
        {error && <p className="mt-2 text-[12px] text-red">{error}</p>}
        <p className="mt-2 text-[12px] text-text-muted">
          Het ID staat onder de QR-code op de sticker.
        </p>
      </div>
    </div>
  );
}
