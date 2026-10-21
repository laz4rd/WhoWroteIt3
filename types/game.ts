export type Role = "writer" | "guesser";

export type Source = "human" | "ai";

export const TOTAL_ROUNDS = 5;

export const ROUND_CHALLENGES = [
  "Warm-up · Write naturally",
  "Add a small, believable detail",
  "Make it oddly specific",
  "Try to sound completely convincing",
  "Final round · Be unexpected",
] as const;

export function challengeForRound(round: number): string {
  return ROUND_CHALLENGES[Math.max(0, Math.min(TOTAL_ROUNDS - 1, round - 1))];
}

export type RoundState =
  | "WAITING" // waiting for two players
  | "WRITING" // writer composing sentence
  | "GUESSING" // guesser deciding
  | "REVEAL" // showing the answer
  | "FINISHED"; // duel over, waiting for PLAY AGAIN

export interface Scores {
  writer: number;
  guesser: number;
}

export const MAX_SENTENCE_LENGTH = 200;
export const REVEAL_DURATION_MS = 2200;

// ---- Server -> Client payloads ----

export interface RoundStartPayload {
  topic: string;
  round: number;
  challenge: string;
}

export interface GuessReadyPayload {
  topic: string;
  sentence: string;
  round: number;
  challenge: string;
}

export interface RoundRevealPayload {
  source: Source;
  sentence: string;
  correct: boolean;
  scores: Scores;
  round: number;
}

export interface DuelFinishedPayload {
  winner: Role | "draw";
  scores: Scores;
  duelId: string;
  totalRounds: number;
}

export interface DuelStatusPayload {
  state: RoundState;
  connected: { writer: boolean; guesser: boolean };
  yourRole?: Role;
  scores: Scores;
  round: number;
  message?: string;
}

// ---- Client -> Server payloads ----

export interface WriterSubmitPayload {
  sentence: string;
}

export interface GuesserGuessPayload {
  guess: Source;
}
