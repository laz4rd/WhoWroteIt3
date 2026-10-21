import type { Server, Socket } from "socket.io";
import { pickTopic, resetTopicHistory } from "./topics";
import { generateAiSentenceWithRetry } from "../lib/anthropic";
import {
  MAX_SENTENCE_LENGTH,
  REVEAL_DURATION_MS,
  TOTAL_ROUNDS,
  challengeForRound,
  type DuelStatusPayload,
  type Role,
  type RoundState,
  type Scores,
  type Source,
} from "../types/game";

interface Duel {
  duelId: string;
  writerSocketId: string | null;
  guesserSocketId: string | null;
  writerSeatId: string | null;
  guesserSeatId: string | null;
  round: number;
  state: RoundState;
  topic: string;
  writerSentence: string | null;
  displayedSentence: string | null;
  source: Source | null; // SECRET until reveal
  hasWriterSubmitted: boolean;
  hasGuesserGuessed: boolean;
  scores: Scores;
}

function freshDuel(): Duel {
  return {
    duelId: `duel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    writerSocketId: null,
    guesserSocketId: null,
    writerSeatId: null,
    guesserSeatId: null,
    round: 0,
    state: "WAITING",
    topic: "",
    writerSentence: null,
    displayedSentence: null,
    source: null,
    hasWriterSubmitted: false,
    hasGuesserGuessed: false,
    scores: { writer: 0, guesser: 0 },
  };
}

let duel: Duel = freshDuel();

function roleForSocket(socketId: string): Role | null {
  if (duel.writerSocketId === socketId) return "writer";
  if (duel.guesserSocketId === socketId) return "guesser";
  return null;
}

function seatIdFor(socket: Socket): string {
  const candidate = socket.handshake.auth?.seatId;
  return typeof candidate === "string" && candidate.length <= 80 ? candidate : socket.id;
}

function bothConnected(): boolean {
  return Boolean(duel.writerSocketId && duel.guesserSocketId);
}

function statusPayloadFor(role?: Role): DuelStatusPayload {
  return {
    state: duel.state,
    connected: {
      writer: Boolean(duel.writerSocketId),
      guesser: Boolean(duel.guesserSocketId),
    },
    yourRole: role,
    scores: duel.scores,
    round: duel.round,
  };
}

function broadcastStatus(io: Server) {
  if (duel.writerSocketId) {
    io.to(duel.writerSocketId).emit("duel:status", statusPayloadFor("writer"));
  }
  if (duel.guesserSocketId) {
    io.to(duel.guesserSocketId).emit("duel:status", statusPayloadFor("guesser"));
  }
}

function syncSocket(io: Server, socket: Socket) {
  const role = roleForSocket(socket.id);
  socket.emit("duel:status", statusPayloadFor(role ?? undefined));
  if (!role) return;
  socket.emit("duel:joined", { role });
  if (duel.state === "WRITING") {
    socket.emit("round:start", { topic: duel.topic, round: duel.round, challenge: challengeForRound(duel.round) });
  }
  if (duel.state === "GUESSING") {
    if (role === "writer") socket.emit("writer:waiting");
    if (role === "guesser" && duel.displayedSentence) {
      socket.emit("guess:ready", { topic: duel.topic, sentence: duel.displayedSentence, round: duel.round, challenge: challengeForRound(duel.round) });
    }
  }
  if (duel.state === "FINISHED") {
    const winner = duel.scores.writer === duel.scores.guesser ? "draw" : duel.scores.writer > duel.scores.guesser ? "writer" : "guesser";
    socket.emit("duel:finished", { winner, scores: duel.scores, duelId: duel.duelId, totalRounds: duel.round });
  }
  broadcastStatus(io);
}

async function startRound(io: Server) {
  duel.round += 1;
  duel.state = "WRITING";
  duel.topic = pickTopic();
  duel.writerSentence = null;
  duel.displayedSentence = null;
  duel.source = null;
  duel.hasWriterSubmitted = false;
  duel.hasGuesserGuessed = false;

  io.to(duel.writerSocketId!).emit("round:start", {
    topic: duel.topic,
    round: duel.round,
    challenge: challengeForRound(duel.round),
  });
  io.to(duel.guesserSocketId!).emit("round:start", {
    topic: duel.topic,
    round: duel.round,
    challenge: challengeForRound(duel.round),
  });

  broadcastStatus(io);
}

async function handleWriterSubmit(io: Server, socket: Socket, sentence: string) {
  if (roleForSocket(socket.id) !== "writer") return;
  if (duel.state !== "WRITING") return;
  if (duel.hasWriterSubmitted) return; // no double submission

  const trimmed = sentence.trim();
  if (!trimmed) return; // reject empty
  if (trimmed.length > MAX_SENTENCE_LENGTH) return; // reject overlong

  duel.writerSentence = trimmed;
  duel.hasWriterSubmitted = true;
  duel.state = "GUESSING";

  socket.emit("writer:waiting");

  // Hidden, server-only coin flip. Never sent to the client before reveal.
  const isHuman = Math.random() < 0.5;
  duel.source = isHuman ? "human" : "ai";

  let sentenceToShow = trimmed;

  if (!isHuman) {
    const aiSentence = await generateAiSentenceWithRetry(duel.topic, trimmed, challengeForRound(duel.round));
    if (aiSentence) {
      sentenceToShow = aiSentence;
    } else {
      // Claude failed twice — fall back to HUMAN rather than crash or
      // expose an API error as the game result.
      duel.source = "human";
      sentenceToShow = trimmed;
    }
  }

  duel.displayedSentence = sentenceToShow;

  if (duel.guesserSocketId) {
    io.to(duel.guesserSocketId).emit("guess:ready", {
      topic: duel.topic,
      sentence: sentenceToShow,
      round: duel.round,
      challenge: challengeForRound(duel.round),
    });
  }

  broadcastStatus(io);
}

async function handleGuesserGuess(io: Server, socket: Socket, guess: Source) {
  if (roleForSocket(socket.id) !== "guesser") return;
  if (duel.state !== "GUESSING") return;
  if (duel.hasGuesserGuessed) return; // no double submission
  if (!duel.source || !duel.displayedSentence) return;

  duel.hasGuesserGuessed = true;
  duel.state = "REVEAL";

  const correct = guess === duel.source;
  if (correct) {
    duel.scores.guesser += 1;
  } else {
    duel.scores.writer += 1;
  }

  const revealPayload = {
    source: duel.source,
    sentence: duel.displayedSentence,
    correct,
    scores: duel.scores,
    round: duel.round,
  };

  io.to(duel.writerSocketId!).emit("round:reveal", revealPayload);
  io.to(duel.guesserSocketId!).emit("round:reveal", revealPayload);
  broadcastStatus(io);

  setTimeout(() => {
    if (duel.round >= TOTAL_ROUNDS) {
      duel.state = "FINISHED";
      const winner = duel.scores.writer === duel.scores.guesser
        ? "draw"
        : duel.scores.writer > duel.scores.guesser ? "writer" : "guesser";
      const finishedPayload = { winner, scores: duel.scores, duelId: duel.duelId, totalRounds: TOTAL_ROUNDS };
      io.to(duel.writerSocketId!).emit("duel:finished", finishedPayload);
      io.to(duel.guesserSocketId!).emit("duel:finished", finishedPayload);
      broadcastStatus(io);
    } else if (bothConnected()) {
      startRound(io);
    }
  }, REVEAL_DURATION_MS);
}

function handleReset(io: Server) {
  const writerSocketId = duel.writerSocketId;
  const guesserSocketId = duel.guesserSocketId;
  duel = freshDuel();
  duel.writerSocketId = writerSocketId;
  duel.guesserSocketId = guesserSocketId;
  resetTopicHistory();

  broadcastStatus(io);

  if (bothConnected()) {
    startRound(io);
  }
}

export function registerSocketHandlers(io: Server, socket: Socket) {
  // ---- Role assignment (server-authoritative, connection order) ----
  let assignedRole: Role | null = null;
  const seatId = seatIdFor(socket);

  if (duel.writerSeatId === seatId) {
    duel.writerSocketId = socket.id;
    assignedRole = "writer";
  } else if (duel.guesserSeatId === seatId) {
    duel.guesserSocketId = socket.id;
    assignedRole = "guesser";
  } else if (!duel.writerSocketId) {
    duel.writerSocketId = socket.id;
    duel.writerSeatId = seatId;
    assignedRole = "writer";
  } else if (!duel.guesserSocketId) {
    duel.guesserSocketId = socket.id;
    duel.guesserSeatId = seatId;
    assignedRole = "guesser";
  } else {
    // Third client: spectate status only, no role, no interference.
    socket.emit("duel:status", { ...statusPayloadFor(undefined), message: "DUEL IN PROGRESS" });
  }

  if (assignedRole) {
    socket.emit("duel:joined", { role: assignedRole });
    broadcastStatus(io);

    if (bothConnected() && duel.state === "WAITING") {
      startRound(io);
    }
  }

  socket.on("writer:submit", (payload: { sentence: string }) => {
    handleWriterSubmit(io, socket, payload?.sentence ?? "").catch((err) => {
      console.error("[game] writer:submit error:", err);
    });
  });

  socket.on("guesser:guess", (payload: { guess: Source }) => {
    handleGuesserGuess(io, socket, payload?.guess).catch((err) => {
      console.error("[game] guesser:guess error:", err);
    });
  });

  socket.on("duel:reset", () => {
    if (duel.state !== "FINISHED") return;
    handleReset(io);
  });

  socket.on("duel:sync", () => {
    syncSocket(io, socket);
  });

  socket.on("disconnect", () => {
    const role = roleForSocket(socket.id);
    if (role === "writer") {
      duel.writerSocketId = null;
      if (duel.guesserSocketId) {
        io.to(duel.guesserSocketId).emit("duel:status", {
          ...statusPayloadFor("guesser"),
          message: "OPPONENT DISCONNECTED",
        });
      }
    } else if (role === "guesser") {
      duel.guesserSocketId = null;
      if (duel.writerSocketId) {
        io.to(duel.writerSocketId).emit("duel:status", {
          ...statusPayloadFor("writer"),
          message: "PLAYER DISCONNECTED",
        });
      }
    }
    if (!duel.writerSocketId && !duel.guesserSocketId) duel = freshDuel();
    broadcastStatus(io);
  });
}
