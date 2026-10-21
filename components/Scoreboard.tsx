import type { Scores } from "@/types/game";

export default function Scoreboard({
  scores,
  youLabel,
  themLabel,
  you,
}: {
  scores: Scores;
  youLabel: string;
  themLabel: string;
  you: "writer" | "guesser";
}) {
  const yourScore = scores[you];
  const theirScore = you === "writer" ? scores.guesser : scores.writer;

  return (
    <div className="flex items-center justify-between gap-6 font-display text-xl md:text-2xl tracking-wide">
      <span className="text-arena-human">
        {youLabel} <span className="font-bold">{yourScore}</span>
      </span>
      <span className="text-white/20">—</span>
      <span className="text-arena-ai">
        {themLabel} <span className="font-bold">{theirScore}</span>
      </span>
    </div>
  );
}
