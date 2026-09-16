"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zoekMateriaalId } from "@/lib/actions/materiaal";
import { Kaart, KaartTitel, Label, OutlineKnop } from "@/components/ui";
import { ScanLine, ArrowRight, CircleAlert, Plus, ChevronRight } from "@/components/icons";
import { OfflineMelding } from "@/components/offline-melding";

const SCANNER_ID = "qr-scan-region";

type Scan = { materiaalId: string; tijd: string };

export function ScanView({
  slug,
  onderdeelId,
  onderdeelNaam,
}: {
  slug: string;
  onderdeelId: string;
  onderdeelNaam: string;
}) {
  const router = useRouter();
  const [handmatigId, setHandmatigId] = useState("");
  const [bezig, setBezig] = useState(false);
  const [onbekendId, setOnbekendId] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"starten" | "actief" | "onbeschikbaar">(
    "starten"
  );
  const [netGescand, setNetGescand] = useState<Scan[]>([]);
  const bezigRef = useRef(false);

  const open = useCallback(
    async (ruwId: string) => {
      if (bezigRef.current) return;
      bezigRef.current = true;
      setBezig(true);
      setOnbekendId(null);
      try {
        const gevonden = await zoekMateriaalId(onderdeelId, ruwId);
        if (!gevonden) {
          // Nooit automatisch doorsturen bij een onbekend ID.
          setOnbekendId(ruwId.trim().toUpperCase());
          setBezig(false);
          bezigRef.current = false;
          return;
        }
        setNetGescand((eerder) =>
          [
            {
              materiaalId: gevonden,
              tijd: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
            },
            ...eerder.filter((s) => s.materiaalId !== gevonden),
          ].slice(0, 4)
        );
        router.push(`/${slug}/materiaal/${encodeURIComponent(gevonden)}`);
      } catch {
        setOnbekendId(ruwId.trim().toUpperCase());
        setBezig(false);
        bezigRef.current = false;
      }
    },
    [onderdeelId, router, slug]
  );

  useEffect(() => {
    let gestopt = false;
    let instantie: import("html5-qrcode").Html5Qrcode | null = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (gestopt) return;
      instantie = new Html5Qrcode(SCANNER_ID, { verbose: false });

      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (gestopt || !instantie || cameras.length === 0) {
            if (!gestopt) setCameraStatus("onbeschikbaar");
            return;
          }
          return instantie
            .start(
              { facingMode: "environment" },
              { fps: 10 },
              (tekst) => {
                // De QR bevat de volledige URL van het kaartje; pak het ID eruit.
                const id = tekst.trim().split("/").filter(Boolean).pop() ?? tekst;
                void open(decodeURIComponent(id));
              },
              () => {
                // Geen QR in beeld — normale toestand tijdens het scannen.
              }
            )
            .then(() => {
              if (!gestopt) setCameraStatus("actief");
            });
        })
        .catch(() => {
          if (!gestopt) setCameraStatus("onbeschikbaar");
        });
    });

    return () => {
      gestopt = true;
      if (!instantie) return;
      // stop() gooit synchroon als de camera nooit is gestart (bv. geen
      // camerarechten), dus ook de aanroep zelf staat in de try.
      try {
        instantie
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              instantie?.clear();
            } catch {
              // Al opgeruimd — geen probleem.
            }
          });
      } catch {
        // Camera liep niet; er valt niets op te ruimen.
      }
    };
  }, [open]);

  // Het veld staat twee keer in de DOM (mobiele vorm onder de viewer, desktop
  // in de rechterkolom); een eigen id per weergave houdt label en input gekoppeld.
  const idVeld = (veldId: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (handmatigId.trim() && !bezig) void open(handmatigId);
      }}
    >
      <Label htmlFor={veldId}>Materiaal-ID handmatig</Label>
      <div className="flex gap-2">
        <input
          id={veldId}
          value={handmatigId}
          onChange={(e) => {
            setHandmatigId(e.target.value.toUpperCase());
            setOnbekendId(null);
          }}
          placeholder="bv. SKI-0917"
          className={`h-12 min-w-0 flex-1 rounded-input border px-3.5 text-[15px] uppercase text-ink ${
            onbekendId
              ? "border-[1.5px] border-red-text bg-red-tint"
              : "border-border-light bg-creme"
          }`}
        />
        <button
          type="submit"
          disabled={bezig}
          aria-label="Materiaal opzoeken"
          className="motion flex h-12 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-on hover:bg-accent-pressed disabled:opacity-60"
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>

      {onbekendId ? (
        <>
          <p className="mt-2 flex items-start gap-1.5 text-[12px] text-red-text">
            <CircleAlert size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <span>
              {onbekendId} staat niet in {onderdeelNaam}. Controleer het ID of voeg het materiaal
              toe.
            </span>
          </p>
          <div className="mt-2.5">
            <OutlineKnop href={`/${slug}/materiaal/nieuw?id=${encodeURIComponent(onbekendId)}`}>
              <Plus size={15} strokeWidth={2} />
              Nieuw materiaal
            </OutlineKnop>
          </div>
        </>
      ) : (
        <p className="mt-2 text-[12px] text-text-muted">
          Het ID staat onder de QR-code op de sticker.
        </p>
      )}
    </form>
  );

  return (
    <main className="flex-1 pb-24 desktop:flex desktop:gap-4 desktop:overflow-hidden desktop:p-6 desktop:pb-6">
      <div className="px-[18px] pt-4 desktop:flex desktop:min-w-0 desktop:flex-1 desktop:flex-col desktop:px-0 desktop:pt-0">
        <div className="desktop:hidden">
          <h1 className="display text-[22px] text-ink">Scan de QR-code</h1>
          <p className="mb-4 mt-1 text-[13px] text-text-muted">
            Houd de camera op de sticker van het materiaal.
          </p>
        </div>

        <OfflineMelding />

        {/* Cameraviewer */}
        <div
          className="relative h-[330px] overflow-hidden rounded-card desktop:h-auto desktop:flex-1"
          style={{ background: "linear-gradient(135deg, #1e2e3a, #2c3f4e, #15212b)" }}
        >
          <div
            id={SCANNER_ID}
            className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
          />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 desktop:h-[300px] desktop:w-[300px]">
            <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-lg border-l-4 border-t-4 border-accent desktop:h-11 desktop:w-11 desktop:rounded-none" />
            <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-lg border-r-4 border-t-4 border-accent desktop:h-11 desktop:w-11 desktop:rounded-none" />
            <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-lg border-b-4 border-l-4 border-accent desktop:h-11 desktop:w-11 desktop:rounded-none" />
            <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-lg border-b-4 border-r-4 border-accent desktop:h-11 desktop:w-11 desktop:rounded-none" />
            {cameraStatus === "actief" && (
              <div
                className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-accent"
                style={{ boxShadow: "0 0 14px 2px var(--accent)" }}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-navy to-transparent px-4 py-3">
            <ScanLine size={16} strokeWidth={2} className="text-accent" />
            <span className="text-[12px] text-creme">
              {cameraStatus === "actief"
                ? "Camera actief · richt op de QR-sticker"
                : cameraStatus === "onbeschikbaar"
                  ? "Camera niet beschikbaar — gebruik handmatige invoer"
                  : "Camera wordt gestart…"}
            </span>
          </div>
        </div>

        {/* Mobiel: scheiding + handmatige invoer onder de viewer */}
        <div className="desktop:hidden">
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-light" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
              of handmatig
            </span>
            <span className="h-px flex-1 bg-border-light" />
          </div>
          <Kaart>{idVeld("handmatigId-mobiel")}</Kaart>
        </div>
      </div>

      {/* Desktop: drie kaarten naast de viewer */}
      <div className="hidden w-[392px] shrink-0 flex-col gap-3 overflow-y-auto desktop:flex">
        <Kaart>{idVeld("handmatigId-desktop")}</Kaart>

        <Kaart>
          <KaartTitel>Onbekend ID?</KaartTitel>
          <p className="mb-3 mt-1 text-[13px] text-text-muted">
            Voeg het materiaal toe aan {onderdeelNaam}.
          </p>
          <OutlineKnop href={`/${slug}/materiaal/nieuw`}>
            <Plus size={15} strokeWidth={2} />
            Nieuw materiaal
          </OutlineKnop>
        </Kaart>

        <Kaart>
          <KaartTitel>Net gescand</KaartTitel>
          {netGescand.length === 0 ? (
            <p className="mt-2 text-[13px] text-text-muted">
              Nog niets gescand in deze sessie.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-zand">
              {netGescand.map((s) => (
                <li key={s.materiaalId}>
                  <Link
                    href={`/${slug}/materiaal/${encodeURIComponent(s.materiaalId)}`}
                    prefetch={false}
                    className="motion flex items-center justify-between gap-3 py-2.5 hover:bg-zand"
                  >
                    <span className="text-[14px] font-extrabold text-ink">{s.materiaalId}</span>
                    <span className="ml-auto text-[12px] text-text-muted">{s.tijd}</span>
                    <ChevronRight size={15} strokeWidth={2} className="text-text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kaart>
      </div>
    </main>
  );
}
