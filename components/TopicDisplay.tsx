import { challengeForRound, TOTAL_ROUNDS } from "@/types/game";

export default function TopicDisplay({ topic, round, challenge }: { topic: string; round: number; challenge?: string }) {
  return (
    <div className="animate-pop-in text-center">
      <div className="text-xs md:text-sm uppercase tracking-[0.3em] text-white/40 mb-2">
        Round {String(round).padStart(2, "0")} / {TOTAL_ROUNDS} · Topic
      </div>
      <div className="font-display text-4xl md:text-6xl font-bold uppercase text-white">
        {topic}
      </div>
      <div className="mt-5 inline-flex max-w-xl flex-col gap-1 border border-[#cc64ff]/35 bg-[#160527]/70 px-5 py-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#cc64ff]">Round modifier</span>
        <span className="text-sm md:text-base text-white/85">{challenge ?? challengeForRound(round)}</span>
      </div>
      <div className="mt-4 flex justify-center gap-2" aria-label={`Round ${round} of ${TOTAL_ROUNDS}`}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, index) => (
          <span key={index} className={`h-1.5 w-8 rounded-full ${index < round ? "bg-[#cc64ff]" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}
