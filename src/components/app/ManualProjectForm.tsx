"use client";

import { useState } from "react";
import { createProjectFromForm } from "@/actions/projects";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "./ui";

export function ManualProjectForm() {
  const [memberCount, setMemberCount] = useState(1);

  return (
    <form action={createProjectFromForm} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name">
          <input className={inputClass} name="name" required placeholder="APAC entry" />
        </Field>
        <Field label="Budget">
          <input className={inputClass} name="budget" type="number" min="0" step="1" placeholder="120000" />
        </Field>
        <Field label="Start date">
          <input className={inputClass} name="startDate" type="date" />
        </Field>
        <Field label="Target date">
          <input className={inputClass} name="targetDate" type="date" />
        </Field>
      </div>
      <Field label="Goal">
        <textarea className={textareaClass} name="goal" placeholder="What done looks like" />
      </Field>
      <Field label="Description">
        <textarea className={textareaClass} name="description" />
      </Field>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Team members</p>
          <SecondaryButton
            type="button"
            onClick={() => setMemberCount((count) => count + 1)}
            className="h-9 px-4 text-xs"
          >
            Add member
          </SecondaryButton>
        </div>
        <p className="mb-3 text-[13px] text-mute">
          You are added as owner automatically. Add the people who will own work.
        </p>
        <div className="space-y-3">
          {Array.from({ length: memberCount }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-foam p-3 sm:grid-cols-2 lg:grid-cols-5">
              <input className={inputClass} name="memberFirstName" placeholder="First name" />
              <input className={inputClass} name="memberLastName" placeholder="Last name" />
              <input className={inputClass} name="memberEmail" type="email" placeholder="Email" />
              <input className={inputClass} name="memberRole" placeholder="Role on project" />
              <input
                className={inputClass}
                name="memberCapacity"
                type="number"
                min="1"
                defaultValue={40}
                placeholder="Weekly hours"
              />
            </div>
          ))}
        </div>
      </div>

      <PrimaryButton type="submit">Create project</PrimaryButton>
    </form>
  );
}
