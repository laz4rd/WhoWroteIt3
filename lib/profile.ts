"use client";

import { useEffect, useState } from "react";
import { PROFILE_STORAGE_KEY, createDefaultProfile, type PlayerProfile } from "@/types/progression";

function isProfile(value: unknown): value is PlayerProfile {
  return Boolean(value && typeof value === "object" && (value as PlayerProfile).version === 1 && typeof (value as PlayerProfile).level === "number");
}

export function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return createDefaultProfile();
    const parsed: unknown = JSON.parse(stored);
    return isProfile(parsed) ? parsed : createDefaultProfile();
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function useLocalProfile() {
  const [profile, setProfile] = useState<PlayerProfile>(() => createDefaultProfile());
  const [ready, setReady] = useState(false);
  useEffect(() => { setProfile(loadProfile()); setReady(true); }, []);
  const updateProfile = (next: PlayerProfile) => { setProfile(next); saveProfile(next); };
  return { profile, ready, updateProfile };
}
