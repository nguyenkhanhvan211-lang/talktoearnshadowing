import { z } from "zod";

export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const cefrSchema = z.enum(cefrLevels);
export type CefrLevel = z.infer<typeof cefrSchema>;

export const bloomLevels = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
] as const;
export const bloomSchema = z.enum(bloomLevels);
export type BloomLevel = z.infer<typeof bloomSchema>;

export const vocabItemSchema = z.object({
  phrase: z.string().min(1).max(80),
  explanationEn: z.string().min(1).max(280),
  explanationVi: z.string().min(1).max(280),
  example: z.string().min(1).max(240),
});

export const vocabSchema = z.object({
  items: z.array(vocabItemSchema).min(6).max(10),
});
export type VocabResult = z.infer<typeof vocabSchema>;

export const scoreSchema = z.object({
  overallLevel: cefrSchema,
  contentCoverage: z.number().min(0).max(100),
  range: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  fluencyCoherence: z.number().min(0).max(100),
  feedbackVi: z.string().min(1).max(600),
  modelSummary: z.string().min(1).max(1200),
});
export type ScoreResult = z.infer<typeof scoreSchema>;

export const reviewQuestionSchema = z.object({
  bloom: bloomSchema,
  prompt: z.string().min(1).max(320),
  choices: z.array(z.string().min(1).max(220)).min(4).max(4),
  answerIndex: z.number().int().min(0).max(3),
  explanationEn: z.string().min(1).max(320),
});

export const reviewSchema = z.object({
  questions: z
    .array(reviewQuestionSchema)
    .min(6)
    .max(6)
    .refine(
      (questions) => new Set(questions.map((question) => question.bloom)).size === 6,
      "Questions must cover every Bloom level once.",
    ),
});
export type ReviewResult = z.infer<typeof reviewSchema>;

export const difficultySchema = z.object({
  recommendation: z.enum(["up", "down", "stay"]),
  targetLevel: cefrSchema,
  reasonVi: z.string().min(1).max(500),
  nextLessonId: z.string().max(40),
  nextTitle: z.string().min(1).max(140),
  nextBriefVi: z.string().min(1).max(400),
});
export type DifficultyResult = z.infer<typeof difficultySchema>;

const sourceFields = {
  title: z.string().min(1).max(200),
  transcript: z.string().min(40).max(20000),
  lessonId: z.string().max(40).optional(),
};

export const practiceRequestSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("vocab"),
    ...sourceFields,
  }),
  z.object({
    task: z.literal("score"),
    ...sourceFields,
    summary: z.string().min(8).max(4000),
  }),
  z.object({
    task: z.literal("review"),
    ...sourceFields,
    summary: z.string().min(8).max(4000),
  }),
  z.object({
    task: z.literal("difficulty"),
    ...sourceFields,
    summary: z.string().min(8).max(4000),
    overallLevel: cefrSchema,
    contentCoverage: z.number().min(0).max(100),
    range: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
    fluencyCoherence: z.number().min(0).max(100),
    quizCorrect: z.number().int().min(0).max(6),
    quizTotal: z.number().int().min(1).max(6),
  }),
]);
export type PracticeRequest = z.infer<typeof practiceRequestSchema>;
