"use client";

import { useState } from "react";
import type { Source } from "@/types/game";

export default function GuessButtons({
  onGuess,
}: {
  onGuess: (guess: Source) => void;
}) {
  const [locked, setLocked] = useState(false);

  const handleClick = (guess: Source) => {
    if (locked) return;
    setLocked(true);
    onGuess(guess);
  };

  return (
    <div className="w-full max-w-xl mx-auto grid grid-cols-2 gap-4">
      <button
        onClick={() => handleClick("human")}
        disabled={locked}
        className="py-8 rounded-xl font-display text-2xl md:text-3xl font-bold uppercase tracking-wide bg-yellow text-black border-0 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.97] transition"
      >
        Human
      </button>
      <button
        onClick={() => handleClick("ai")}
        disabled={locked}
        className="py-8 rounded-xl font-display text-2xl md:text-3xl font-bold uppercase tracking-wide bg-yellow text-black border-0 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.97] transition"
      >
        AI
      </button>
    </div>
  );
}
