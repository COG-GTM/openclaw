import type { VerboseLevel } from "../auto-reply/thinking.js";

export type AiEventStream = "lifecycle" | "tool" | "assistant" | "error" | (string & {});

export type AiEventPayload = {
  runId: string;
  seq: number;
  stream: AiEventStream;
  ts: number;
  data: Record<string, unknown>;
  sessionKey?: string;
};

export type AiRunContext = {
  sessionKey?: string;
  verboseLevel?: VerboseLevel;
  isHeartbeat?: boolean;
};

// Keep per-run counters so streams stay strictly monotonic per runId.
const seqByRun = new Map<string, number>();
const listeners = new Set<(evt: AiEventPayload) => void>();
const runContextById = new Map<string, AiRunContext>();

export function registerAiRunContext(runId: string, context: AiRunContext) {
  if (!runId) {
    return;
  }
  const existing = runContextById.get(runId);
  if (!existing) {
    runContextById.set(runId, { ...context });
    return;
  }
  if (context.sessionKey && existing.sessionKey !== context.sessionKey) {
    existing.sessionKey = context.sessionKey;
  }
  if (context.verboseLevel && existing.verboseLevel !== context.verboseLevel) {
    existing.verboseLevel = context.verboseLevel;
  }
  if (context.isHeartbeat !== undefined && existing.isHeartbeat !== context.isHeartbeat) {
    existing.isHeartbeat = context.isHeartbeat;
  }
}

export function getAiRunContext(runId: string) {
  return runContextById.get(runId);
}

export function clearAiRunContext(runId: string) {
  runContextById.delete(runId);
}

export function resetAiRunContextForTest() {
  runContextById.clear();
}

export function emitAiEvent(event: Omit<AiEventPayload, "seq" | "ts">) {
  const nextSeq = (seqByRun.get(event.runId) ?? 0) + 1;
  seqByRun.set(event.runId, nextSeq);
  const context = runContextById.get(event.runId);
  const sessionKey =
    typeof event.sessionKey === "string" && event.sessionKey.trim()
      ? event.sessionKey
      : context?.sessionKey;
  const enriched: AiEventPayload = {
    ...event,
    sessionKey,
    seq: nextSeq,
    ts: Date.now(),
  };
  for (const listener of listeners) {
    try {
      listener(enriched);
    } catch {
      /* ignore */
    }
  }
}

export function onAiEvent(listener: (evt: AiEventPayload) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
