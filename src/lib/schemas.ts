import { z } from "zod";
import { isCountry } from "./countries";
import { isIndustry } from "./industries";

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `Enter your ${label}.` })
    .max(80, { message: `${label.charAt(0).toUpperCase()}${label.slice(1)} is too long.` });

export const signupSchema = z
  .object({
    firstName: requiredName("first name"),
    lastName: requiredName("last name"),
    email: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
    emailConfirm: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
    password: z
      .string()
      .min(8, { message: "Use at least 8 characters." })
      .regex(/[A-Za-z]/, { message: "Include at least one letter." })
      .regex(/[0-9]/, { message: "Include at least one number." }),
    industry: z
      .string()
      .min(1, { message: "Select an industry." })
      .refine(isIndustry, { message: "Select an industry from the list." }),
    country: z
      .string()
      .min(1, { message: "Select a country." })
      .refine(isCountry, { message: "Select a country from the list." }),
    next: z.string().optional(),
  })
  .refine((value) => value.email === value.emailConfirm, {
    message: "Email addresses must match.",
    path: ["emailConfirm"],
  });

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Enter your password." }),
  next: z.string().optional(),
});

export type SignupFormState =
  | {
      errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        emailConfirm?: string[];
        password?: string[];
        industry?: string[];
        country?: string[];
      };
      message?: string;
      values?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        emailConfirm?: string;
        industry?: string;
        country?: string;
      };
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      values?: {
        email?: string;
      };
    }
  | undefined;

export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const planSchema = z.object({
  assistant_message: z.string(),
  ready_for_review: z.boolean(),
  missing: z.array(z.string()),
  project: z
    .object({
      name: z.string(),
      description: z.string(),
      goal: z.string(),
      start_date: z.string(),
      target_date: z.string(),
      budget: z.number().nullable(),
    })
    .nullable(),
  members: z.array(
    z.object({
      full_name: z.string(),
      email: z.string(),
      role: z.string(),
      capacity_hours_per_week: z.number(),
    }),
  ),
  phases: z.array(
    z.object({
      temp_id: z.string(),
      name: z.string(),
      sort_order: z.number(),
      start_date: z.string(),
      end_date: z.string(),
    }),
  ),
  tasks: z.array(
    z.object({
      temp_id: z.string(),
      phase_temp_id: z.string(),
      parent_temp_id: z.string().nullable(),
      title: z.string(),
      description: z.string(),
      owner_email: z.string(),
      status: z.enum(["todo", "in_progress", "blocked", "done"]),
      priority: z.enum(["low", "medium", "high"]),
      estimate_hours: z.number().nullable(),
      start_date: z.string(),
      due_date: z.string(),
    }),
  ),
  dependencies: z.array(
    z.object({
      predecessor_temp_id: z.string(),
      successor_temp_id: z.string(),
    }),
  ),
});

export type PlanDraft = z.infer<typeof planSchema>;

export const statusDraftSchema = z.object({
  body: z.string(),
  what_moved: z.array(z.string()),
  what_slipped: z.array(z.string()),
  what_is_next: z.array(z.string()),
  needs_decision: z.array(z.string()),
});

export const radarInterpretationSchema = z.object({
  findings: z.array(
    z.object({
      id: z.string(),
      interpretation: z.string(),
      recommendation: z.string(),
    }),
  ),
});

export const assistantSchema = z.object({
  reply: z.string(),
  proposed_actions: z.array(
    z.object({
      type: z.enum([
        "create_task",
        "reassign_task",
        "reschedule_task",
        "update_status",
      ]),
      summary: z.string(),
      title: z.string().nullable(),
      task_id: z.string().nullable(),
      owner_email: z.string().nullable(),
      start_date: z.string().nullable(),
      due_date: z.string().nullable(),
      status: z.enum(["todo", "in_progress", "blocked", "done"]).nullable(),
      estimate_hours: z.number().nullable(),
      phase_id: z.string().nullable(),
    }),
  ),
});

export type AssistantProposal = z.infer<typeof assistantSchema>;
export type ProposedAction = AssistantProposal["proposed_actions"][number];
