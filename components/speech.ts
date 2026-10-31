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

export type VoiceLike = {
  lang: string;
  name?: string;
};

const NO_SPEECH =
  "Trình duyệt này không đọc được tiếng Anh. Hãy đọc theo chữ trên màn hình.";
const SPEAK_FAILED =
  "Không phát được giọng đọc. Hãy thử lại, hoặc đọc theo chữ trên màn hình.";

/**
 * Prefer a US English voice, then British English, then any English voice.
 * An empty list is fine: callers still speak with utterance.lang.
 */
export function pickEnglishVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const exact = (lang: string) => english.find((voice) => voice.lang.toLowerCase() === lang);
  const prefix = (lang: string) =>
    english.find((voice) => voice.lang.toLowerCase().startsWith(`${lang}-`) || voice.lang.toLowerCase().startsWith(lang));
  return exact("en-us") ?? exact("en-gb") ?? prefix("en-us") ?? prefix("en-gb") ?? english[0] ?? null;
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
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
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

  const utterance = new SpeechSynthesisUtterance(trimmed);
  activeUtterance = utterance;
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  const voice = pickEnglishVoice(cachedVoices.length > 0 ? cachedVoices : synth.getVoices());
  if (voice) utterance.voice = voice;

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
  const requestId = useRef(0);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const load = () => {
      cachedVoices = synth.getVoices();
    };
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  function speak(text: string, key: string) {
    const id = requestId.current + 1;
    requestId.current = id;
    setNotice(null);
    speakEnglish(text, {
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

  return { speak, activeKey, notice };
}
