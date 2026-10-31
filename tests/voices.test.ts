import { describe, expect, it } from "vitest";

import { isIOSSpeechDevice, pickEnglishVoice } from "@/components/speech";

const voice = (lang: string, name = lang) => ({ lang, name });

describe("pickEnglishVoice", () => {
  it("prefers en-US, then en-GB, then any English voice", () => {
    expect(
      pickEnglishVoice([voice("fr-FR"), voice("en-AU", "Aussie"), voice("en-GB", "Daniel"), voice("en-US", "Samantha")])
        ?.name,
    ).toBe("Samantha");

    expect(pickEnglishVoice([voice("en-AU"), voice("en-GB", "Daniel")])?.name).toBe("Daniel");
    expect(pickEnglishVoice([voice("de-DE"), voice("en-AU", "Aussie")])?.name).toBe("Aussie");
  });

  it("matches language tags without caring about case", () => {
    expect(pickEnglishVoice([voice("EN-us", "US"), voice("en-GB", "UK")])?.name).toBe("US");
    expect(pickEnglishVoice([voice("en-US-x-sfg", "Local")])?.lang).toBe("en-US-x-sfg");
  });

  it("returns null when no English voice is loaded yet", () => {
    expect(pickEnglishVoice([])).toBeNull();
    expect(pickEnglishVoice([voice("vi-VN"), voice("fr-FR")])).toBeNull();
  });
});

describe("isIOSSpeechDevice", () => {
  it("treats iPhone, iPad, and iPadOS as iOS, and desktop Chrome as not", () => {
    expect(
      isIOSSpeechDevice({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
    expect(
      isIOSSpeechDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
    expect(
      isIOSSpeechDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 0,
      }),
    ).toBe(false);
    expect(
      isIOSSpeechDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});