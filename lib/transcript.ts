export type CaptionTrack = {
  languageCode: string;
  baseUrl: string;
  kind?: string;
};

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
]);

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return ID_PATTERN.test(id) ? id : null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return ID_PATTERN.test(id) ? id : null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const head = parts[0];
  const id = parts[1] ?? "";
  if (
    (head === "embed" || head === "shorts" || head === "live" || head === "v") &&
    ID_PATTERN.test(id)
  ) {
    return id;
  }

  return null;
}

export function decodeEntities(input: string): string {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num: string) =>
      String.fromCodePoint(Number.parseInt(num, 10)),
    );
}

export function parseXmlTimedText(xml: string): string {
  const lines: string[] = [];
  const pattern = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml))) {
    const line = decodeEntities(match[1] ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (line) lines.push(line);
  }
  return lines.join(" ");
}

type Json3Event = {
  segs?: Array<{ utf8?: string }>;
};

export function parseJson3(body: string): string {
  const data = JSON.parse(body) as { events?: Json3Event[] };
  const chunks: string[] = [];
  for (const event of data.events ?? []) {
    for (const seg of event.segs ?? []) {
      if (seg.utf8) chunks.push(seg.utf8);
    }
  }
  return chunks.join("").replace(/\s+/g, " ").trim();
}

export function parseTimedText(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJson3(trimmed);
  }
  return parseXmlTimedText(trimmed);
}

function sliceJsonArray(source: string, start: number): string | null {
  if (source[start] !== "[") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

export function extractCaptionTracks(html: string): CaptionTrack[] {
  const normalized = html.includes('"captionTracks":')
    ? html
    : html.replace(/\\"/g, '"');
  const marker = '"captionTracks":';
  const markerAt = normalized.indexOf(marker);
  if (markerAt < 0) return [];
  const arrayAt = normalized.indexOf("[", markerAt);
  if (arrayAt < 0) return [];
  const json = sliceJsonArray(normalized, arrayAt);
  if (!json) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const tracks: CaptionTrack[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const languageCode =
      typeof record.languageCode === "string" ? record.languageCode : "";
    const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl : "";
    const kind = typeof record.kind === "string" ? record.kind : undefined;
    if (!languageCode || !baseUrl) continue;
    tracks.push({ languageCode, baseUrl, kind });
  }
  return tracks;
}

export function chooseCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const english = tracks.filter((track) =>
    track.languageCode.toLowerCase().startsWith("en"),
  );
  const pool = english.length > 0 ? english : tracks;
  if (pool.length === 0) return null;
  return pool.find((track) => track.kind !== "asr") ?? pool[0] ?? null;
}

export function absoluteCaptionUrl(baseUrl: string): string {
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return baseUrl;
  }
  if (baseUrl.startsWith("//")) return `https:${baseUrl}`;
  return `https://www.youtube.com${baseUrl.startsWith("/") ? "" : "/"}${baseUrl}`;
}

export function normalizeTranscript(text: string, maxLength = 12000): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim();
}

export function splitSentences(text: string): string[] {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return [];
  const parts = compact
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [compact];
}

export function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
