"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inputClass, PrimaryButton, SecondaryButton } from "./ui";

export function EditableName({
  name,
  label,
  action,
  size = "nav",
  canEdit = true,
}: {
  name: string;
  label: string;
  action: (formData: FormData) => Promise<void>;
  size?: "nav" | "page";
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Heading = size === "page" ? "h2" : "h1";
  const headingClass =
    size === "page"
      ? "text-2xl font-semibold tracking-tight"
      : "text-[15px] font-semibold leading-snug tracking-tight";

  function cancel() {
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <Heading className={`min-w-0 flex-1 ${headingClass}`}>{name}</Heading>
        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing(true);
            }}
            className={`shrink-0 cursor-pointer font-medium text-mute hover:text-ink ${
              size === "page" ? "mt-1.5 text-sm" : "mt-0.5 text-[12px]"
            }`}
          >
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const next = String(formData.get("name") ?? "").trim();
        if (!next) {
          setError(`${label} is required.`);
          return;
        }
        if (next === name) {
          cancel();
          return;
        }
        startTransition(async () => {
          try {
            await action(formData);
            setEditing(false);
            setError(null);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save the name.");
          }
        });
      }}
    >
      <input
        className={`${inputClass} ${size === "nav" ? "h-9 text-[13px]" : ""}`}
        name="name"
        defaultValue={name}
        required
        maxLength={120}
        aria-label={label}
        autoFocus
        disabled={pending}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
      />
      {error ? <p className="text-[12px] leading-5 text-crust">{error}</p> : null}
      <div className="flex gap-1.5">
        <PrimaryButton
          type="submit"
          className="h-8 px-3 text-xs"
          disabled={pending}
        >
          Save
        </PrimaryButton>
        <SecondaryButton
          type="button"
          className="h-8 px-3 text-xs"
          disabled={pending}
          onClick={cancel}
        >
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
