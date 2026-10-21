"use client";

import Link from "next/link";
import type { DuelFinishedPayload, Role } from "@/types/game";
import type { DuelReward, PlayerProfile } from "@/types/progression";
import { rankForLevel, xpForNextLevel } from "@/types/progression";

export default function DuelResults({ result, role, reward, profile, onPlayAgain }: { result: DuelFinishedPayload; role: Role; reward: DuelReward | null; profile: PlayerProfile; onPlayAgain: () => void }) {
  const isDraw = result.winner === "draw";
  const won = result.winner === role;
  const yourScore = result.scores[role];
  const theirScore = role === "writer" ? result.scores.guesser : result.scores.writer;
  const progress = Math.min(100, Math.round((profile.xp / xpForNextLevel(profile.level)) * 100));
  return (
    <section className="result-card animate-pop-in" aria-live="polite">
      <p className="eyebrow">Circuit result · all 5 rounds complete</p>
      <h1 className="result-title">{isDraw ? "DEAD EVEN" : won ? "YOU HEADLINE" : "THEY HEADLINE"}</h1>
      <div className="result-score"><span>{yourScore}</span><i>:</i><span>{theirScore}</span></div>
      <div className="result-rule" />
      {reward ? <>
        <div className="xp-earned"><span>XP earned</span><strong>+{reward.total}</strong></div>
        <div className="reward-breakdown">
          <span>Showed up <b>+{reward.base}</b></span>
          {reward.win > 0 && <span>Won duel <b>+{reward.win}</b></span>}
          <span>Rounds <b>+{reward.rounds}</b></span>
          {reward.challenges > 0 && <span>Challenge <b>+{reward.challenges}</b></span>}
        </div>
      </> : <div className="xp-earned"><span>XP applied</span><strong>CHECKED IN</strong></div>}
      <div className="level-block">
        <div><span>Level {profile.level}</span><b>{rankForLevel(profile.level)}</b></div>
        <div className="xp-track xp-track--large"><span style={{ width: `${progress}%` }} /></div>
      </div>
      {reward?.leveledUp && <p className="reward-callout">Level up! {reward.promoted ? `You are now ${reward.rank}.` : "Keep the signal alive."}</p>}
      {reward?.newCosmetic && <p className="reward-callout">New cosmetic unlocked: {reward.newCosmetic.replaceAll("-", " ")}.</p>}
      {reward?.challengeCompletions.map((challenge) => <p className="reward-callout" key={challenge}>Challenge complete: {challenge}.</p>)}
      <div className="result-actions">
        <button className="circuit-button circuit-button--primary" onClick={onPlayAgain}>Play again <span>■</span></button>
        <Link className="circuit-button circuit-button--secondary" href="/profile">View profile</Link>
      </div>
    </section>
  );
}
