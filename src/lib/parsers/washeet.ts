// Parser for the WhatsApp Business pipeline sheet (Google Sheet → File →
// Download → CSV). Header: date, wa_id, name, direction, text, message_id,
// media_id, mime_type, media_link, filename.
// direction "out" = written from the user's business number (author self),
// "in" = written by the counterpart.

export interface SheetMessage {
  author: "self" | "other";
  counterpartName: string; // real name or wa_id — pseudonymized at store time
  sentAt: Date | null;
  content: string;
}

export interface SheetParseResult {
  messages: SheetMessage[];
  mediaSkipped: number;
  reactionsSkipped: number;
  broadcastSkipped: number; // identical outbound text sent many times = template blast
  isSheet: boolean;
}

const MEDIA_LABELS = new Set([
  "video", "audio", "image", "document", "sticker", "location", "contacts",
  "unsupported", "reaction", "",
]);

// Minimal CSV parser handling quoted fields with embedded commas/newlines.
export function parseCsv(s: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

export function looksLikeWaSheet(firstChunk: string): boolean {
  const head = firstChunk.slice(0, 500).toLowerCase();
  return head.includes("wa_id") && head.includes("direction");
}

export function parseWaSheetCsv(csv: string): SheetParseResult {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { messages: [], mediaSkipped: 0, reactionsSkipped: 0, broadcastSkipped: 0, isSheet: false };
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date"), iWa = idx("wa_id"), iName = idx("name"),
    iDir = idx("direction"), iText = idx("text");
  if (iDir === -1 || iText === -1 || iWa === -1) {
    return { messages: [], mediaSkipped: 0, reactionsSkipped: 0, broadcastSkipped: 0, isSheet: false };
  }

  let mediaSkipped = 0;
  let reactionsSkipped = 0;
  const raw: SheetMessage[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const dir = (cols[iDir] ?? "").trim();
    if (dir !== "in" && dir !== "out") continue;
    const text = (cols[iText] ?? "").trim();
    const low = text.toLowerCase();
    if (low === "reaction") { reactionsSkipped++; continue; }
    if (MEDIA_LABELS.has(low)) { mediaSkipped++; continue; }
    const dateStr = iDate >= 0 ? (cols[iDate] ?? "").trim() : "";
    const d = dateStr ? new Date(dateStr) : null;
    const counterpartName =
      (iName >= 0 && (cols[iName] ?? "").trim()) || (cols[iWa] ?? "").trim() || "unknown";
    raw.push({
      author: dir === "out" ? "self" : "other",
      counterpartName,
      sentAt: d && !isNaN(d.getTime()) ? d : null,
      content: text,
    });
  }

  // Outbound texts repeated to many recipients are template blasts, not the
  // user's own writing — exclude them from the style corpus.
  const outCounts = new Map<string, number>();
  for (const m of raw) {
    if (m.author === "self") outCounts.set(m.content, (outCounts.get(m.content) ?? 0) + 1);
  }
  let broadcastSkipped = 0;
  const messages = raw.filter((m) => {
    if (m.author === "self" && (outCounts.get(m.content) ?? 0) >= 4) {
      broadcastSkipped++;
      return false;
    }
    return true;
  });

  return { messages, mediaSkipped, reactionsSkipped, broadcastSkipped, isSheet: true };
}
