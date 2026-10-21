import type { DuelFinishedPayload, Role, Scores } from "./game";

export const PROFILE_STORAGE_KEY = "who-wrote-it.profile.v1";
export const RECENT_RESULT_LIMIT = 24;

export type Rank = "Rookie" | "Scout" | "Contender" | "Challenger" | "Headliner" | "Legend";
export type CosmeticId = "violet-sigil" | "signal-mark" | "night-bloom" | "apex-pass" | "oracle-frame" | "legend-seal";

export interface Challenge {
  id: "duels" | "wins" | "correct-guesses";
  label: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
}

export interface PlayerProfile {
  version: 1;
  displayName: string;
  xp: number;
  level: number;
  equippedCosmetic: CosmeticId;
  unlockedCosmetics: CosmeticId[];
  stats: {
    duels: number;
    wins: number;
    roundsWon: number;
    correctGuesses: number;
    guessAttempts: number;
    writerRounds: number;
    fooledGuesser: number;
    bestWinStreak: number;
    winStreak: number;
  };
  challenges: Challenge[];
  appliedResultIds: string[];
}

export interface DuelReward {
  total: number;
  base: number;
  win: number;
  rounds: number;
  challenges: number;
  previousLevel: number;
  level: number;
  leveledUp: boolean;
  previousRank: Rank;
  rank: Rank;
  promoted: boolean;
  newCosmetic?: CosmeticId;
  challengeCompletions: string[];
}

const ranks: Array<{ minLevel: number; name: Rank }> = [
  { minLevel: 32, name: "Legend" },
  { minLevel: 22, name: "Headliner" },
  { minLevel: 14, name: "Challenger" },
  { minLevel: 8, name: "Contender" },
  { minLevel: 4, name: "Scout" },
  { minLevel: 1, name: "Rookie" },
];

const unlocks: Record<number, CosmeticId> = {
  2: "violet-sigil",
  5: "signal-mark",
  9: "night-bloom",
  14: "apex-pass",
  20: "oracle-frame",
  30: "legend-seal",
};

export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 25;
}

export function rankForLevel(level: number): Rank {
  return ranks.find((rank) => level >= rank.minLevel)?.name ?? "Rookie";
}

export function createDefaultProfile(): PlayerProfile {
  return {
    version: 1,
    displayName: "Player",
    xp: 0,
    level: 1,
    equippedCosmetic: "violet-sigil",
    unlockedCosmetics: ["violet-sigil"],
    stats: { duels: 0, wins: 0, roundsWon: 0, correctGuesses: 0, guessAttempts: 0, writerRounds: 0, fooledGuesser: 0, bestWinStreak: 0, winStreak: 0 },
    challenges: [
      { id: "duels", label: "Enter the circuit", target: 3, progress: 0, reward: 25, completed: false },
      { id: "wins", label: "Claim two duels", target: 2, progress: 0, reward: 25, completed: false },
      { id: "correct-guesses", label: "Make five correct reads", target: 5, progress: 0, reward: 25, completed: false },
    ],
    appliedResultIds: [],
  };
}

function advanceLevels(profile: PlayerProfile, amount: number): { level: number; xp: number; newCosmetic?: CosmeticId } {
  let xp = profile.xp + amount;
  let level = profile.level;
  let newCosmetic: CosmeticId | undefined;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    newCosmetic = unlocks[level] ?? newCosmetic;
  }
  return { level, xp, newCosmetic };
}

function updateChallenges(challenges: Challenge[], role: Role, won: boolean, scores: Scores): { challenges: Challenge[]; earned: number; completed: string[] } {
  let earned = 0;
  const completed: string[] = [];
  const next = challenges.map((challenge) => {
    const increment = challenge.id === "duels" ? 1 : challenge.id === "wins" ? (won ? 1 : 0) : role === "guesser" ? scores.guesser : 0;
    const progress = Math.min(challenge.target, challenge.progress + increment);
    const nowCompleted = progress >= challenge.target;
    if (!challenge.completed && nowCompleted) {
      earned += challenge.reward;
      completed.push(challenge.label);
    }
    return { ...challenge, progress, completed: challenge.completed || nowCompleted };
  });
  return { challenges: next, earned, completed };
}

export function applyDuelResult(profile: PlayerProfile, result: DuelFinishedPayload, role: Role): { profile: PlayerProfile; reward: DuelReward | null } {
  if (profile.appliedResultIds.includes(result.duelId)) return { profile, reward: null };

  const won = result.winner === role;
  const roundsWon = result.scores[role];
  const challengeUpdate = updateChallenges(profile.challenges, role, won, result.scores);
  const base = 40;
  const win = won ? 35 : 0;
  const rounds = roundsWon * 8;
  const total = base + win + rounds + challengeUpdate.earned;
  const previousRank = rankForLevel(profile.level);
  const levelUpdate = advanceLevels(profile, total);
  const newCosmetics = levelUpdate.newCosmetic && !profile.unlockedCosmetics.includes(levelUpdate.newCosmetic)
    ? [...profile.unlockedCosmetics, levelUpdate.newCosmetic]
    : profile.unlockedCosmetics;
  const stats = {
    ...profile.stats,
    duels: profile.stats.duels + 1,
    wins: profile.stats.wins + (won ? 1 : 0),
    roundsWon: profile.stats.roundsWon + roundsWon,
    correctGuesses: profile.stats.correctGuesses + (role === "guesser" ? result.scores.guesser : 0),
    guessAttempts: profile.stats.guessAttempts + (role === "guesser" ? result.totalRounds : 0),
    writerRounds: profile.stats.writerRounds + (role === "writer" ? result.totalRounds : 0),
    fooledGuesser: profile.stats.fooledGuesser + (role === "writer" ? result.scores.writer : 0),
    winStreak: won ? profile.stats.winStreak + 1 : 0,
    bestWinStreak: won ? Math.max(profile.stats.bestWinStreak, profile.stats.winStreak + 1) : profile.stats.bestWinStreak,
  };
  const nextProfile: PlayerProfile = {
    ...profile,
    xp: levelUpdate.xp,
    level: levelUpdate.level,
    unlockedCosmetics: newCosmetics,
    stats,
    challenges: challengeUpdate.challenges,
    appliedResultIds: [...profile.appliedResultIds, result.duelId].slice(-RECENT_RESULT_LIMIT),
  };
  const rank = rankForLevel(nextProfile.level);
  return {
    profile: nextProfile,
    reward: { total, base, win, rounds, challenges: challengeUpdate.earned, previousLevel: profile.level, level: nextProfile.level, leveledUp: nextProfile.level > profile.level, previousRank, rank, promoted: rank !== previousRank, newCosmetic: levelUpdate.newCosmetic, challengeCompletions: challengeUpdate.completed },
  };
}
