/**
 * Schrijfwachtrij voor de werkplaats en de hal, waar het bereik slecht is.
 * Scannen en registreren blijven lokaal werken; elke registratie krijgt een
 * clientId en wordt idempotent verstuurd zodra er weer verbinding is.
 */
export type WachtrijRegel = {
  clientId: string;
  materiaalDbId: string;
  materiaalLabel: string;
  actieId: string;
  actieNaam: string;
  opmerking: string;
  nieuweStatus?: string;
  /** Meldingen die deze registratie afrondt. */
  verzoekIds?: string[];
  tijdstip: number;
};

const DB_NAAM = "materiaalonderhoud";
const STORE = "registraties";

/* ---------------------------------------------------------------------------
 * De wachtrij is een externe store (IndexedDB). Componenten lezen hem met
 * useSyncExternalStore, zodat er geen state in een effect hoeft te worden
 * bijgewerkt en elke weergave dezelfde bron gebruikt.
 * ------------------------------------------------------------------------- */

export type WachtrijStand = { regels: WachtrijRegel[]; mislukt: number };

const LEEG: WachtrijStand = { regels: [], mislukt: 0 };
let stand: WachtrijStand = LEEG;
const luisteraars = new Set<() => void>();

function zetStand(volgende: WachtrijStand) {
  stand = volgende;
  for (const luisteraar of luisteraars) luisteraar();
}

export const wachtrijStore = {
  abonneer(luisteraar: () => void) {
    luisteraars.add(luisteraar);
    return () => {
      luisteraars.delete(luisteraar);
    };
  },
  lees(): WachtrijStand {
    return stand;
  },
  leesOpServer(): WachtrijStand {
    return LEEG;
  },
};

/** Haalt de wachtrij opnieuw op uit IndexedDB en meldt dat aan de luisteraars. */
export async function ververs(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const regels = await leesWachtrij();
  zetStand({ regels, mislukt: stand.mislukt });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const verzoek = indexedDB.open(DB_NAAM, 1);
    verzoek.onupgradeneeded = () => {
      const db = verzoek.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "clientId" });
      }
    };
    verzoek.onsuccess = () => resolve(verzoek.result);
    verzoek.onerror = () => reject(verzoek.error);
  });
}

export async function zetInWachtrij(regel: WachtrijRegel): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(regel);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await ververs();
}

async function leesWachtrij(): Promise<WachtrijRegel[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const regels = await new Promise<WachtrijRegel[]>((resolve, reject) => {
    const verzoek = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    verzoek.onsuccess = () => resolve(verzoek.result as WachtrijRegel[]);
    verzoek.onerror = () => reject(verzoek.error);
  });
  db.close();
  return regels.sort((a, b) => a.tijdstip - b.tijdstip);
}

async function verwijderUitWachtrij(clientId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(clientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Stuurt de wachtrij door. De server dedupliceert op clientId, dus opnieuw
 * versturen na een refresh levert nooit een dubbele registratie op.
 * Geeft terug hoeveel regels nog wachten (bv. door een conflict of storing).
 */
export async function verstuurWachtrij(
  verstuur: (formData: FormData) => Promise<{ fout?: string } | undefined>
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const regels = await leesWachtrij();
  if (regels.length === 0) {
    if (stand.regels.length > 0) zetStand(LEEG);
    return;
  }

  let mislukt = 0;
  for (const regel of regels) {
    const formData = new FormData();
    formData.set("materiaalDbId", regel.materiaalDbId);
    formData.set("actieId", regel.actieId);
    formData.set("opmerking", regel.opmerking);
    formData.set("clientId", regel.clientId);
    if (regel.nieuweStatus) formData.set("nieuweStatus", regel.nieuweStatus);
    for (const id of regel.verzoekIds ?? []) formData.append("verzoekIds", id);

    try {
      const resultaat = await verstuur(formData);
      if (resultaat?.fout) {
        // Een conflict melden we, we slikken het niet stil: de regel blijft staan.
        mislukt++;
        continue;
      }
      await verwijderUitWachtrij(regel.clientId);
    } catch {
      mislukt++;
    }
  }

  zetStand({ regels: await leesWachtrij(), mislukt });
}
