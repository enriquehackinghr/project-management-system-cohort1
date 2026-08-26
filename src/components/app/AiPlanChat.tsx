"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { approvePlan, continuePlanChat } from "@/actions/plan";
import {
  DOCUMENT_ACCEPT,
  isAllowedDocument,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_FILES,
} from "@/lib/document-limits";
import type { PlanDraft } from "@/lib/schemas";
import type { SessionPerson } from "@/lib/types";
import { AppMark } from "./AppShell";
import {
  Field,
  inputClass,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  Spinner,
  textareaClass,
} from "./ui";

type Turn = { role: "user" | "assistant"; content: string };
type Panel = "chat" | "draft";

export function AiPlanChat({
  person,
  greeting,
}: {
  person: SessionPerson;
  greeting: string;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [readingDocs, setReadingDocs] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("chat");
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    setFiles((current) => {
      const { files: next, error: nextError } = appendDocuments(current, incoming);
      if (nextError) setError(nextError);
      return next;
    });
  }, []);

  useEffect(() => {
    function isFileDrag(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function onDragEnter(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setDragging(true);
    }

    function onDragOver(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = "copy";
    }

    function onDragLeave(event: DragEvent) {
      if (event.relatedTarget) return;
      setDragging(false);
    }

    function onDrop(event: DragEvent) {
      setDragging(false);
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer?.files.length) addFiles(event.dataTransfer.files);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 92) return value;
        const step = readingDocs && value < 38 ? 5 : 2.4;
        return Math.min(92, value + step);
      });
    }, 320);
    return () => window.clearInterval(timer);
  }, [pending, readingDocs]);

  function send() {
    const text = message.trim();
    if ((!text && files.length === 0) || pending) return;
    setReadingDocs(files.length > 0);
    setProgress(files.length > 0 ? 10 : 16);
    const attachedNames = files.map((file) => file.name);
    const visible =
      attachedNames.length > 0
        ? `${text || "Create a project plan from the attached documents."}\n\nAttached: ${attachedNames.join(", ")}`
        : text;
    setMessage("");
    setError(null);
    setPanel("chat");
    setHistory((prev) => [...prev, { role: "user", content: visible }]);
    startTransition(async () => {
      try {
        const next = await continuePlanChat({
          history,
          userMessage: text,
          files: files.length > 0 ? files : undefined,
        });
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: next.assistant_message },
        ]);
        setDraft(next);
        if (next.ready_for_review) setPanel("draft");
      } catch (err) {
        setError(err instanceof Error ? err.message : "The model could not return a plan.");
      } finally {
        setReadingDocs(false);
      }
    });
  }

  function writePlan() {
    if (!draft) return;
    setReadingDocs(false);
    setProgress(16);
    startTransition(async () => {
      try {
        const id = await approvePlan(draft);
        router.push(`/app/projects/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not write the plan.");
      }
    });
  }

  const empty = history.length === 0;
  const displayProgress = pending ? progress : 0;
  const workingLabel =
    readingDocs && displayProgress < 40
      ? "Reading documents…"
      : "Drafting the plan…";

  return (
    <div className="relative flex h-dvh flex-col bg-foam text-ink">
      {dragging ? (
        <div
          role="status"
          aria-live="assertive"
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-foam/92 px-6"
        >
          <div className="w-full max-w-lg rounded-3xl border-2 border-dashed border-crust bg-white px-10 py-12 text-center shadow-sm">
            <p className="text-2xl font-semibold tracking-tight">Drop documents here</p>
            <p className="mt-3 text-sm leading-6 text-mute">
              PDF, Word, Markdown, text, CSV, JSON, or HTML. Up to 8 files.
            </p>
          </div>
        </div>
      ) : null}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-flour bg-white px-5">
        <Link href="/app/projects" className="inline-flex items-center gap-2.5">
          <AppMark />
          <span className="text-[1.1rem] font-semibold tracking-tight">Baguette</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/app/projects" className="font-medium text-mute hover:text-ink">
            All projects
          </Link>
          <span className="text-mute">{person.firstName}</span>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
              <p className="text-sm font-medium text-crust">New project with AI</p>
              <h1 className="mx-auto mt-2 max-w-3xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {greeting}
              </h1>
              <p className="mt-3 max-w-xl text-center text-sm leading-6 text-mute">
                Describe the work or drop a brief. Review the draft. Nothing is written until you approve.
              </p>
              <Composer
                textareaRef={textareaRef}
                message={message}
                setMessage={setMessage}
                files={files}
                setFiles={setFiles}
                addFiles={addFiles}
                pending={pending}
                panel={panel}
                setPanel={setPanel}
                draftReady={Boolean(draft?.ready_for_review)}
                onSend={send}
                placeholder="Describe the project, or drop a brief…"
                className="mt-8 w-full max-w-[760px]"
              />
              {pending ? (
                <div className="mt-5 w-full max-w-[760px]">
                  <WorkingStatus label={workingLabel} progress={displayProgress} />
                </div>
              ) : (
                <p className="mt-4 text-[13px] text-mute">
                  Drop a PDF, Word doc, or notes anywhere on this page.
                </p>
              )}
              {error ? <p className="mt-4 text-sm text-crust">{error}</p> : null}
            </div>
          ) : (
            <>
              <div className="mx-auto w-full max-w-[760px] flex-1 overflow-y-auto px-6 py-8">
                <div className="space-y-6">
                  {history.map((turn, index) => (
                    <div key={`${turn.role}-${index}`}>
                      {turn.role === "user" ? (
                        <p className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-white px-4 py-3 text-[15px] leading-7">
                          {turn.content}
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-ink">
                          {turn.content}
                        </p>
                      )}
                    </div>
                  ))}
                  {pending ? <WorkingStatus label={workingLabel} progress={displayProgress} /> : null}
                </div>
                {error ? <p className="mt-6 text-sm text-crust">{error}</p> : null}
              </div>
              <div className="border-t border-flour bg-white/80 px-6 py-4">
                <Composer
                  textareaRef={textareaRef}
                  message={message}
                  setMessage={setMessage}
                  files={files}
                  setFiles={setFiles}
                  addFiles={addFiles}
                  pending={pending}
                  panel={panel}
                  setPanel={setPanel}
                  draftReady={Boolean(draft?.ready_for_review)}
                  onSend={send}
                  placeholder="Add a constraint, or drop another document…"
                  className="mx-auto w-full max-w-[760px]"
                />
              </div>
            </>
          )}
        </section>

        {panel === "draft" ? (
          <aside className="flex w-full max-w-md shrink-0 flex-col border-l border-flour bg-white">
            <div className="flex items-center justify-between border-b border-flour px-5 py-4">
              <div>
                <p className="font-semibold">Plan draft</p>
                <p className="text-[12px] text-mute">
                  {draft?.ready_for_review ? "Ready to write" : "Not written yet"}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-mute hover:text-ink"
                onClick={() => setPanel("chat")}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!draft?.project ? (
                <p className="text-sm leading-6 text-mute">
                  Describe the goal, timeline, budget, and who owns what. The structured
                  plan appears here. Nothing is saved until you approve.
                </p>
              ) : (
                <PlanEditor draft={draft} onChange={setDraft} />
              )}
              {draft?.missing?.length ? (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-mute">
                  {draft.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="border-t border-flour p-4">
              <PrimaryButton
                type="button"
                className="w-full"
                onClick={writePlan}
                disabled={pending || !draft?.ready_for_review || !draft.project}
              >
                Approve and write plan
              </PrimaryButton>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function WorkingStatus({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="rounded-2xl border border-flour bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Spinner className="h-4 w-4 text-crust" />
        {label}
      </div>
      <div className="mt-3">
        <ProgressBar value={progress} />
      </div>
      <p className="mt-2 text-[12px] text-mute">{Math.round(progress)}%</p>
    </div>
  );
}

function appendDocuments(current: File[], incoming: FileList | File[]) {
  const next = [...current];
  let error: string | null = null;
  for (const file of Array.from(incoming)) {
    if (next.length >= MAX_DOCUMENT_FILES) {
      error = `Attach at most ${MAX_DOCUMENT_FILES} documents.`;
      break;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      error = `${file.name} is larger than 8 MB.`;
      continue;
    }
    if (!isAllowedDocument(file)) {
      error = `${file.name} is not a supported document. Use PDF, Word, Markdown, text, CSV, JSON, or HTML.`;
      continue;
    }
    if (next.some((existing) => existing.name === file.name && existing.size === file.size)) {
      continue;
    }
    next.push(file);
  }
  return { files: next, error };
}

function Composer({
  textareaRef,
  message,
  setMessage,
  files,
  setFiles,
  addFiles,
  pending,
  panel,
  setPanel,
  draftReady,
  onSend,
  placeholder,
  className,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  message: string;
  setMessage: (value: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  addFiles: (incoming: FileList | File[]) => void;
  pending: boolean;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  draftReady: boolean;
  onSend: () => void;
  placeholder: string;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`rounded-2xl border border-flour bg-white shadow-sm ${className ?? ""}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {files.map((file) => (
            <span
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex max-w-full items-center gap-1.5 rounded-full bg-foam px-3 py-1 text-[12px] text-ink"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                className="text-mute hover:text-ink"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles(files.filter((item) => item !== file))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        rows={emptyRows(message)}
        placeholder={placeholder}
        disabled={pending}
        className="w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-7 text-ink outline-none placeholder:text-mute"
      />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-mute hover:bg-foam hover:text-ink"
            aria-label="Attach documents"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
          >
            +
          </button>
          <div className="flex rounded-full bg-foam p-0.5 text-[13px] font-medium">
            <button
              type="button"
              onClick={() => setPanel("chat")}
              className={`rounded-full px-3 py-1 ${panel === "chat" ? "bg-white text-ink" : "text-mute"}`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setPanel("draft")}
              className={`rounded-full px-3 py-1 ${panel === "draft" ? "bg-white text-ink" : "text-mute"}`}
            >
              Draft{draftReady ? " · ready" : ""}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-mute">
          {pending ? <Spinner className="h-4 w-4 text-crust" /> : <span>GPT-5</span>}
          <button
            type="button"
            onClick={onSend}
            disabled={pending || (!message.trim() && files.length === 0)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-crust text-white disabled:opacity-30"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanEditor({
  draft,
  onChange,
}: {
  draft: PlanDraft;
  onChange: (draft: PlanDraft) => void;
}) {
  if (!draft.project) return null;
  const project = draft.project;

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          className={inputClass}
          value={project.name}
          onChange={(event) =>
            onChange({
              ...draft,
              project: { ...project, name: event.target.value },
            })
          }
        />
      </Field>
      <Field label="Goal">
        <textarea
          className={textareaClass}
          value={project.goal}
          onChange={(event) =>
            onChange({
              ...draft,
              project: { ...project, goal: event.target.value },
            })
          }
        />
      </Field>
      <div className="space-y-2">
        {draft.phases.map((phase, index) => (
          <div key={phase.temp_id} className="rounded-xl bg-foam px-3 py-2.5">
            <input
              className="w-full bg-transparent text-sm font-medium outline-none"
              value={phase.name}
              onChange={(event) => {
                const phases = [...draft.phases];
                phases[index] = { ...phase, name: event.target.value };
                onChange({ ...draft, phases });
              }}
            />
            <p className="text-[12px] text-mute">
              {draft.tasks.filter((task) => task.phase_temp_id === phase.temp_id).length} tasks
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {draft.tasks.map((task, index) => (
          <div
            key={task.temp_id}
            className="grid gap-2 rounded-xl border border-flour px-3 py-2 sm:grid-cols-[1fr_auto]"
          >
            <input
              className="bg-transparent text-sm font-medium outline-none"
              value={task.title}
              onChange={(event) => {
                const tasks = [...draft.tasks];
                tasks[index] = { ...task, title: event.target.value };
                onChange({ ...draft, tasks });
              }}
            />
            <SecondaryButton
              type="button"
              className="h-8 px-3 text-xs"
              onClick={() =>
                onChange({
                  ...draft,
                  tasks: draft.tasks.filter((item) => item.temp_id !== task.temp_id),
                  dependencies: draft.dependencies.filter(
                    (dep) =>
                      dep.predecessor_temp_id !== task.temp_id &&
                      dep.successor_temp_id !== task.temp_id,
                  ),
                })
              }
            >
              Remove
            </SecondaryButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyRows(message: string) {
  return Math.min(6, Math.max(2, message.split("\n").length));
}

function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
