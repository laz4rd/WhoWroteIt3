"use client";

import Link from "next/link";
import { CircuitBackdrop, ProfileChip } from "@/components/CircuitChrome";
import { useLocalProfile } from "@/lib/profile";
import { rankForLevel, xpForNextLevel, type CosmeticId } from "@/types/progression";

const labels: Record<CosmeticId, string> = { "violet-sigil": "Violet Sigil", "signal-mark": "Signal Mark", "night-bloom": "Night Bloom", "apex-pass": "Apex Pass", "oracle-frame": "Oracle Frame", "legend-seal": "Legend Seal" };

export default function ProfilePage() {
  const { profile, updateProfile } = useLocalProfile();
  const guessAccuracy = profile.stats.guessAttempts ? Math.round((profile.stats.correctGuesses / profile.stats.guessAttempts) * 100) : 0;
  const foolRate = profile.stats.writerRounds ? Math.round((profile.stats.fooledGuesser / profile.stats.writerRounds) * 100) : 0;
  return <CircuitBackdrop><div className="max-w-5xl min-h-screen mx-auto px-6 py-8">
    <header className="flex items-center justify-between gap-4"><Link className="circuit-button circuit-button--secondary" href="/">Back</Link><ProfileChip profile={profile} /></header>
    <main className="py-12 grid lg:grid-cols-[1fr_1.3fr] gap-8">
      <section className="border border-[#cc64ff]/45 bg-[#08030e]/70 p-7"><p className="eyebrow">Circuit identity</p><h1 className="circuit-display text-6xl mt-3">{profile.displayName}</h1><p className="text-[#cc64ff] uppercase tracking-[.16em] text-sm mt-2">{rankForLevel(profile.level)} · Level {profile.level}</p><div className="mt-7"><div className="flex justify-between text-xs uppercase tracking-[.12em] text-[#b9b2c2]"><span>Next level</span><span>{profile.xp}/{xpForNextLevel(profile.level)} XP</span></div><div className="xp-track xp-track--large"><span style={{ width: `${Math.round((profile.xp / xpForNextLevel(profile.level)) * 100)}%` }} /></div></div></section>
      <section className="border border-[#cc64ff]/25 bg-[#160527]/60 p-7"><p className="eyebrow">Signal record</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#cc64ff]/20 mt-5">{[["Duels", profile.stats.duels], ["Wins", profile.stats.wins], ["Rounds", profile.stats.roundsWon], ["Read accuracy", `${guessAccuracy}%`], ["Fool rate", `${foolRate}%`], ["Best streak", profile.stats.bestWinStreak]].map(([label, value]) => <div key={String(label)} className="bg-[#08030e] p-4"><p className="text-[#b9b2c2] text-[.65rem] uppercase tracking-[.12em]">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}</div></section>
      <section className="border border-[#cc64ff]/25 bg-[#08030e]/70 p-7"><p className="eyebrow">Circuit challenges</p><div className="mt-5 space-y-4">{profile.challenges.map((challenge) => <div key={challenge.id}><div className="flex justify-between gap-3 text-sm"><span>{challenge.label}</span><span className={challenge.completed ? "text-[#ffd000]" : "text-[#b9b2c2]"}>{challenge.progress}/{challenge.target} · +{challenge.reward} XP</span></div><div className="xp-track"><span style={{ width: `${(challenge.progress / challenge.target) * 100}%` }} /></div></div>)}</div></section>
      <section className="border border-[#cc64ff]/25 bg-[#08030e]/70 p-7"><p className="eyebrow">Locker</p><div className="grid grid-cols-2 gap-3 mt-5">{profile.unlockedCosmetics.map((cosmetic) => <button key={cosmetic} onClick={() => updateProfile({ ...profile, equippedCosmetic: cosmetic })} className={`text-left p-4 border ${profile.equippedCosmetic === cosmetic ? "border-[#ffd000] text-[#ffd000]" : "border-[#cc64ff]/35 text-[#f5f3f7]"}`}><span className="text-[#a000ff]">■</span><p className="uppercase tracking-[.1em] text-xs mt-3">{labels[cosmetic]}</p></button>)}</div></section>
    </main>
  </div></CircuitBackdrop>;
}
