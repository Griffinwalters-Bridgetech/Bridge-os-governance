import { describe, it, expect } from "vitest";
import { evaluate } from "./evaluate";
import type { Session, Artifact, Actor, Action } from "./types";

function deepFreeze<T>(obj: T): T {
    if (obj && typeof obj === "object") {
        Object.freeze(obj);
        for (const key of Object.getOwnPropertyNames(obj)) {
            const val = (obj as any)[key];
            if (val && typeof val === "object" && !Object.isFrozen(val)) {
                deepFreeze(val);
            }
        }
    }
    return obj;
}

describe("evaluate() purity — must not mutate inputs", () => {
    it("does not mutate session or artifacts (deep freeze)", () => {
        const session: Session = deepFreeze({
            id: "s1",
            createdAt: "2026-01-26T00:00:00.000Z",
            updatedAt: "2026-01-26T00:00:00.000Z",
            state: "IN_COMPILATION",
            stoplight: "GREEN",
            title: "Test",
            intent: "Test purity",
            holding_space_003: ["hold"],
            human_signoff: { signed: false }
        });
        const artifacts: Artifact[] = deepFreeze([{
            id: "a_ing",
            compiler: "INGESTION",
            status: "APPROVED",
            stoplight: "GREEN",
            payload: {
                source: "CHAT",
                raw_input: "x",
                normalized_summary: "x",
                stoplight: "GREEN",
                holding_space_003: ["hold"]
            },
            holding_space_003: ["hold"],
            approvals: { approvedByHuman: true }
        }]);
        const actor: Actor = "HUMAN";
        const action: Action = { 
            type: "SESSION_TRIGGER_SEEDSWEEP", 
            reason: "test" 
        };
    // If evaluate mutates frozen objects, this throws
    const result = evaluate(session, artifacts, action, actor);
    // Sanity checks
    expect(result.allowed).toBe(true);
    expect(result.newSession).not.toBe(session);
    expect(result.newArtifacts).not.toBe(artifacts);
    });
});