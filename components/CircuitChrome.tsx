import type { ReactNode } from "react";
import type { PlayerProfile } from "@/types/progression";
import { rankForLevel, xpForNextLevel } from "@/types/progression";

export function CircuitBackdrop({ children, quiet = false }: { children: ReactNode; quiet?: boolean }) {
  return <main className={`circuit-shell ${quiet ? "circuit-shell--quiet" : ""}`}>{children}</main>;
}

export function ProfileChip({ profile }: { profile: PlayerProfile }) {
  const progress = Math.min(100, Math.round((profile.xp / xpForNextLevel(profile.level)) * 100));
  return (
    <div className="profile-chip" aria-label={`${profile.displayName}, level ${profile.level}, ${rankForLevel(profile.level)}`}>
      <div className="profile-chip__mark">{profile.level}</div>
      <div className="min-w-0">
        <div className="profile-chip__name">{profile.displayName}</div>
        <div className="profile-chip__meta">{rankForLevel(profile.level)} · {profile.xp}/{xpForNextLevel(profile.level)} XP</div>
        <div className="xp-track"><span style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}
