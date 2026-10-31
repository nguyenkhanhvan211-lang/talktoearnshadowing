import type { ScoreResult } from "@/lib/schemas";

import { useEnglishSpeech } from "@/components/speech";
import { Button, ErrorNote, Panel } from "@/components/ui";

const labels: Record<keyof Omit<ScoreResult, "overallLevel" | "feedbackVi" | "modelSummary">, string> = {
  contentCoverage: "Độ bao phủ nội dung",
  range: "Độ rộng ngôn ngữ",
  accuracy: "Độ chính xác",
  fluencyCoherence: "Trôi chảy và mạch lạc",
};

export function ScoreStep({
  score,
  busy,
  error,
  onContinue,
}: {
  score: ScoreResult;
  busy: boolean;
  error: string | null;
  onContinue: () => void;
}) {
  const speech = useEnglishSpeech();
  const bars = [
    ["contentCoverage", score.contentCoverage],
    ["range", score.range],
    ["accuracy", score.accuracy],
    ["fluencyCoherence", score.fluencyCoherence],
  ] as const;

  return (
    <div className="grid gap-4">
      <Panel>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-teal-800 text-white">
            <span className="text-4xl font-semibold">{score.overallLevel}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800">Trình độ nói theo CEFR</p>
            <h2 className="mt-1 text-2xl font-semibold">Mức tổng: {score.overallLevel}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
              Điểm dựa trên bản tóm tắt của bạn so với phụ đề. Chưa chấm phát âm trong phiên bản này.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {bars.map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{labels[key]}</span>
                <span className="font-semibold">{Math.round(value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="font-semibold">Nhận xét</h2>
        <p className="mt-2 text-sm leading-6 text-stone-800">{score.feedbackVi}</p>
      </Panel>
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">Bản tóm tắt mẫu</h2>
          <Button
            variant="ghost"
            className="shrink-0 min-w-28"
            aria-pressed={speech.activeKey === "summary"}
            onClick={() => speech.speak(score.modelSummary, "summary")}
          >
            {speech.activeKey === "summary" ? "Đang đọc…" : "Nghe"}
          </Button>
        </div>
        {speech.notice ? (
          <div className="mt-3">
            <ErrorNote message={speech.notice} />
          </div>
        ) : null}
        <p className="mt-2 text-sm leading-7 text-stone-800">{score.modelSummary}</p>
      </Panel>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <ErrorNote message={error} />
        <Button onClick={onContinue} disabled={busy}>
          {busy ? "Đang soạn câu hỏi…" : "Tiếp tục: Ôn tập"}
        </Button>
      </div>
    </div>
  );
}
