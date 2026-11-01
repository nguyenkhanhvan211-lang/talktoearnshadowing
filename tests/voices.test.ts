import { describe, expect, it } from "vitest";

import { isIOSSpeechDevice, pickAccentVoice, readStoredAccent } from "@/components/speech";

const voice = (lang: string, name = lang, localService = false) => ({ lang, name, localService });

describe("pickAccentVoice", () => {
  const catalog = [
    voice("en-GB", "Daniel", true),
    voice("en-GB", "Google UK English Male"),
    voice("en-GB", "Google UK English Female"),
    voice("en-US", "Allison"),
    voice("en-US", "Alex", true),
    voice("en-US", "Samantha", true),
    voice("en-US", "Google US English"),
    voice("en-AU", "Karen", true),
    voice("fr-FR", "Thomas"),
  ];

  it("prefers named American voices and ignores other locales", () => {
    expect(pickAccentVoice(catalog, "us")).toEqual({
      voice: voice("en-US", "Google US English"),
      lang: "en-US",
      needsHint: false,
    });
    expect(pickAccentVoice([voice("en-GB", "Samantha"), voice("en-US", "Ava")], "us").voice?.name).toBe("Ava");
    expect(
      pickAccentVoice([voice("en-US", "Fred", true), voice("en-US", "Samantha")], "us").voice?.name,
    ).toBe("Samantha");
  });

  it("uses a local en-US voice before a remote exact-lang voice", () => {
    const choice = pickAccentVoice(
      [voice("en-US", "Microsoft David"), voice("en-US", "Fred", true), voice("en-GB", "Daniel", true)],
      "us",
    );
    expect(choice.voice?.name).toBe("Fred");
    expect(choice.needsHint).toBe(false);
    expect(choice.lang).toBe("en-US");
  });

  it("falls back to any exact en-US voice and asks for a hint", () => {
    const choice = pickAccentVoice([voice("en-GB", "Daniel", true), voice("en-US", "Microsoft David")], "us");
    expect(choice.voice?.name).toBe("Microsoft David");
    expect(choice.needsHint).toBe(true);
    expect(choice.lang).toBe("en-US");
  });

  it("does not substitute a British or other accent when no en-US voice exists", () => {
    const choice = pickAccentVoice([voice("en-GB", "Daniel", true), voice("en-AU", "Karen", true)], "us");
    expect(choice.voice).toBeNull();
    expect(choice.lang).toBe("en-US");
    expect(choice.needsHint).toBe(true);
  });

  it("prefers named British voices in order and ignores American voices", () => {
    expect(pickAccentVoice(catalog, "uk").voice?.name).toBe("Google UK English Female");
    expect(
      pickAccentVoice([voice("en-US", "Samantha", true), voice("en-GB", "Arthur"), voice("en-GB", "Kate")], "uk")
        .voice?.name,
    ).toBe("Kate");
    expect(pickAccentVoice([voice("en-GB", "Serena"), voice("en-GB", "Daniel")], "uk").voice?.name).toBe("Daniel");
  });

  it("keeps a local en-GB voice without a hint, and hints for a generic en-GB voice", () => {
    expect(pickAccentVoice([voice("en-GB", "Oliver", true), voice("en-US", "Alex", true)], "uk")).toMatchObject({
      voice: { name: "Oliver" },
      needsHint: false,
      lang: "en-GB",
    });
    expect(pickAccentVoice([voice("en-GB", "Microsoft George"), voice("en-US", "Alex")], "uk")).toMatchObject({
      voice: { name: "Microsoft George" },
      needsHint: true,
      lang: "en-GB",
    });
  });

  it("matches names and language tags without caring about case", () => {
    expect(pickAccentVoice([voice("EN-us", "google us english")], "us").voice?.name).toBe("google us english");
    expect(pickAccentVoice([voice("en_GB", "DANIEL", true)], "uk").needsHint).toBe(false);
  });
});

describe("readStoredAccent", () => {
  it("defaults to US unless UK was saved", () => {
    expect(readStoredAccent(null)).toBe("us");
    expect(readStoredAccent({ getItem: () => null })).toBe("us");
    expect(readStoredAccent({ getItem: () => "uk" })).toBe("uk");
    expect(readStoredAccent({ getItem: () => "au" })).toBe("us");
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
