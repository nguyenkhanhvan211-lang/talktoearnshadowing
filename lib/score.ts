import type { CefrLevel } from "@/lib/schemas";
import { splitSentences } from "@/lib/transcript";

const STOP = new Set(
  "a an the and or but if so to of in on for with at from by as is are was were be been being it this that these those i you he she we they me my your our their not no do did does have has had will would can could just very really about into than then".split(
    " ",
  ),
);

const RANK: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export function cefrRank(level: CefrLevel): number {
  return RANK[level];
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function contentWords(text: string): string[] {
  return tokenize(text).filter((word) => word.length > 2 && !STOP.has(word));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export type SummaryScores = {
  overallLevel: CefrLevel;
  contentCoverage: number;
  range: number;
  accuracy: number;
  fluencyCoherence: number;
};

export function scoreSummary(transcript: string, summary: string): SummaryScores {
  const source = contentWords(transcript);
  const sourceSet = new Set(source);
  const spoken = contentWords(summary);
  const words = tokenize(summary);
  const uniqueHits = new Set(spoken.filter((word) => sourceSet.has(word)));
  const precision = spoken.length === 0 ? 0 : uniqueHits.size / spoken.length;
  const recall =
    sourceSet.size === 0 ? 0 : uniqueHits.size / Math.min(sourceSet.size, 24);
  const contentCoverage = clamp((precision * 0.4 + recall * 0.6) * 100);

  const uniqueRatio = words.length === 0 ? 0 : new Set(words).size / words.length;
  const lengthScore = Math.min(words.length / 45, 1);
  const range = clamp((uniqueRatio * 0.35 + lengthScore * 0.65) * 100);

  const sentences = splitSentences(summary);
  const capitalized = sentences.filter((sentence) => /^[A-Z]/.test(sentence)).length;
  const ended = sentences.filter((sentence) => /[.!?]$/.test(sentence)).length;
  const accuracy = clamp(
    (sentences.length === 0
      ? 0
      : (capitalized / sentences.length) * 40 + (ended / sentences.length) * 30) +
      Math.min(uniqueHits.size, 8) * 4,
  );

  const links = (
    summary.match(/\b(because|so|but|and|then|after|when|which|while|also)\b/gi) ??
    []
  ).length;
  const fluencyCoherence = clamp(
    (Math.min(sentences.length, 4) / 4) * 55 + (Math.min(links, 4) / 4) * 45,
  );

  const average =
    contentCoverage * 0.4 + range * 0.2 + accuracy * 0.2 + fluencyCoherence * 0.2;
  const overallLevel = levelFor(average, words.length);

  return {
    overallLevel,
    contentCoverage,
    range,
    accuracy,
    fluencyCoherence,
  };
}

function levelFor(average: number, wordCount: number): CefrLevel {
  if (wordCount < 8) return "A1";
  if (average >= 88 && wordCount >= 80) return "C2";
  if (average >= 80 && wordCount >= 60) return "C1";
  if (average >= 68 && wordCount >= 40) return "B2";
  if (average >= 52 && wordCount >= 22) return "B1";
  if (average >= 32 && wordCount >= 12) return "A2";
  return "A1";
}

export function weakestSubscore(scores: SummaryScores): keyof Omit<SummaryScores, "overallLevel"> {
  const entries = [
    ["contentCoverage", scores.contentCoverage],
    ["range", scores.range],
    ["accuracy", scores.accuracy],
    ["fluencyCoherence", scores.fluencyCoherence],
  ] as const;
  return entries.reduce((lowest, entry) => (entry[1] < lowest[1] ? entry : lowest))[0];
}
