// Server-only Claude client. AI is "on" only when both ANTHROPIC_API_KEY and ANTHROPIC_MODEL are set.

import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export type AiStatus = { enabled: true } | { enabled: false; reason: string };

export function aiStatus(): AiStatus {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { enabled: false, reason: "Add ANTHROPIC_API_KEY to .env.local to turn it on." };
  }
  if (!process.env.ANTHROPIC_MODEL) {
    return { enabled: false, reason: "Add ANTHROPIC_MODEL to .env.local (for example claude-sonnet-5-5)." };
  }
  return { enabled: true };
}

/** Error with a message that is safe and friendly to show in the UI. */
export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Explicit key and base URL so a stray ANTHROPIC_BASE_URL or CLI profile on the machine is never picked up.
  client ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: "https://api.anthropic.com",
    timeout: 55_000,
    maxRetries: 1,
  });
  return client;
}

type AskOptions<S extends z.ZodType> = {
  system: string;
  content: Anthropic.ContentBlockParam[];
  schema: S;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
};

/**
 * One Claude call that must come back as JSON matching `schema`.
 * Retries once on a parse failure or truncated output, then gives a friendly error.
 */
export async function askJson<S extends z.ZodType>(opts: AskOptions<S>): Promise<z.output<S>> {
  const status = aiStatus();
  if (!status.enabled) throw new AiError(status.reason, 503);
  const model = process.env.ANTHROPIC_MODEL as string;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let response;
    try {
      response = await getClient().messages.parse({
        model,
        max_tokens: opts.maxTokens ?? 8000,
        system: opts.system,
        messages: [{ role: "user", content: opts.content }],
        output_config: { effort: opts.effort, format: zodOutputFormat(opts.schema) },
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new AiError("Your Anthropic API key was rejected. Check ANTHROPIC_API_KEY.", 502);
      if (e instanceof Anthropic.NotFoundError) throw new AiError(`"${model}" isn't a model this key can use. Check ANTHROPIC_MODEL.`, 502);
      if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI is busy right now. Try again in a minute.", 429);
      if (e instanceof Anthropic.BadRequestError) throw new AiError(`The AI couldn't read that request: ${e.message}`, 502);
      if (e instanceof Anthropic.APIConnectionError) throw new AiError("Can't reach the AI right now. Check your connection.", 502);
      if (e instanceof Anthropic.APIError) throw new AiError(`AI error (${e.status}). Try again.`, 502);
      // Anything else is most likely the JSON failing our schema: retry once.
      if (attempt === 2) throw new AiError("The AI gave a messy answer twice. Try again.", 502);
      continue;
    }

    if (response.stop_reason === "refusal") throw new AiError("The AI won't rate this photo. Try a different one.", 422);
    if (response.parsed_output != null) return response.parsed_output;
    if (attempt === 2) throw new AiError("The AI gave a messy answer twice. Try again.", 502);
  }
  throw new AiError("The AI gave a messy answer. Try again.", 502);
}

export function jpegBlock(bytes: ArrayBuffer): Anthropic.ImageBlockParam {
  return {
    type: "image",
    source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(bytes).toString("base64") },
  };
}
