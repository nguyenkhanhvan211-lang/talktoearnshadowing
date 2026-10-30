import type { VocabResult } from "@/lib/schemas";

import { speakEnglish } from "@/components/speech";
import { Button, ErrorNote, Panel } from "@/components/ui";

export function VocabStep({
  vocab,
  busy,
  error,
  onContinue,
}: {
  vocab: VocabResult;
  busy: boolean;
  error: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Từ và cụm nên nhớ</h2>
        <p className="mt-1 text-sm text-stone-600">
          {vocab.items.length} mục lấy từ video. Bấm Nghe để nghe phát âm mẫu của trình duyệt.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {vocab.items.map((item) => (
          <Panel key={item.phrase}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-teal-900">{item.phrase}</h3>
              <Button
                variant="ghost"
                className="shrink-0"
                onClick={() => speakEnglish(`${item.phrase}. ${item.example}`)}
              >
                Nghe
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-800">{item.explanationEn}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{item.explanationVi}</p>
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm leading-6 text-stone-800">
              {item.example}
            </p>
          </Panel>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <ErrorNote message={error} />
        <Button onClick={onContinue} disabled={busy}>
          {busy ? "Đang chấm…" : "Tiếp tục: Chấm điểm"}
        </Button>
      </div>
    </div>
  );
}
