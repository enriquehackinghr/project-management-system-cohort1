import { startSession } from "@/actions/session";
import { Field, inputClass, PrimaryButton } from "./ui";

export function StartForm({
  defaultFirstName,
  defaultLastName,
  defaultEmail,
}: {
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultEmail?: string;
}) {
  return (
    <form action={startSession} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input
            className={inputClass}
            name="firstName"
            required
            autoComplete="given-name"
            defaultValue={defaultFirstName}
            placeholder="Ada"
          />
        </Field>
        <Field label="Last name">
          <input
            className={inputClass}
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={defaultLastName}
            placeholder="Khan"
          />
        </Field>
      </div>
      <Field label="Email">
        <input
          className={inputClass}
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          placeholder="ada@company.com"
        />
      </Field>
      <PrimaryButton type="submit" className="w-full">
        Continue
      </PrimaryButton>
      <p className="text-center text-[13px] leading-5 text-mute">
        No password. This email owns the projects you create on this device.
        Use the same email on another browser to pick up the same work.
      </p>
    </form>
  );
}
