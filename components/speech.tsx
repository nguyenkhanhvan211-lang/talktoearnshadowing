"use client";

import { useEffect, useRef, useState } from "react";

type RecognitionResult = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognizer;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function createRecognizer(handlers: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}): Recognizer | null {
  const Ctor = recognitionConstructor();
  if (!Ctor) return null;
  const recognizer = new Ctor();
  recognizer.lang = "en-US";
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.onresult = (event) => {
    let finalText = "";
    let interim = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const piece = event.results[index]?.[0]?.transcript ?? "";
      if (event.results[index]?.isFinal) finalText += piece;
      else interim += piece;
    }
    if (finalText.trim()) handlers.onFinal(finalText.trim());
    handlers.onInterim(interim);
  };
  recognizer.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    handlers.onError(
      event.error === "not-allowed"
        ? "Trình duyệt chặn micro. Bạn vẫn có thể gõ bản tóm tắt."
        : "Không nhận được giọng nói. Hãy gõ bản tóm tắt.",
    );
  };
  recognizer.onend = () => handlers.onEnd();
  return recognizer;
}

export type Accent = "us" | "uk";

export type VoiceLike = {
  lang: string;
  name?: string;
  localService?: boolean;
};

export type AccentVoiceChoice<T extends VoiceLike> = {
  voice: T | null;
  lang: "en-US" | "en-GB";
  /** No preferred native voice for this accent. Do not substitute the other locale. */
  needsHint: boolean;
};

const ACCENT_STORAGE_KEY = "tte-speech-accent";

const ACCENT_LANG: Record<Accent, "en-US" | "en-GB"> = {
  us: "en-US",
  uk: "en-GB",
};

const PREFERRED_NAMES: Record<Accent, readonly string[]> = {
  us: ["Google US English", "Samantha", "Alex", "Ava", "Allison"],
  uk: ["Google UK English Female", "Google UK English Male", "Daniel", "Serena", "Kate", "Arthur"],
};

const NO_SPEECH =
  "Trình duyệt này không đọc được tiếng Anh. Hãy đọc theo chữ trên màn hình.";
const SPEAK_FAILED =
  "Không phát được giọng đọc. Hãy thử lại, hoặc đọc theo chữ trên màn hình.";

function normalizedLang(lang: string): string {
  return lang.toLowerCase().replaceAll("_", "-");
}

export function readStoredAccent(storage: { getItem: (key: string) => string | null } | null): Accent {
  return storage?.getItem(ACCENT_STORAGE_KEY) === "uk" ? "uk" : "us";
}

export function accentVoiceHint(accent: Accent, foundExactLang: boolean): string {
  if (accent === "us") {
    return foundExactLang
      ? "Thiết bị không có giọng Mỹ chuẩn. Đang đọc bằng giọng en-US có sẵn."
      : "Thiết bị không có giọng Mỹ (en-US).";
  }
  return foundExactLang
    ? "Thiết bị không có giọng Anh chuẩn. Đang đọc bằng giọng en-GB có sẵn."
    : "Thiết bị không có giọng Anh (en-GB).";
}

/**
 * Pick a native voice for one accent only.
 * Named voices win, then a localService voice of that exact lang, then any exact lang.
 * Voices of the other locale are never selected.
 */
export function pickAccentVoice<T extends VoiceLike>(
  voices: readonly T[],
  accent: Accent,
): AccentVoiceChoice<T> {
  const lang = ACCENT_LANG[accent];
  const exact = voices.filter((voice) => normalizedLang(voice.lang) === lang.toLowerCase());
  const named = PREFERRED_NAMES[accent]
    .map((name) => exact.find((voice) => (voice.name ?? "").toLowerCase().includes(name.toLowerCase())))
    .find((voice): voice is T => Boolean(voice));
  if (named) return { voice: named, lang, needsHint: false };
  const local = exact.find((voice) => voice.localService);
  if (local) return { voice: local, lang, needsHint: false };
  return { voice: exact[0] ?? null, lang, needsHint: true };
}

/**
 * iPhone, iPod, iPad, and iPadOS (which reports as MacIntel with a touch screen).
 * WebKit drops a speak() that follows cancel() in the same turn, and it only
 * allows speech inside the user gesture, so iOS must call speak() directly.
 */
export function isIOSSpeechDevice(nav: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}): boolean {
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return true;
  const looksLikeDesktopBrowser = /Chrome|Chromium|CriOS|Edg\/|Firefox/.test(nav.userAgent);
  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1 && !looksLikeDesktopBrowser;
}

type SpeakHandlers = {
  accent?: Accent;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
  onHint?: (message: string | null) => void;
};

let activeUtterance: SpeechSynthesisUtterance | null = null;
let resumeTimer: ReturnType<typeof setInterval> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesBound = false;

function stopResumeTimer() {
  if (resumeTimer === null) return;
  clearInterval(resumeTimer);
  resumeTimer = null;
}

