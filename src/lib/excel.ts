import "server-only";
import * as XLSX from "xlsx";
import { STATUS_LABELS } from "@/lib/domain";
import type { MaterialStatus } from "@prisma/client";

function normHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const HEADER_MAP: Record<string, string> = {
  materiaalid: "id",
  id: "id",
  type: "categorie",
  categorie: "categorie",
  merk: "merk",
  model: "model",
  maatlengtecm: "maat",
  maat: "maat",
  lengte: "maat",
  aanschafjaar: "aanschafjaar",
  status: "status",
  opmerkingen: "opmerkingen",
  datum: "datum",
  actie: "actie",
  uitgevoerddoor: "door",
  door: "door",
};

function resolveStatus(raw: string | undefined): MaterialStatus {
  const norm = (raw ?? "").trim().toLowerCase();
  const match = (Object.entries(STATUS_LABELS) as [MaterialStatus, string][]).find(
    ([, label]) => label.toLowerCase() === norm
  );
  return match?.[0] ?? "IN_GEBRUIK";
}

function excelDateToIso(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0)).toISOString();
  }
  const parsed = new Date(String(v ?? ""));
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

function sheetToMappedRows(sheet: XLSX.WorkSheet, requiredHeaderKeys: string[]) {
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const headerRowIdx = rawRows.findIndex((row) =>
    row.some((cell) => requiredHeaderKeys.includes(normHeader(cell)))
  );
  if (headerRowIdx === -1) return null;

  const headerCells = rawRows[headerRowIdx].map(normHeader);
  const dataRows = rawRows.slice(headerRowIdx + 1);

  return dataRows.map((rowArr) => {
    const mapped: Record<string, string> = {};
    headerCells.forEach((key, i) => {
      const target = HEADER_MAP[key];
      if (target && rowArr[i] !== undefined && rowArr[i] !== "") {
        mapped[target] = String(rowArr[i]).trim();
      }
    });
    return mapped;
  });
}

export type GeimporteerdMateriaal = {
  id: string;
  categorieNaam: string;
  merk: string;
  model: string;
  maat: string;
  aanschafjaar: string;
  status: MaterialStatus;
  opmerkingen: string;
};

export type GeimporteerdLogRegel = {
  materialId: string;
  categorieNaam: string;
  actie: string;
  datumIso: string;
  door: string;
  opmerkingen: string;
};

export function parseImportWorkbook(buffer: ArrayBuffer): {
  materialen: GeimporteerdMateriaal[];
  logs: GeimporteerdLogRegel[];
  materiaalSheetGevonden: boolean;
} {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  const matSheetName =
    wb.SheetNames.find((n) => normHeader(n) === "materiaal") ?? wb.SheetNames[0];
  const matRows = matSheetName
    ? sheetToMappedRows(wb.Sheets[matSheetName], ["materiaalid", "id"])
    : null;

  const materialen: GeimporteerdMateriaal[] = (matRows ?? [])
    .filter((r) => r.id)
    .map((r) => ({
      id: r.id.toUpperCase(),
      categorieNaam: r.categorie || "",
      merk: r.merk || "",
      model: r.model || "",
      maat: r.maat || "",
      aanschafjaar: r.aanschafjaar || "",
      status: resolveStatus(r.status),
      opmerkingen: r.opmerkingen || "",
    }));

  const logSheetName = wb.SheetNames.find((n) => normHeader(n) === "onderhoudslog");
  const logRows = logSheetName ? sheetToMappedRows(wb.Sheets[logSheetName], ["actie"]) : null;

  const logs: GeimporteerdLogRegel[] = (logRows ?? [])
    .filter((r) => r.id && r.actie)
    .map((r) => ({
      materialId: r.id.toUpperCase(),
      categorieNaam: r.categorie || "",
      actie: r.actie,
      datumIso: excelDateToIso(r.datum),
      door: r.door || "",
      opmerkingen: r.opmerkingen || "",
    }));

  return { materialen, logs, materiaalSheetGevonden: matRows !== null };
}

export function buildExportWorkbook(
  materialen: Array<{
    id: string;
    category: { naam: string; department: { naam: string } };
    merk: string;
    model: string;
    maat: string | null;
    aanschafjaar: number | null;
    status: MaterialStatus;
    opmerkingen: string | null;
  }>,
  logs: Array<{
    datum: Date;
    material: { id: string; category: { naam: string; department: { naam: string } } };
    actie: string;
    uitgevoerdDoor: { naam: string };
    opmerkingen: string | null;
  }>
): Buffer {
  const matHeaders = [
    "Materiaal-ID",
    "Onderdeel",
    "Categorie",
    "Merk",
    "Model",
    "Maat / Lengte (cm)",
    "Aanschafjaar",
    "Status",
    "Opmerkingen",
  ];
  const matRows = materialen.map((m) => [
    m.id,
    m.category.department.naam,
    m.category.naam,
    m.merk,
    m.model,
    m.maat ?? "",
    m.aanschafjaar ?? "",
    STATUS_LABELS[m.status],
    m.opmerkingen ?? "",
  ]);
  const wsMat = XLSX.utils.aoa_to_sheet([matHeaders, ...matRows]);
  wsMat["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 13 },
    { wch: 22 },
    { wch: 30 },
  ];

  const logHeaders = [
    "Datum",
    "Materiaal-ID",
    "Onderdeel",
    "Categorie",
    "Actie",
    "Uitgevoerd door",
    "Opmerkingen",
  ];
  const sortedLogs = [...logs].sort((a, b) => a.datum.getTime() - b.datum.getTime());
  const logRows = sortedLogs.map((l) => [
    l.datum.toLocaleString("nl-NL"),
    l.material.id,
    l.material.category.department.naam,
    l.material.category.naam,
    l.actie,
    l.uitgevoerdDoor.naam,
    l.opmerkingen ?? "",
  ]);
  const wsLog = XLSX.utils.aoa_to_sheet([logHeaders, ...logRows]);
  wsLog["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 42 },
    { wch: 16 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMat, "Materiaal");
  XLSX.utils.book_append_sheet(wb, wsLog, "Onderhoudslog");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
