import { loadConfig } from "../config/config.js";
import { loadSessionStore, resolveStorePath } from "../config/sessions.js";
import { getAiRunContext, registerAiRunContext } from "../infra/ai-events.js";
import { toAgentRequestSessionKey } from "../routing/session-key.js";

export function resolveSessionKeyForRun(runId: string) {
  const cached = getAiRunContext(runId)?.sessionKey;
  if (cached) {
    return cached;
  }
  const cfg = loadConfig();
  const storePath = resolveStorePath(cfg.session?.store);
  const store = loadSessionStore(storePath);
  const found = Object.entries(store).find(([, entry]) => entry?.sessionId === runId);
  const storeKey = found?.[0];
  if (storeKey) {
    const sessionKey = toAgentRequestSessionKey(storeKey) ?? storeKey;
    registerAiRunContext(runId, { sessionKey });
    return sessionKey;
  }
  return undefined;
}
