import { AiPlanChat } from "@/components/app/AiPlanChat";
import { requireSession } from "@/lib/session";

function greetingForNow(firstName: string) {
  const name = firstName.trim() || "there";
  const hour = new Date().getHours();
  if (hour < 6) return `Late hours, ${name}. What's the critical path?`;
  if (hour < 10) return `Morning kickoff, ${name}.`;
  if (hour < 12) return `Time to scope the work, ${name}.`;
  if (hour < 14) return `What's the outcome we owe, ${name}?`;
  if (hour < 17) return `Let's build the plan, ${name}.`;
  if (hour < 21) return `Close the day with a plan, ${name}.`;
  return `Still sequencing, ${name}. What are we delivering?`;
}

export default async function AiNewProjectPage() {
  const session = await requireSession();
  return <AiPlanChat person={session} greeting={greetingForNow(session.firstName)} />;
}
