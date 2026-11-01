import { generateText, Output } from "ai";
import type { ZodType } from "zod";

import { lessons } from "@/lib/lessons";
import { mockPractice } from "@/lib/mock-ai";
import {
  difficultySchema,
  reviewSchema,
  scoreSchema,
  vocabSchema,
  type DifficultyResult,
  type PracticeRequest,
  type ReviewResult,
  type ScoreResult,
  type VocabResult,
} from "@/lib/schemas";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

function readEnv(name: string): string | undefined {
  return process.env[name];
}

export function isMockAi(): boolean {
  const value = readEnv("MOCK_AI");
  return value === "1" || value === "true";
}

function modelId(): string {
  return readEnv("AI_GATEWAY_MODEL")?.trim() || DEFAULT_MODEL;
}

const instructions = `You help Vietnamese learners practice spoken English by summarizing a short video.
This is shadowing by summary: the learner retells the ideas, they do not repeat every sentence.
Learning content must be in natural English. Fields ending in Vi must be concise Vietnamese.
Do not assess pronunciation. Base scores on the summary text and the CEFR spoken-production scale:
A1 isolated phrases; A2 simple sentences on familiar topics; B1 connected description with reasons;
B2 clear detailed description; C1 fluent structured speech; C2 precise and nuanced speech.
Sub-scores are integers from 0 to 100.`;

async function objectFromModel<T>(schema: ZodType<T>, name: string, prompt: string): Promise<T> {
  const { output } = await generateText({
    model: modelId(),
    instructions,
    prompt,
    temperature: 0.3,
    maxOutputTokens: 2500,
    output: Output.object({ schema, name }),
  });
  const parsed = schema.safeParse(output);
  if (!parsed.success) {
    throw new Error(`structured output failed for ${name}`);
  }
  return parsed.data;
}

function sourceBlock(input: { title: string; transcript: string; summary?: string }): string {
  return `Video title: ${input.title}
Transcript:
${input.transcript.slice(0, 8000)}
${input.summary ? `Learner summary:\n${input.summary}` : ""}`;
}

const lessonMenu = lessons
  .map((lesson) => `- ${lesson.id}: ${lesson.title} (${lesson.level}, ${lesson.minutes} min) ${lesson.blurbVi}`)
  .join("\n");

export async function runPractice(
  input: PracticeRequest,
): Promise<{ mock: boolean; data: VocabResult | ScoreResult | ReviewResult | DifficultyResult }> {
  if (isMockAi()) {
    return { mock: true, data: mockPractice(input) };
  }
  if (input.task === "vocab") {
    const data = await objectFromModel(
      vocabSchema,
      "vocabulary",
      `${sourceBlock(input)}
Choose 8 useful words or short phrases from the video. Skip people's names.
For each item give phrase, explanationEn (one simple English sentence), explanationVi (one Vietnamese sentence), and an original example sentence.`,
    );
    return { mock: false, data };
  }
  if (input.task === "score") {
    const data = await objectFromModel(
      scoreSchema,
      "cefrScore",
      `${sourceBlock(input)}
Score the learner summary for spoken production.
contentCoverage = how many main ideas from the transcript appear.
range = vocabulary and grammar variety.
accuracy = grammar and word choice, not pronunciation.
fluencyCoherence = linking and organization of the summary.
overallLevel is the CEFR spoken level. feedbackVi is 2 short Vietnamese sentences with one concrete improvement.
modelSummary is a better 70-110 word summary in spoken English the learner could say aloud.`,
    );
    return { mock: false, data };
  }
  if (input.task === "review") {
    const data = await objectFromModel(
      reviewSchema,
      "bloomReview",
      `${sourceBlock(input)}
Write exactly 6 multiple-choice questions, one for each Bloom level, in this order: remember, understand, apply, analyze, evaluate, create.
Each question has an English prompt, exactly 4 English choices, answerIndex 0-3, and explanationEn.
Every question must be answerable from the transcript. The create question asks which new sentence best extends the video.`,
    );
    return { mock: false, data };
  }
  const data = await objectFromModel(
    difficultySchema,
    "difficulty",
    `${sourceBlock(input)}
Scores: level ${input.overallLevel}, content ${input.contentCoverage}, range ${input.range}, accuracy ${input.accuracy}, fluency ${input.fluencyCoherence}.
Quiz: ${input.quizCorrect}/${input.quizTotal}.
Built-in lessons:
${lessonMenu}
Recommend up, down, or stay. targetLevel is the CEFR level for the next practice.
reasonVi explains the choice in Vietnamese. nextTitle is a concrete next lesson.
nextLessonId must be one of the built-in ids when that lesson fits, otherwise an empty string and a specific video idea the learner can paste.
nextBriefVi says why that next lesson helps.`,
  );
  return { mock: false, data };
}
