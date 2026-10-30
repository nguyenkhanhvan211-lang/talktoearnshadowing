import type { DifficultyResult } from "@/lib/schemas";

import { lessonById } from "@/lib/lessons";
import { Button, Panel } from "@/components/ui";

const copy = {
  up: { title: "Nên lên trình", tone: "bg-teal-800 text-white" },
  stay: { title: "Nên giữ trình", tone: "bg-stone-800 text-white" },
  down: { title: "Nên hạ trình một chút", tone: "bg-orange-700 text-white" },
} as const;

export function DifficultyStep({
  result,
  onStartLesson,
  onRestart,
}: {
  result: DifficultyResult;
  onStartLesson: (lessonId: string) => void;
  onRestart: () => void;
}) {
  const lesson = lessonById(result.nextLessonId);
  const banner = copy[result.recommendation];

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <section className={`rounded-3xl p-5 shadow-sm ${banner.tone}`}>
        <p className="text-sm font-semibold opacity-80">Bước tiếp theo</p>
        <h2 className="mt-1 text-3xl font-semibold">{banner.title}</h2>
        <p className="mt-3 text-sm leading-6 opacity-95">{result.reasonVi}</p>
        <p className="mt-3 text-sm font-semibold">Mức gợi ý: {result.targetLevel}</p>
      </section>
      <Panel>
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Bài nên học tiếp</p>
        <h3 className="mt-2 text-2xl font-semibold">{result.nextTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-700">{result.nextBriefVi}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lesson ? (
            <Button onClick={() => onStartLesson(lesson.id)}>Học bài này</Button>
          ) : (
            <Button onClick={onRestart}>Dán video mới</Button>
          )}
          <Button variant="ghost" onClick={onRestart}>
            Làm lại từ đầu
          </Button>
        </div>
      </Panel>
    </div>
  );
}
