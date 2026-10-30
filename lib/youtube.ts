import {
  absoluteCaptionUrl,
  chooseCaptionTrack,
  extractCaptionTracks,
  normalizeTranscript,
  parseTimedText,
} from "@/lib/transcript";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status}`);
  }
  return response.text();
}

async function transcriptFromPlayer(videoId: string): Promise<string> {
  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20250301.01.00",
            hl: "en",
            gl: "US",
          },
        },
        videoId,
      }),
    },
  );
  if (!response.ok) throw new Error("player request failed");
  const data = (await response.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{
          baseUrl?: string;
          languageCode?: string;
          kind?: string;
        }>;
      };
    };
  };
  const tracks = (
    data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  ).flatMap((track) =>
    track.baseUrl && track.languageCode
      ? [
          {
            baseUrl: track.baseUrl,
            languageCode: track.languageCode,
            kind: track.kind,
          },
        ]
      : [],
  );
  return readTrack(chooseCaptionTrack(tracks));
}

async function transcriptFromWatch(videoId: string): Promise<string> {
  const html = await fetchText(
    `https://www.youtube.com/watch?v=${videoId}&hl=en`,
  );
  return readTrack(chooseCaptionTrack(extractCaptionTracks(html)));
}

async function readTrack(
  track: ReturnType<typeof chooseCaptionTrack>,
): Promise<string> {
  if (!track) return "";
  const url = new URL(absoluteCaptionUrl(track.baseUrl));
  if (!url.searchParams.has("fmt")) url.searchParams.set("fmt", "json3");
  const body = await fetchText(url.toString());
  return parseTimedText(body);
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const attempts = [transcriptFromPlayer(videoId), transcriptFromWatch(videoId)];
  const results = await Promise.all(attempts.map((attempt) => attempt.catch(() => "")));
  const transcript = results.find((text) => text.trim().length >= 40) ?? "";
  if (!transcript) {
    throw new Error("captions-unavailable");
  }
  return normalizeTranscript(transcript);
}

export async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return "Video YouTube";
    const data = (await response.json()) as { title?: string };
    return data.title?.trim() || "Video YouTube";
  } catch {
    return "Video YouTube";
  }
}
