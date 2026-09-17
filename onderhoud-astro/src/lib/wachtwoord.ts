/**
 * Wachtwoordhashing met PBKDF2 via Web Crypto. Bewust geen bcrypt: dat is een
 * pure-JS implementatie die op Workers te veel CPU-tijd kost, terwijl PBKDF2
 * native in de runtime zit.
 *
 * Opslagformaat: pbkdf2$<iteraties>$<salt-base64>$<hash-base64>
 */

const ITERATIES = 210_000;
const HASH = "SHA-256";
const SLEUTELLENGTE = 32;

function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function vanBase64(waarde: string): Uint8Array {
  return Uint8Array.from(atob(waarde), (c) => c.charCodeAt(0));
}

async function afleiden(
  wachtwoord: string,
  salt: Uint8Array,
  iteraties: number
): Promise<Uint8Array> {
  const sleutel = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(wachtwoord),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iteraties, hash: HASH },
    sleutel,
    SLEUTELLENGTE * 8
  );
  return new Uint8Array(bits);
}

export async function hashWachtwoord(wachtwoord: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await afleiden(wachtwoord, salt, ITERATIES);
  return `pbkdf2$${ITERATIES}$${base64(salt)}$${base64(hash)}`;
}

/** Vergelijking in constante tijd, zodat de duur niets over de hash verraadt. */
function gelijk(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a[i] ^ b[i];
  return verschil === 0;
}

export async function controleerWachtwoord(
  wachtwoord: string,
  opgeslagen: string
): Promise<boolean> {
  const delen = opgeslagen.split("$");
  if (delen.length !== 4 || delen[0] !== "pbkdf2") return false;

  const iteraties = Number(delen[1]);
  if (!Number.isFinite(iteraties) || iteraties < 1) return false;

  const hash = await afleiden(wachtwoord, vanBase64(delen[2]), iteraties);
  return gelijk(hash, vanBase64(delen[3]));
}
