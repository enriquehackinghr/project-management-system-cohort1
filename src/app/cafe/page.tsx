import type { Metadata } from "next";
import { CafeLanding } from "@/components/landing-cafe/CafeLanding";

export const metadata: Metadata = {
  title: "Baguette Café — sit down, we will run the project",
  description:
    "A quieter, cafe-themed look at Baguette: bring the brief, approve the plan, and stay at the table while the operating system keeps the work moving.",
};

export default function CafePreviewPage() {
  return <CafeLanding />;
}
