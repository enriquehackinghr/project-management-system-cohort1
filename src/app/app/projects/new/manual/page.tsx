import { ManualProjectForm } from "@/components/app/ManualProjectForm";

export default function ManualNewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-crust">Manual path</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create the project</h1>
      <p className="mb-8 mt-3 text-sm text-mute">
        You can add phases and tasks after this writes.
      </p>
      <ManualProjectForm />
    </div>
  );
}
