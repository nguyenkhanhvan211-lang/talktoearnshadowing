import { describe, expect, it } from "vitest";

import {
  chooseCaptionTrack,
  decodeEntities,
  extractCaptionTracks,
  extractYouTubeId,
  parseJson3,
  parseTimedText,
  parseXmlTimedText,
  splitSentences,
} from "@/lib/transcript";

describe("extractYouTubeId", () => {
  it("reads watch, short, embed, and youtu.be links", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=DLi2txV9IVc&t=3s")).toBe("DLi2txV9IVc");
    expect(extractYouTubeId("https://youtu.be/mqPgWweY1vA")).toBe("mqPgWweY1vA");
    expect(extractYouTubeId("https://www.youtube.com/embed/b_ka3-253h0")).toBe("b_ka3-253h0");
    expect(extractYouTubeId("https://www.youtube.com/shorts/ArI3CaqsEok")).toBe("ArI3CaqsEok");
    expect(extractYouTubeId("https://www.youtube-nocookie.com/embed/DLi2txV9IVc")).toBe("DLi2txV9IVc");
  });

  it("rejects other sites and broken ids", () => {
    expect(extractYouTubeId("https://vimeo.com/123456789")).toBeNull();
    expect(extractYouTubeId("https://youtube.com/watch?v=short")).toBeNull();
    expect(extractYouTubeId("not a url")).toBeNull();
  });
});

describe("caption parsing", () => {
  it("decodes entities and joins timed-text lines", () => {
    const xml = `<?xml version="1.0"?>
      <transcript>
        <text start="0" dur="1.2">Hello &amp; welcome</text>
        <text start="2" dur="1">How are you?</text>
      </transcript>`;
    expect(parseXmlTimedText(xml)).toBe("Hello & welcome How are you?");
    expect(decodeEntities("it&#39;s &#x27;fine&#x27;")).toBe("it's 'fine'");
  });

  it("reads json3 events and auto-detects the format", () => {
    const body = JSON.stringify({
      events: [
        { segs: [{ utf8: "Hello " }, { utf8: "there" }] },
        { segs: [{ utf8: "\n" }] },
        { segs: [{ utf8: "Friend" }] },
      ],
    });
    expect(parseJson3(body)).toBe("Hello there Friend");
    expect(parseTimedText(body)).toBe("Hello there Friend");
  });

  it("extracts tracks and prefers a human English caption", () => {
    const html = `ytInitialPlayerResponse = {"captions":{"playerCaptionsTracklistRenderer":{"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=abcdefghijk&lang=en&kind=asr","languageCode":"en","kind":"asr"},{"baseUrl":"https://www.youtube.com/api/timedtext?v=abcdefghijk&lang=en","languageCode":"en"},{"baseUrl":"https://www.youtube.com/api/timedtext?v=abcdefghijk&lang=vi","languageCode":"vi"}]}}}`;
    const tracks = extractCaptionTracks(html);
    expect(tracks).toHaveLength(3);
    expect(chooseCaptionTrack(tracks)?.kind).toBeUndefined();
    expect(chooseCaptionTrack(tracks)?.languageCode).toBe("en");
  });
});

describe("splitSentences", () => {
  it("keeps speaker lines that already end with punctuation", () => {
    expect(splitSentences("Anna: Hello! Andrew: How are you? Fine.")).toEqual([
      "Anna: Hello!",
      "Andrew: How are you?",
      "Fine.",
    ]);
  });
});
