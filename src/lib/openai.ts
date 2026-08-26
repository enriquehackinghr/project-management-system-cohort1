import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getOpenAiKey } from "./env";

type ChatMessage = { role: "user" | "assistant"; content: string };

function client() {
  return new OpenAI({ apiKey: getOpenAiKey() });
}

export async function completeJson<T extends z.ZodType>(
  schema: T,
  name: string,
  messages: ChatMessage[],
  instructions: string,
) {
  const response = await client().responses.parse({
    model: "gpt-5",
    instructions,
    input: messages,
    text: { format: zodTextFormat(schema, name) },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return valid structured output.");
  }

  return response.output_parsed as z.infer<T>;
}
