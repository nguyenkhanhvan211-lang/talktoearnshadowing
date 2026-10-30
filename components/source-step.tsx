import { lessons } from "@/lib/lessons";
import { splitSentences, wordCount } from "@/lib/transcript";

import { Button, ErrorNote, Panel } from "@/components/ui";

const MIN_WORDS = 12;

export function SourceStep({
  mode,
  lessonId,
  youtubeId,
  title,
  transcript,
  summary,
  interim,
  listening,
  speechError,
  customUrl,
  transcriptStatus,
  transcriptMessage,
  busy,
  error,
  onMode,
  onPickLesson,
  onCustomUrl,
  onLoadCustom,
  onTranscript,
  onSummary,
  onToggleListen,
  onContinue,
}: {
  mode: "lesson" | "link";
  lessonId: string | null;
  youtubeId: string | null;
  title: string;
  transcript: string;
  summary: string;
  interim: string;
  listening: boolean;
  speechError: string | null;
  customUrl: string;
  transcriptStatus: "idle" | "loading" | "ready" | "manual";
  transcriptMessage: string | null;
  busy: boolean;
  error: string | null;
  onMode: (mode: "lesson" | "link") => void;
  onPickLesson: (id: string) => void;
  onCustomUrl: (url: string) => void;
  onLoadCustom: () => void;
  onTranscript: (text: string) => void;
  onSummary: (text: string) => void;
  onToggleListen: () => void;
  onContinue: () => void;
}) {
  const lines = splitSentences(transcript);
  const words = wordCount(summary);
  const ready = transcript.trim().length >= 40 && words >= MIN_WORDS;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={tabClass(mode === "lesson")}
          onClick={() => onMode("lesson")}
        >
          Bài có sẵn
        </button>
        <button
          type="button"
          className={tabClass(mode === "link")}
          onClick={() => onMode("link")}
        >
          Dán link YouTube
        </button>
      </div>

      {mode === "lesson" ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {lessons.map((lesson) => {
            const selected = lesson.id === lessonId;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onPickLesson(lesson.id)}
                className={`rounded-2xl px-3 py-3 text-left ring-1 transition ${
                  selected
                    ? "bg-teal-800 text-white ring-teal-800"
                    : "bg-white text-stone-800 ring-stone-200 hover:ring-teal-700"
                }`}
              >
                <span className={`text-xs font-semibold ${selected ? "text-teal-100" : "text-teal-800"}`}>
                  {lesson.level} · {lesson.minutes} phút
                </span>
                <span className="mt-1 block font-semibold">{lesson.title}</span>
                <span className={`mt-1 block text-xs leading-5 ${selected ? "text-teal-50" : "text-stone-500"}`}>
                  {lesson.blurbVi}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Panel>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              onLoadCustom();
            }}
          >
            <label className="sr-only" htmlFor="youtube-url">
              Link YouTube
            </label>
            <input
              id="youtube-url"
              value={customUrl}
              onChange={(event) => onCustomUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="min-h-11 flex-1 rounded-2xl bg-stone-50 px-3 text-sm ring-1 ring-stone-200 outline-none focus:ring-teal-700"
            />
            <Button type="submit" disabled={transcriptStatus === "loading"}>
              {transcriptStatus === "loading" ? "Đang lấy phụ đề…" : "Lấy phụ đề"}
            </Button>
          </form>
          <p className="mt-2 text-sm text-stone-500">
            Video hiện ngay trong khung. Nếu YouTube không trả phụ đề, hãy dán lời thoại vào ô bên dưới.
          </p>
        </Panel>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="grid gap-4">
          <Panel>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{title || "Chọn một bài"}</h2>
              <span className="text-xs text-stone-500">Xem rồi tóm tắt ý chính</span>
            </div>
            {youtubeId ? (
              <iframe
                className="aspect-video w-full rounded-2xl bg-stone-900"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-2xl bg-stone-100 text-sm text-stone-500">
                Dán link YouTube để xem video.
              </div>
            )}
            <p className="mt-3 text-sm text-stone-600">
              Hãy tóm tắt video bằng lời của bạn. Đừng nhắc lại từng câu.
            </p>
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Bản tóm tắt của bạn</h2>
                <p className="text-sm text-stone-500">Nói tiếng Anh, hoặc gõ nếu micro không dùng được.</p>
              </div>
              <Button variant={listening ? "coral" : "primary"} onClick={onToggleListen} aria-pressed={listening}>
                {listening ? "Dừng nói" : "Tóm tắt bằng giọng nói"}
              </Button>
            </div>
            <p className="mt-3 min-h-6 text-sm text-teal-800" aria-live="polite">
              {listening ? interim || "Đang nghe…" : speechError}
            </p>
            <label className="sr-only" htmlFor="summary">
              Bản tóm tắt
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(event) => onSummary(event.target.value)}
              rows={6}
              placeholder="Ví dụ: Anna finished her reports quickly, so Andrew says she is on the ball..."
              className="mt-2 w-full rounded-2xl bg-stone-50 px-3 py-3 text-sm leading-6 ring-1 ring-stone-200 outline-none focus:ring-teal-700"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-500">
                {words} từ {words < MIN_WORDS ? `· cần ít nhất ${MIN_WORDS} từ` : ""}
              </p>
              <Button onClick={onContinue} disabled={!ready || busy}>
                {busy ? "Đang chọn từ vựng…" : "Tiếp tục: Từ vựng"}
              </Button>
            </div>
            <ErrorNote message={error} />
          </Panel>
        </div>

        <Panel className="lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Phụ đề để đối chiếu</h2>
            <span className="text-xs text-stone-500">{lines.length} câu</span>
          </div>
          {transcriptStatus === "loading" ? (
            <p className="text-sm text-stone-500">Đang lấy phụ đề từ YouTube…</p>
          ) : lines.length > 0 ? (
            <ol className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {lines.map((line, index) => (
                <li key={`${index}-${line.slice(0, 12)}`} className="flex gap-3 rounded-2xl bg-stone-50 px-3 py-2">
                  <span className="w-8 shrink-0 pt-0.5 text-xs font-semibold text-teal-800">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-6 text-stone-800">{line}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-stone-500">Chưa có phụ đề.</p>
          )}
          {(mode === "link" || transcriptStatus === "manual") && (
            <div className="mt-4">
              <label htmlFor="manual-transcript" className="text-sm font-medium text-stone-700">
                Dán phụ đề tiếng Anh
              </label>
              <textarea
                id="manual-transcript"
                value={transcript}
                onChange={(event) => onTranscript(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl bg-stone-50 px-3 py-3 text-sm leading-6 ring-1 ring-stone-200 outline-none focus:ring-teal-700"
              />
              {transcriptMessage ? <p className="mt-2 text-sm text-amber-800">{transcriptMessage}</p> : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `min-h-11 rounded-full px-4 text-sm font-semibold ${
    active ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
  }`;
}
