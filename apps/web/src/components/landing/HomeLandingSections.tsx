"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { HeroSection } from "./HeroSection";
import { HomeStatsBar } from "./HomeStatsBar";

export function HomeLandingSections() {
  const { isAuthenticated, isLoading } = useAuth();
  const statsAboveHero = !isLoading && isAuthenticated;

  return statsAboveHero ? (
    <>
      <HomeStatsBar />
      <HeroSection />
    </>
  ) : (
    <>
      <HeroSection />
      <HomeStatsBar />
    </>
  );
}
