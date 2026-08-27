// WhatsApp "Export chat" .txt parser.
// Handles both iOS ("[19/08/2026, 10:30:15] Name: msg") and Android
// ("19/08/2026, 10:30 - Name: msg") formats, Arabic RTL text, Arabic-Indic
// digits, AM/PM and ص/م markers, and multi-line messages.

export interface ParsedMessage {
  sender: string;
  sentAt: Date | null;
  content: string;
}

export interface ParseResult {
  messages: ParsedMessage[];
  format: "ios" | "android" | "unknown";
  systemLines: number;
  mediaOmitted: number;
  failures: string[]; // raw line samples that matched neither format
}

// Directional / invisible marks WhatsApp sprinkles into exports
const INVISIBLES = /[‎‏‪-‮⁦-⁩﻿]/g;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_INDIC = "۰۱۲۳۴۵۶۷۸۹";

function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    if (i >= 0) return String(i);
    return String(EXTENDED_INDIC.indexOf(d));
  });
}

// header: date, time, optional am/pm — capture groups:
// 1 d, 2 m, 3 y, 4 h, 5 min, 6 sec?, 7 ampm?
const DATE_TIME =
  "(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{2,4}),?\\s+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\s*([APap]\\.?[Mm]\\.?|ص|م)?";

const IOS_MSG = new RegExp(`^\\[${DATE_TIME}\\]\\s(.+?):\\s([\\s\\S]*)$`);
const IOS_SYSTEM = new RegExp(`^\\[${DATE_TIME}\\]\\s`);
const ANDROID_MSG = new RegExp(`^${DATE_TIME}\\s[-–—]\\s(.+?):\\s([\\s\\S]*)$`);
const ANDROID_SYSTEM = new RegExp(`^${DATE_TIME}\\s[-–—]\\s`);

const MEDIA_MARKERS = [
  "<media omitted>",
  "image omitted",
  "video omitted",
  "audio omitted",
  "sticker omitted",
  "gif omitted",
  "document omitted",
  "contact card omitted",
  "this message was deleted",
  "you deleted this message",
  "null",
  "تم حذف هذه الرسالة",
  "<تم استبعاد الوسائط>",
];

function buildDate(
  a: number,
  b: number,
  yRaw: number,
  h: number,
  min: number,
  sec: number,
  ampm: string | undefined
): Date | null {
  // Default day-first (Egyptian exports). If the second number can't be a
  // month but the first can, treat as month-first.
  let day = a;
  let month = b;
  if (b > 12 && a <= 12) {
    day = b;
    month = a;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = yRaw < 100 ? 2000 + yRaw : yRaw;
  let hour = h;
  const pm = ampm ? /p|م/i.test(ampm) && !/ص/.test(ampm) : false;
  const am = ampm ? /a|ص/i.test(ampm) && !/م$/.test(ampm.trim()) : false;
  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;
  const d = new Date(year, month - 1, day, hour, min, sec);
  return isNaN(d.getTime()) ? null : d;
}

function parseHeaderMatch(m: RegExpMatchArray): ParsedMessage {
  const sentAt = buildDate(
    parseInt(m[1], 10),
    parseInt(m[2], 10),
    parseInt(m[3], 10),
    parseInt(m[4], 10),
    parseInt(m[5], 10),
    m[6] ? parseInt(m[6], 10) : 0,
    m[7]
  );
  return { sender: m[8].trim(), sentAt, content: m[9] ?? "" };
}

export function parseWhatsAppTxt(raw: string): ParseResult {
  const text = normalizeDigits(raw.replace(INVISIBLES, ""));
  const lines = text.split(/\r?\n/);

  const messages: ParsedMessage[] = [];
  const failures: string[] = [];
  let systemLines = 0;
  let mediaOmitted = 0;
  let iosHits = 0;
  let androidHits = 0;
  let current: ParsedMessage | null = null;

  const flush = () => {
    if (!current) return;
    const body = current.content.trim();
    if (!body || MEDIA_MARKERS.includes(body.toLowerCase())) {
      mediaOmitted++;
    } else {
      messages.push({ ...current, content: body });
    }
    current = null;
  };

  for (const line of lines) {
    if (line.trim() === "" && !current) continue;

    const ios = line.match(IOS_MSG);
    if (ios) {
      flush();
      current = parseHeaderMatch(ios);
      iosHits++;
      continue;
    }
    const android = line.match(ANDROID_MSG);
    if (android) {
      flush();
      current = parseHeaderMatch(android);
      androidHits++;
      continue;
    }
    // Dated line without "Sender: " → system message (encryption notice,
    // group changes, missed calls...)
    if (IOS_SYSTEM.test(line) || ANDROID_SYSTEM.test(line)) {
      flush();
      systemLines++;
      continue;
    }
    // Continuation of a multi-line message
    if (current) {
      current.content += "\n" + line;
      continue;
    }
    if (line.trim() !== "" && failures.length < 20) failures.push(line.slice(0, 120));
  }
  flush();

  const format: ParseResult["format"] =
    iosHits === 0 && androidHits === 0
      ? "unknown"
      : iosHits >= androidHits
        ? "ios"
        : "android";

  return { messages, format, systemLines, mediaOmitted, failures };
}

// ---- language detection (simple, per spec) ----
export function detectLang(s: string): "ar" | "en" | "mixed" {
  const arabic = (s.match(/[؀-ۿݐ-ݿ]/g) ?? []).length;
  const latin = (s.match(/[a-zA-Z]/g) ?? []).length;
  const total = arabic + latin;
  if (total === 0) return "en";
  const ratio = arabic / total;
  if (ratio >= 0.85) return "ar";
  if (ratio <= 0.15) return "en";
  return "mixed";
}

// ---- self-alias matching ----
// Loose Arabic normalization so "احمد" matches "أحمد".
export function normalizeName(s: string): string {
  return s
    .replace(INVISIBLES, "")
    .replace(/[أإآ]/g, "ا") // أ إ آ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/[ً-ٰٟ]/g, "") // tashkeel
    .trim()
    .toLowerCase();
}

export function isSelf(sender: string, aliases: string[]): boolean {
  const n = normalizeName(sender);
  return aliases.some((a) => normalizeName(a) === n);
}
