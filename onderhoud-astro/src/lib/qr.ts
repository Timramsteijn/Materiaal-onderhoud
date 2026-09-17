import qrcode from "qrcode-generator";

/**
 * QR-code als SVG-pad. `qrcode-generator` is pure JS zonder Node-API's en
 * draait dus gewoon op Workers, anders dan het `qrcode`-pakket.
 *
 * De inhoud is de volledige URL van het materiaalkaartje: zo werkt een scan
 * met de gewone telefooncamera ook buiten de app om.
 */
export function qrSvgPad(inhoud: string): { pad: string; modules: number } {
  const qr = qrcode(0, "M");
  qr.addData(inhoud);
  qr.make();

  const modules = qr.getModuleCount();
  const delen: string[] = [];
  for (let rij = 0; rij < modules; rij++) {
    for (let kolom = 0; kolom < modules; kolom++) {
      if (qr.isDark(rij, kolom)) delen.push(`M${kolom} ${rij}h1v1h-1z`);
    }
  }
  return { pad: delen.join(""), modules };
}

/** Kant-en-klare SVG-string, bruikbaar in zowel schermen als printlabels. */
export function qrSvg(inhoud: string, { kleur = "#122028" } = {}): string {
  const { pad, modules } = qrSvgPad(inhoud);
  const rand = 1;
  const maat = modules + rand * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maat} ${maat}" shape-rendering="crispEdges" role="img" aria-label="QR-code">` +
    `<rect width="${maat}" height="${maat}" fill="#ffffff"/>` +
    `<g transform="translate(${rand} ${rand})" fill="${kleur}">${pad ? `<path d="${pad}"/>` : ""}</g>` +
    `</svg>`
  );
}
