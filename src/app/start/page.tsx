import { getSession } from "@/lib/session";
import { StartForm } from "@/components/app/StartForm";

export default async function StartPage() {
  const session = await getSession();

  return (
    <div className="min-h-full bg-foam">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium text-crust">Start a project</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Who is this work for?
        </h1>
        <p className="mt-3 text-sm leading-6 text-mute">
          Email is required before Baguette writes anything. Your projects stay
          attached to this person.
        </p>
        <div className="mt-8 rounded-2xl border border-flour bg-white p-6">
          <StartForm
            defaultFirstName={session?.firstName}
            defaultLastName={session?.lastName}
            defaultEmail={session?.email}
          />
        </div>
      </div>
    </div>
  );
}
