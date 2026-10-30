"use client";

import { useEffect, useRef, useState } from "react";

import { DifficultyStep } from "@/components/difficulty-step";
import { emptyQuiz, ReviewStep, type QuizState } from "@/components/review-step";
import { ScoreStep } from "@/components/score-step";
import { createRecognizer } from "@/components/speech";
import { SourceStep } from "@/components/source-step";
import { BrandMark, Button } from "@/components/ui";
import { VocabStep } from "@/components/vocab-step";
import { lessonById, lessons } from "@/lib/lessons";
import type { DifficultyResult, ReviewResult, ScoreResult, VocabResult } from "@/lib/schemas";

const steps = [
  { id: "source", label: "Nguồn" },
  { id: "vocab", label: "Từ vựng" },
  { id: "score", label: "Chấm điểm" },
  { id: "review", label: "Ôn tập" },
  { id: "level", label: "Độ khó" },
] as const;

const firstLesson = lessons[0];

export function PracticeApp() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [mode, setMode] = useState<"lesson" | "link">("lesson");
  const [lessonId, setLessonId] = useState<string | null>(firstLesson?.id ?? null);
  const [youtubeId, setYoutubeId] = useState<string | null>(firstLesson?.youtubeId ?? null);
  const [title, setTitle] = useState(firstLesson?.title ?? "");
  const [transcript, setTranscript] = useState(firstLesson?.transcript ?? "");
  const [summary, setSummary] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState<"idle" | "loading" | "ready" | "manual">("ready");
  const [transcriptMessage, setTranscriptMessage] = useState<string | null>(null);
  const [vocab, setVocab] = useState<VocabResult | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyResult | null>(null);
  const [quiz, setQuiz] = useState<QuizState>(emptyQuiz);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/practice")
      .then((response) => response.json())
      .then((body: { mock?: boolean }) => {
        if (!cancelled && body.mock) setMockMode(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      recognizerRef.current?.abort();
    };
  }, []);

  function stopListening() {
    recognizerRef.current?.stop();
    setListening(false);
    setInterim("");
  }

  function invalidateSummaryResults() {
    setScore(null);
    setReview(null);
    setDifficulty(null);
    setQuiz(emptyQuiz);
    setMaxStep((current) => Math.min(current, 1));
  }

  function updateSummary(next: string) {
    setSummary(next);
    invalidateSummaryResults();
  }

  function pickLesson(id: string) {
    const lesson = lessonById(id);
    if (!lesson) return;
    stopListening();
    setMode("lesson");
    setLessonId(lesson.id);
    setYoutubeId(lesson.youtubeId);
    setTitle(lesson.title);
    setTranscript(lesson.transcript);
    setTranscriptStatus("ready");
    setTranscriptMessage(null);
    setSummary("");
    setVocab(null);
    setScore(null);
    setReview(null);
    setDifficulty(null);
    setQuiz(emptyQuiz);
    setStep(0);
    setMaxStep(0);
    setError(null);
  }

  function toggleListen() {
    if (listening) {
      stopListening();
      return;
    }
    const recognizer = createRecognizer({
      onFinal: (chunk) => {
        setSummary((current) => (current.trim() ? `${current.trim()} ${chunk}` : chunk));
        invalidateSummaryResults();
        setInterim("");
      },
      onInterim: setInterim,
      onEnd: () => setListening(false),
      onError: (message) => {
        setSpeechError(message);
        setListening(false);
      },
    });
    if (!recognizer) {
      setSpeechError("Trình duyệt này không hỗ trợ nhận giọng nói. Hãy gõ bản tóm tắt.");
      return;
    }
    recognizerRef.current = recognizer;
    setSpeechError(null);
    try {
      recognizer.start();
      setListening(true);
    } catch {
      setSpeechError("Không bật được micro. Hãy gõ bản tóm tắt.");
    }
  }

  async function loadCustom() {
    setError(null);
    setTranscriptStatus("loading");
    setTranscriptMessage(null);
    stopListening();
    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customUrl }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        videoId?: string;
        title?: string;
        transcript?: string;
        message?: string;
      };
      if (!response.ok || !body.videoId) {
        setTranscriptStatus("manual");
        setTranscriptMessage(body.message ?? "Link YouTube không hợp lệ.");
        return;
      }
      setLessonId(null);
      setYoutubeId(body.videoId);
      setTitle(body.title || "Video YouTube");
      setSummary("");
      setVocab(null);
      setScore(null);
      setReview(null);
      setDifficulty(null);
      setQuiz(emptyQuiz);
      setMaxStep(0);
      if (body.ok && body.transcript) {
        setTranscript(body.transcript);
        setTranscriptStatus("ready");
      } else {
        setTranscript("");
        setTranscriptStatus("manual");
        setTranscriptMessage(body.message ?? "Hãy dán phụ đề tiếng Anh.");
      }
    } catch {
      setTranscriptStatus("manual");
      setTranscriptMessage("Không kết nối được để lấy phụ đề. Hãy dán phụ đề vào ô bên dưới.");
    }
  }

  async function post<T>(payload: unknown): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        mock?: boolean;
        message?: string;
        data?: T;
      };
      if (body.mock) setMockMode(true);
      if (!response.ok || !body.ok || !body.data) {
        setError(body.message ?? "Không xử lý được bước này.");
        return null;
      }
      return body.data;
    } catch {
      setError("Mất kết nối. Hãy thử lại.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const sourcePayload = { title, transcript, lessonId: lessonId ?? undefined };

  async function goVocab() {
    stopListening();
    if (vocab && maxStep >= 1) {
      setStep(1);
      return;
    }
    const data = await post<VocabResult>({ task: "vocab", ...sourcePayload });
    if (!data) return;
    setVocab(data);
    setStep(1);
    setMaxStep((current) => Math.max(current, 1));
  }

  async function goScore() {
    if (score && maxStep >= 2) {
      setStep(2);
      return;
    }
    const data = await post<ScoreResult>({ task: "score", ...sourcePayload, summary });
    if (!data) return;
    setScore(data);
    setStep(2);
    setMaxStep((current) => Math.max(current, 2));
  }

  async function goReview() {
    if (review && maxStep >= 3) {
      setStep(3);
      return;
    }
    const data = await post<ReviewResult>({ task: "review", ...sourcePayload, summary });
    if (!data) return;
    setReview(data);
    setQuiz(emptyQuiz);
    setStep(3);
    setMaxStep((current) => Math.max(current, 3));
  }

  async function goDifficulty() {
    if (!score) return;
    if (difficulty && maxStep >= 4) {
      setStep(4);
      return;
    }
    const data = await post<DifficultyResult>({
      task: "difficulty",
      ...sourcePayload,
      summary,
      overallLevel: score.overallLevel,
      contentCoverage: score.contentCoverage,
      range: score.range,
      accuracy: score.accuracy,
      fluencyCoherence: score.fluencyCoherence,
      quizCorrect: quiz.correctCount,
      quizTotal: review?.questions.length ?? 6,
    });
    if (!data) return;
    setDifficulty(data);
    setStep(4);
    setMaxStep(4);
  }

  function restart() {
    stopListening();
    setStep(0);
    setMaxStep(0);
    setMode("lesson");
    setSummary("");
    setVocab(null);
    setScore(null);
    setReview(null);
    setDifficulty(null);
    setQuiz(emptyQuiz);
    setError(null);
    if (firstLesson) pickLesson(firstLesson.id);
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <BrandMark />
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-none font-semibold">Talk to Earn</p>
            <p className="mt-1 text-sm text-stone-500">Shadowing bằng bản tóm tắt</p>
          </div>
          {mockMode ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              AI mẫu
            </span>
          ) : null}
          <Button variant="ghost" onClick={restart}>
            Bắt đầu lại
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Các bước luyện" className="flex gap-2 overflow-x-auto lg:flex-col">
          {steps.map((item, index) => {
            const unlocked = index <= maxStep;
            const current = index === step;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && setStep(index)}
                className={`min-h-11 shrink-0 rounded-2xl px-3 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                  current ? "bg-teal-800 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
                }`}
              >
                <span className={current ? "text-teal-100" : "text-stone-400"}>{index + 1}</span> {item.label}
              </button>
            );
          })}
        </nav>

        <div data-step={steps[step]?.id}>
          {step === 0 ? (
            <SourceStep
              mode={mode}
              lessonId={lessonId}
              youtubeId={youtubeId}
              title={title}
              transcript={transcript}
              summary={summary}
              interim={interim}
              listening={listening}
              speechError={speechError}
              customUrl={customUrl}
              transcriptStatus={transcriptStatus}
              transcriptMessage={transcriptMessage}
              busy={busy}
              error={error}
              onMode={(next) => {
                setMode(next);
                if (next === "lesson" && !lessonId && firstLesson) pickLesson(firstLesson.id);
              }}
              onPickLesson={pickLesson}
              onCustomUrl={setCustomUrl}
              onLoadCustom={() => void loadCustom()}
              onTranscript={(text) => {
                setTranscript(text);
                setVocab(null);
                setScore(null);
                setReview(null);
                setDifficulty(null);
                setMaxStep(0);
              }}
              onSummary={updateSummary}
              onToggleListen={toggleListen}
              onContinue={() => void goVocab()}
            />
          ) : null}
          {step === 1 && vocab ? (
            <VocabStep vocab={vocab} busy={busy} error={error} onContinue={() => void goScore()} />
          ) : null}
          {step === 2 && score ? (
            <ScoreStep score={score} busy={busy} error={error} onContinue={() => void goReview()} />
          ) : null}
          {step === 3 && review ? (
            <ReviewStep
              review={review}
              quiz={quiz}
              onQuiz={setQuiz}
              busy={busy}
              onContinue={() => void goDifficulty()}
            />
          ) : null}
          {step === 4 && difficulty ? (
            <DifficultyStep result={difficulty} onStartLesson={pickLesson} onRestart={restart} />
          ) : null}
        </div>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs leading-5 text-stone-500">
        Không cần đăng nhập. Bài làm chỉ nằm trên trình duyệt và mất khi bạn tải lại trang. Phiên bản này chưa chấm phát âm.
      </footer>
    </div>
  );
}