function bindVoices(synth: SpeechSynthesis) {
  const loaded = synth.getVoices();
  if (loaded.length > 0) cachedVoices = loaded;
  if (voicesBound) return;
  voicesBound = true;
  synth.addEventListener("voiceschanged", () => {
    cachedVoices = synth.getVoices();
  });
}

function ignoredSpeechError(error: string): boolean {
  return error === "canceled" || error === "interrupted";
}

export function speakEnglish(text: string, handlers: SpeakHandlers = {}): boolean {
  const trimmed = text.trim();
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    handlers.onError?.(NO_SPEECH);
    return false;
  }
  if (!trimmed) {
    handlers.onError?.(SPEAK_FAILED);
    return false;
  }

  const synth = window.speechSynthesis;
  bindVoices(synth);

  const accent = handlers.accent ?? "us";
  const choice = pickAccentVoice(cachedVoices.length > 0 ? cachedVoices : synth.getVoices(), accent);
  const utterance = new SpeechSynthesisUtterance(trimmed);
  activeUtterance = utterance;
  utterance.lang = choice.lang;
  utterance.rate = 0.9;
  if (choice.voice) utterance.voice = choice.voice;
  handlers.onHint?.(choice.needsHint ? accentVoiceHint(accent, choice.voice !== null) : null);

  const finish = () => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null;
    stopResumeTimer();
    handlers.onEnd?.();
  };

  utterance.onend = finish;
  utterance.onerror = (event) => {
    if (ignoredSpeechError(event.error)) {
      finish();
      return;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
      stopResumeTimer();
    }
    handlers.onError?.(SPEAK_FAILED);
  };

  const ios = isIOSSpeechDevice(navigator);
  try {
    if (ios) {
      synth.speak(utterance);
    } else {
      synth.resume();
      synth.cancel();
      synth.speak(utterance);
      synth.resume();
      stopResumeTimer();
      resumeTimer = setInterval(() => {
        if (!synth.speaking) {
          stopResumeTimer();
          return;
        }
        synth.resume();
      }, 10000);
    }
  } catch {
    activeUtterance = null;
    stopResumeTimer();
    handlers.onError?.(SPEAK_FAILED);
    return false;
  }

  handlers.onStart?.();
  return true;
}

export function useEnglishSpeech() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accent, setAccentState] = useState<Accent>("us");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);
  const requestId = useRef(0);
  const choice = pickAccentVoice(voices, accent);
  const hint = voicesReady && choice.needsHint ? accentVoiceHint(accent, choice.voice !== null) : null;

  useEffect(() => {
    const stored = readStoredAccent(window.localStorage);
    if (stored !== "us") queueMicrotask(() => setAccentState(stored));
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) {
      queueMicrotask(() => setVoicesReady(true));
      return;
    }
    const synth = window.speechSynthesis;
    const apply = (ready: boolean) => {
      const list = synth.getVoices();
      cachedVoices = list;
      setVoices(list);
      if (ready || list.length > 0) setVoicesReady(true);
    };
    const onChange = () => apply(true);
    synth.addEventListener("voiceschanged", onChange);
    queueMicrotask(() => apply(false));
    return () => synth.removeEventListener("voiceschanged", onChange);
  }, []);

  function setAccent(next: Accent) {
    setAccentState(next);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, next);
  }

  function speak(text: string, key: string) {
    const id = requestId.current + 1;
    requestId.current = id;
    setNotice(null);
    if (window.speechSynthesis) {
      const list = window.speechSynthesis.getVoices();
      cachedVoices = list;
      setVoices(list);
      setVoicesReady(true);
    }
    speakEnglish(text, {
      accent,
      onStart: () => setActiveKey(key),
      onEnd: () => {
        if (requestId.current !== id) return;
        setActiveKey(null);
      },
      onError: (message) => {
        if (requestId.current !== id) return;
        setActiveKey(null);
        setNotice(message);
      },
    });
  }

  return { speak, activeKey, notice, hint, accent, setAccent };
}

export function AccentToggle({
  accent,
  onChange,
}: {
  accent: Accent;
  onChange: (accent: Accent) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Giọng">
      <span className="font-medium text-stone-700">Giọng:</span>
      <button
        type="button"
        aria-pressed={accent === "us"}
        onClick={() => onChange("us")}
        className={accentButtonClass(accent === "us")}
      >
        Mỹ (US)
      </button>
      <span className="text-stone-400" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        aria-pressed={accent === "uk"}
        onClick={() => onChange("uk")}
        className={accentButtonClass(accent === "uk")}
      >
        Anh (UK)
      </button>
    </div>
  );
}

function accentButtonClass(selected: boolean): string {
  return `min-h-9 rounded-full px-3 py-1 font-semibold ${
    selected ? "bg-teal-800 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
  }`;
}
