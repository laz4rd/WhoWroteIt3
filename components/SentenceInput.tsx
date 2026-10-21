"use client";

import { useState, type KeyboardEvent } from "react";
import { MAX_SENTENCE_LENGTH } from "@/types/game";

export default function SentenceInput({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (sentence: string) => void;
}) {
  const [value, setValue] = useState("");
  const [locked, setLocked] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || locked || disabled) return;
    setLocked(true);
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  if (locked) {
    return (
      <div className="animate-pop-in text-center">
        <div className="font-display text-2xl md:text-3xl text-arena-gold font-bold mb-2">
          SENTENCE LOCKED
        </div>
        <div className="text-white/50 animate-flash">Waiting for guess…</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      <input
        autoFocus
        type="text"
        value={value}
        disabled={disabled}
        maxLength={MAX_SENTENCE_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write one short sentence…"
        className="w-full bg-arena-panel border-2 border-arena-border focus:border-arena-human outline-none rounded-xl px-5 py-4 text-lg md:text-xl text-white placeholder-white/30 transition-colors"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="w-full py-4 rounded-xl font-display text-xl font-bold uppercase tracking-wide bg-yellow text-black border-0 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition"
      >
        Enter ↵
      </button>
      <div className="text-right text-xs text-white/30">
        {value.length}/{MAX_SENTENCE_LENGTH}
      </div>
    </div>
  );
}
