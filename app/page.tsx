"use client";

import Link from "next/link";
import { CircuitBackdrop, ProfileChip } from "@/components/CircuitChrome";
import { useLocalProfile } from "@/lib/profile";

export default function Home() {
  const { profile, updateProfile } = useLocalProfile();
  return (
    <CircuitBackdrop>
      <div className="min-h-screen px-6 py-8 flex flex-col justify-between max-w-5xl mx-auto">
        <header className="flex justify-between items-start gap-4"><p className="eyebrow">Who wrote it? · local circuit</p><Link className="circuit-button circuit-button--secondary" href="/profile">Profile</Link></header>
        <section className="grid lg:grid-cols-[1.4fr_.8fr] gap-10 items-end py-12">
          <div><p className="eyebrow mb-4">Human intuition vs. machine instinct</p><h1 className="circuit-display text-[clamp(5rem,17vw,12rem)] leading-[.72]">WHO<br/><span className="text-[#cc64ff]">WROTE</span><br/>IT<span className="text-[#ffd000]">.</span></h1><p className="mt-8 max-w-md text-[#b9b2c2] text-lg">Write a sentence. Read the signal. Make the call.</p></div>
          <aside className="border border-[#cc64ff]/45 bg-[#08030e]/70 p-6"><p className="eyebrow mb-5">Your circuit pass</p><label className="block text-xs uppercase tracking-[.14em] text-[#b9b2c2] mb-2" htmlFor="player-name">Player name</label><input id="player-name" maxLength={18} value={profile.displayName} onChange={(event) => updateProfile({ ...profile, displayName: event.target.value || "Player" })} className="w-full bg-transparent border-b border-[#cc64ff]/50 px-0 py-2 text-xl font-bold outline-none focus:border-[#ffd000]" /><div className="mt-6"><ProfileChip profile={profile} /></div></aside>
        </section>
        <section className="grid sm:grid-cols-2 gap-3 max-w-2xl"><Link href="/writer" className="circuit-button circuit-button--primary text-base min-h-[84px]">Enter as writer <span>■</span></Link><Link href="/guesser" className="circuit-button circuit-button--secondary text-base min-h-[84px]">Enter as guesser</Link></section>
        <p className="mt-8 text-xs uppercase tracking-[.12em] text-[#b9b2c2]">Open Writer first on the server device, then Guesser on the second device.</p>
      </div>
    </CircuitBackdrop>
  );
}
