import { describe, expect, it } from "vitest";

import { lessons } from "@/lib/lessons";
import { mockPractice } from "@/lib/mock-ai";
import {
  difficultySchema,
  practiceRequestSchema,
  reviewSchema,
  scoreSchema,
  vocabSchema,
} from "@/lib/schemas";
import { cefrRank, scoreSummary } from "@/lib/score";

const lesson = lessons[0];

describe("practice schemas", () => {
  it("accepts a vocabulary payload and rejects a short transcript", () => {
    const request = practiceRequestSchema.parse({
      task: "vocab",
      title: lesson?.title,
      transcript: lesson?.transcript,
      lessonId: lesson?.id,
    });
    expect(request.task).toBe("vocab");
    expect(
      practiceRequestSchema.safeParse({ task: "vocab", title: "x", transcript: "too short" }).success,
    ).toBe(false);
  });

  it("checks mock vocabulary, review, and difficulty against the schemas", () => {
    if (!lesson) throw new Error("missing lesson");
    const vocab = vocabSchema.parse(
      mockPractice({ task: "vocab", title: lesson.title, transcript: lesson.transcript, lessonId: lesson.id }),
    );
    expect(vocab.items.length).toBeGreaterThanOrEqual(6);

    const summary =
      "Anna finished three reports quickly and still had one left. Andrew says she is on the ball because she works ahead of time. She jokes that coffee helped, but he does not want that much.";
    const score = scoreSchema.parse(
      mockPractice({
        task: "score",
        title: lesson.title,
        transcript: lesson.transcript,
        lessonId: lesson.id,
        summary,
      }),
    );
    expect(score.feedbackVi.length).toBeGreaterThan(10);
    expect(score.modelSummary.toLowerCase()).toContain("on the ball");

    const review = reviewSchema.parse(
      mockPractice({
        task: "review",
        title: lesson.title,
        transcript: lesson.transcript,
        lessonId: lesson.id,
        summary,
      }),
    );
    expect(new Set(review.questions.map((question) => question.bloom)).size).toBe(6);

    const difficulty = difficultySchema.parse(
      mockPractice({
        task: "difficulty",
        title: lesson.title,
        transcript: lesson.transcript,
        lessonId: lesson.id,
        summary,
        overallLevel: score.overallLevel,
        contentCoverage: score.contentCoverage,
        range: score.range,
        accuracy: score.accuracy,
        fluencyCoherence: score.fluencyCoherence,
        quizCorrect: 5,
        quizTotal: 6,
      }),
    );
    expect(["up", "down", "stay"]).toContain(difficulty.recommendation);
    expect(difficulty.nextTitle.length).toBeGreaterThan(3);
  });
});

describe("scoreSummary", () => {
  it("rates a detailed summary above a fragment", () => {
    const transcript = lesson?.transcript ?? "";
    const low = scoreSummary(transcript, "Anna works.");
    const high = scoreSummary(
      transcript,
      "Anna had a productive day and finished three reports, with only one more to do. Andrew says she is on the ball because she finished ahead of time. She offers him lots of coffee, but he does not want that much. The phrase means someone works quickly, and get on the ball means they should work faster.",
    );
    expect(high.contentCoverage).toBeGreaterThan(low.contentCoverage);
    expect(cefrRank(high.overallLevel)).toBeGreaterThan(cefrRank(low.overallLevel));
    expect(low.overallLevel).toBe("A1");
  });
});
