import Link from "next/link";
import { Card } from "@/components/app/ui";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-crust">New project</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        One schema, two paths
      </h1>
      <p className="mt-3 text-sm leading-6 text-mute">
        Manual and AI creation write identical rows. Downstream does not know which path you used.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/app/projects/new/manual">
          <Card className="h-full transition hover:border-crust/40">
            <p className="text-lg font-semibold">Manual</p>
            <p className="mt-2 text-sm leading-6 text-mute">
              Name, goal, dates, budget, members. Add tasks by hand. Fallback if AI output fails validation.
            </p>
          </Card>
        </Link>
        <Link href="/app/projects/new/ai">
          <Card className="h-full transition hover:border-crust/40">
            <p className="text-lg font-semibold">AI assistant</p>
            <p className="mt-2 text-sm leading-6 text-mute">
              Describe the work or attach a brief, SOW, or notes. Review the draft. Approve once. Nothing is written before that.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
