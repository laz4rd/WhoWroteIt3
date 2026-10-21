"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type {
  DuelFinishedPayload,
  DuelStatusPayload,
  RoundRevealPayload,
  RoundStartPayload,
} from "@/types/game";
import Scoreboard from "@/components/Scoreboard";
import TopicDisplay from "@/components/TopicDisplay";
import SentenceInput from "@/components/SentenceInput";
import Reveal from "@/components/Reveal";
import DuelStatus from "@/components/DuelStatus";
import DuelResults from "@/components/DuelResults";
import { CircuitBackdrop, ProfileChip } from "@/components/CircuitChrome";
import { useLocalProfile } from "@/lib/profile";
import { applyDuelResult, type DuelReward } from "@/types/progression";

type ViewState = "connecting" | "waiting" | "writing" | "locked" | "reveal" | "finished";

export default function WriterPage() {
  const [view, setView] = useState<ViewState>("connecting");
  const [topic, setTopic] = useState("");
  const [challenge, setChallenge] = useState("");
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState({ writer: 0, guesser: 0 });
  const [reveal, setReveal] = useState<RoundRevealPayload | null>(null);
  const [finished, setFinished] = useState<DuelFinishedPayload | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reward, setReward] = useState<DuelReward | null>(null);
  const { profile, updateProfile } = useLocalProfile();

  useEffect(() => {
    if (!finished) return;
    const applied = applyDuelResult(profile, finished, "writer");
    if (applied.reward) { updateProfile(applied.profile); setReward(applied.reward); }
  }, [finished, profile, updateProfile]);

  useEffect(() => {
    const socket = getSocket();

    const onStatus = (payload: DuelStatusPayload) => {
      setScores(payload.scores);
      setRound(payload.round);
      if (payload.message) setStatusMessage(payload.message);

      if (payload.state === "WAITING" && (!payload.connected.writer || !payload.connected.guesser)) {
        setView("waiting");
      }
    };

    const onRoundStart = (payload: RoundStartPayload) => {
      setStatusMessage(null);
      setTopic(payload.topic);
      setChallenge(payload.challenge);
      setRound(payload.round);
      setReveal(null);
      setView("writing");
    };

    const onWriterWaiting = () => setView("locked");

    const onReveal = (payload: RoundRevealPayload) => {
      setReveal(payload);
      setScores(payload.scores);
      setView("reveal");
    };

    const onFinished = (payload: DuelFinishedPayload) => {
      setFinished(payload);
      setScores(payload.scores);
      setView("finished");
    };

    socket.on("duel:status", onStatus);
    socket.on("round:start", onRoundStart);
    socket.on("writer:waiting", onWriterWaiting);
    socket.on("round:reveal", onReveal);
    socket.on("duel:finished", onFinished);
    const sync = () => socket.emit("duel:sync");
    socket.on("connect", sync);
    sync();

    return () => {
      socket.off("duel:status", onStatus);
      socket.off("round:start", onRoundStart);
      socket.off("writer:waiting", onWriterWaiting);
      socket.off("round:reveal", onReveal);
      socket.off("duel:finished", onFinished);
      socket.off("connect", sync);
    };
  }, []);

  const submitSentence = (sentence: string) => {
    getSocket().emit("writer:submit", { sentence });
  };

  const playAgain = () => {
    getSocket().emit("duel:reset");
    setFinished(null);
    setReward(null);
  };

  return (
    <CircuitBackdrop quiet><main className="min-h-screen flex flex-col">
      <header className="px-6 pt-6">
        <div className="flex justify-between items-start gap-4 max-w-5xl mx-auto"><div><div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-1">Who Wrote It?</div><div className="text-sm uppercase tracking-widest text-arena-human font-bold mb-4">
          You are the Writer
        </div></div><ProfileChip profile={profile} /></div>
        {view !== "waiting" && view !== "connecting" && (
          <Scoreboard scores={scores} youLabel="You" themLabel="Them" you="writer" />
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-10">
        {view === "connecting" && <DuelStatus message="Connecting…" />}

        {view === "waiting" && (
          <DuelStatus message={statusMessage ?? "Waiting for opponent"} />
        )}

        {(view === "writing" || view === "locked") && (
          <>
            <TopicDisplay topic={topic} round={round} challenge={challenge} />
            <SentenceInput disabled={view === "locked"} onSubmit={submitSentence} />
          </>
        )}

        {view === "reveal" && reveal && <Reveal reveal={reveal} you="writer" />}

        {view === "finished" && finished && <DuelResults result={finished} role="writer" reward={reward} profile={profile} onPlayAgain={playAgain} />}
      </div>
    </main></CircuitBackdrop>
  );
}
