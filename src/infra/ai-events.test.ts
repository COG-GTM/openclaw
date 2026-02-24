import { describe, expect, test } from "vitest";
import {
  clearAiRunContext,
  emitAiEvent,
  getAiRunContext,
  onAiEvent,
  registerAiRunContext,
  resetAiRunContextForTest,
} from "./ai-events.js";

describe("agent-events sequencing", () => {
  test("stores and clears run context", async () => {
    resetAiRunContextForTest();
    registerAiRunContext("run-1", { sessionKey: "main" });
    expect(getAiRunContext("run-1")?.sessionKey).toBe("main");
    clearAiRunContext("run-1");
    expect(getAiRunContext("run-1")).toBeUndefined();
  });

  test("maintains monotonic seq per runId", async () => {
    const seen: Record<string, number[]> = {};
    const stop = onAiEvent((evt) => {
      const list = seen[evt.runId] ?? [];
      seen[evt.runId] = list;
      list.push(evt.seq);
    });

    emitAiEvent({ runId: "run-1", stream: "lifecycle", data: {} });
    emitAiEvent({ runId: "run-1", stream: "lifecycle", data: {} });
    emitAiEvent({ runId: "run-2", stream: "lifecycle", data: {} });
    emitAiEvent({ runId: "run-1", stream: "lifecycle", data: {} });

    stop();

    expect(seen["run-1"]).toEqual([1, 2, 3]);
    expect(seen["run-2"]).toEqual([1]);
  });

  test("preserves compaction ordering on the event bus", async () => {
    const phases: Array<string> = [];
    const stop = onAiEvent((evt) => {
      if (evt.runId !== "run-1") {
        return;
      }
      if (evt.stream !== "compaction") {
        return;
      }
      if (typeof evt.data?.phase === "string") {
        phases.push(evt.data.phase);
      }
    });

    emitAiEvent({ runId: "run-1", stream: "compaction", data: { phase: "start" } });
    emitAiEvent({
      runId: "run-1",
      stream: "compaction",
      data: { phase: "end", willRetry: false },
    });

    stop();

    expect(phases).toEqual(["start", "end"]);
  });
});
