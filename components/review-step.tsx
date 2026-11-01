import type { BloomLevel, ReviewResult } from "@/lib/schemas";

const bloomLevels: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

import { Button, Panel } from "@/components/ui";

const bloomVi: Record<BloomLevel, string> = {
  remember: "Nhớ",
  understand: "Hiểu",
  apply: "Vận dụng",
  analyze: "Phân tích",
  evaluate: "Đánh giá",
  create: "Sáng tạo",
};

export type QuizState = {
  index: number;
  points: number;
  streak: number;
  picked: number | null;
  correctCount: number;
  finished: boolean;
};

export const emptyQuiz: QuizState = {
  index: 0,
  points: 0,
  streak: 0,
  picked: null,
  correctCount: 0,
  finished: false,
};

export function ReviewStep({
  review,
  quiz,
  onQuiz,
  onContinue,
  busy,
}: {
  review: ReviewResult;
  quiz: QuizState;
  onQuiz: (quiz: QuizState) => void;
  onContinue: () => void;
  busy: boolean;
}) {
  const questions = [...review.questions].sort(
    (a, b) => bloomLevels.indexOf(a.bloom) - bloomLevels.indexOf(b.bloom),
  );
  const question = questions[quiz.index];
  const progress = quiz.finished ? 100 : Math.round((quiz.index / questions.length) * 100);

  function choose(choice: number) {
    if (!question || quiz.picked !== null || quiz.finished) return;
    const correct = choice === question.answerIndex;
    onQuiz({
      ...quiz,
      picked: choice,
      points: quiz.points + (correct ? 100 + quiz.streak * 20 : 0),
      streak: correct ? quiz.streak + 1 : 0,
      correctCount: quiz.correctCount + (correct ? 1 : 0),
    });
  }

  function next() {
    if (quiz.index + 1 >= questions.length) {
      onQuiz({ ...quiz, finished: true });
      return;
    }
    onQuiz({ ...quiz, index: quiz.index + 1, picked: null });
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Ôn theo thang Bloom</h2>
          <p className="text-sm text-stone-600">Trả lời ngay để giữ chuỗi đúng.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-semibold ring-1 ring-stone-200">
            Điểm {quiz.points}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-800 ring-1 ring-orange-100">
            Chuỗi {quiz.streak}
          </span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
      </div>

      {quiz.finished || !question ? (
        <Panel>
          <h3 className="text-xl font-semibold">
            Bạn đúng {quiz.correctCount}/{questions.length}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tổng điểm {quiz.points}. Phần này luyện nhớ và suy nghĩ về video, không thay cho điểm nói ở bước trước.
          </p>
          <Button className="mt-4" onClick={onContinue} disabled={busy}>
            {busy ? "Đang gợi ý…" : "Tiếp tục: Độ khó"}
          </Button>
        </Panel>
      ) : (
        <Panel>
          <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">
            {quiz.index + 1}/{questions.length} · {bloomVi[question.bloom]}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-8">{question.prompt}</h3>
          <div className="mt-4 grid gap-2">
            {question.choices.map((choice, index) => {
              const revealed = quiz.picked !== null;
              const isAnswer = index === question.answerIndex;
              const isPicked = index === quiz.picked;
              let tone = "bg-stone-50 ring-stone-200 hover:ring-teal-700";
              if (revealed && isAnswer) tone = "bg-emerald-50 ring-emerald-600";
              else if (revealed && isPicked) tone = "bg-rose-50 ring-rose-500";
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={revealed}
                  onClick={() => choose(index)}
                  className={`rounded-2xl px-3 py-3 text-left text-sm leading-6 ring-1 ${tone}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {quiz.picked !== null ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-800" aria-live="polite">
                {quiz.picked === question.answerIndex ? "Đúng." : "Chưa đúng."} {question.explanationEn}
              </p>
              <Button className="mt-3" onClick={next}>
                {quiz.index + 1 === questions.length ? "Xem kết quả" : "Câu tiếp"}
              </Button>
            </div>
          ) : null}
        </Panel>
      )}
    </div>
  );
}
