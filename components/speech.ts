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

export function speakEnglish(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}
