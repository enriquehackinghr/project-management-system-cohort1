"use client";

import { useState, useTransition } from "react";
import { askAssistant, confirmAssistantAction } from "@/actions/assistant";
import type { ProposedAction } from "@/lib/schemas";
import { BaguetteIcon } from "./AppShell";
import { PrimaryButton, SecondaryButton, Spinner } from "./ui";

type Turn = { role: "user" | "assistant"; content: string };

export function ProjectAssistant({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [error, setError] = useState<string | null>(null);

  function send() {
    const text = message.trim();
    if (!text || pending) return;
    setMessage("");
    setError(null);
    setHistory((prev) => [...prev, { role: "user", content: text }]);
    startTransition(async () => {
      try {
        const result = await askAssistant(projectId, history, text);
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: result.reply },
        ]);
        setActions(result.proposed_actions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The assistant could not answer.");
      }
    });
  }

  function confirm(action: ProposedAction) {
    startTransition(async () => {
      try {
        await confirmAssistantAction(projectId, action);
        setActions((prev) => prev.filter((item) => item !== action));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not apply that action.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-50 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] bg-crust text-white shadow-[0_14px_36px_rgba(224,78,27,0.45)] transition hover:scale-105 hover:bg-crust-deep"
        aria-label="Open assistant"
      >
        <BaguetteIcon className="h-10 w-10 -rotate-[20deg]" tone="loaf" />
      </button>
    );
  }

  return (
    <div
      className="fixed right-6 bottom-6 z-50 flex flex-col overflow-hidden rounded-[28px] border border-flour bg-white shadow-[0_24px_64px_rgba(31,33,40,0.22)]"
      style={{
        width: "min(440px, calc(100vw - 24px))",
        height: "min(680px, calc(100dvh - 96px))",
      }}
      role="dialog"
      aria-label="Project assistant"
    >
      <div className="flex items-center justify-between gap-3 bg-crust px-4 py-3.5 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <BaguetteIcon className="h-7 w-7" tone="loaf" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-5">Assistant</p>
            <p className="truncate text-[12px] text-white/80">{projectName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-white/90 hover:bg-white/15"
          aria-label="Close assistant"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
        {history.length === 0 ? (
          <p className="text-[15px] leading-7 break-words text-mute">
            Ask about this project. Creates, reassigns, and reschedules wait for a
            confirm button before anything is written.
          </p>
        ) : null}
        <div className="space-y-3">
          {history.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`max-w-full rounded-2xl px-3.5 py-3 text-[15px] leading-7 break-words whitespace-pre-wrap ${
                turn.role === "user" ? "bg-foam" : "bg-[#fff1ea]"
              }`}
            >
              {turn.content}
            </div>
          ))}
          {pending ? (
            <p className="flex items-center gap-2 text-sm text-mute">
              <Spinner />
              Thinking…
            </p>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="mt-4 space-y-2">
            {actions.map((action, index) => (
              <div
                key={`${action.type}-${index}`}
                className="rounded-xl border border-flour px-3 py-2"
              >
                <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                  {action.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <SecondaryButton
                    type="button"
                    className="h-9 px-3 text-xs"
                    onClick={() => setActions((prev) => prev.filter((item) => item !== action))}
                  >
                    Dismiss
                  </SecondaryButton>
                  <PrimaryButton
                    type="button"
                    className="h-9 px-3 text-xs"
                    onClick={() => confirm(action)}
                    disabled={pending}
                  >
                    Confirm write
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm break-words text-crust">{error}</p> : null}
      </div>

      <div className="border-t border-flour p-4">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder="Ask about this project…"
          disabled={pending}
          className="min-h-[4.5rem] w-full resize-none overflow-y-auto rounded-xl border border-flour bg-foam/60 px-3 py-2.5 text-[15px] leading-6 text-ink break-words whitespace-pre-wrap outline-none focus:border-crust"
        />
        <div className="mt-2 flex justify-end">
          <PrimaryButton
            type="button"
            className="h-9 px-4 text-xs"
            onClick={send}
            disabled={pending || !message.trim()}
          >
            {pending ? "Thinking" : "Send"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
