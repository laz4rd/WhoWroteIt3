import type { RoundRevealPayload, Role } from "@/types/game";

export default function Reveal({
  reveal,
  you,
}: {
  reveal: RoundRevealPayload;
  you: Role;
}) {
  const wasHuman = reveal.source === "human";
  // "correct" is from the guesser's point of view; for the writer we invert
  // it to show whether they benefited (their sentence fooled the guesser).
  const youWereRight = you === "guesser" ? reveal.correct : !reveal.correct;

  return (
    <div className="animate-pop-in text-center flex flex-col items-center gap-4">
      <div className="text-sm uppercase tracking-[0.3em] text-white/40">It was…</div>
      <div
        className={`font-display text-5xl md:text-7xl font-black uppercase ${
          wasHuman ? "text-arena-human" : "text-arena-ai"
        }`}
      >
        {wasHuman ? "Human" : "AI"}
      </div>
      <div className="text-white/60 text-base md:text-lg italic max-w-md">
        “{reveal.sentence}”
      </div>
      <div
        className={`font-display text-2xl md:text-3xl font-bold uppercase mt-2 ${
          youWereRight ? "text-arena-human" : "text-arena-ai"
        }`}
      >
        {youWereRight ? "Correct!" : "Wrong!"}
      </div>
    </div>
  );
}
