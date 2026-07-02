import type { Metadata } from "next";
import { OnboardingView } from "@/features/onboarding";

export const metadata: Metadata = { title: "Bem-vindo" };

export default function OnboardingPage() {
  return <OnboardingView />;
}
