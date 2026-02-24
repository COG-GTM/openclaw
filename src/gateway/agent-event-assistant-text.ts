import type { AiEventPayload } from "../infra/ai-events.js";

export function resolveAssistantStreamDeltaText(evt: AiEventPayload): string {
  const delta = evt.data.delta;
  const text = evt.data.text;
  return typeof delta === "string" ? delta : typeof text === "string" ? text : "";
}
