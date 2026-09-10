import "server-only";
import QRCode from "qrcode";

/** Genereert een QR-code (bevat alleen het Materiaal-ID) als PNG data-URL. */
export async function generateQrDataUrl(materialId: string): Promise<string> {
  return QRCode.toDataURL(materialId, {
    margin: 1,
    width: 240,
    color: { dark: "#12181F", light: "#FFFFFF" },
  });
}
