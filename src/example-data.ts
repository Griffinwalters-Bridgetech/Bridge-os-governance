import type { Session } from "./session";
import type { Artifact } from "./artifacts";

export function makeExampleSession(nowIso: string): Session {
  return {
    id: "session_001",
    createdAt: nowIso,
    updatedAt: nowIso,
    state: "DRAFT",
    stoplight: "YELLOW",
    title: "Example: Governance happy-path + failure cases",
    intent: "Demonstrate deterministic governance with .03 and human gates.",
    holding_space_003: ["Human remains final arbiter of approval and finalization."],
    human_signoff: { signed: false }
  };
}

export function makeExampleArtifacts(): Artifact[] {
  return [
    {
      id: "a_ingestion",
      compiler: "INGESTION",
      status: "DRAFT",
      stoplight: "YELLOW",
      payload: {
        source: "CHAT",
        raw_input: "Raw user text / transcript",
        normalized_summary: "Normalized summary suitable for compilers.",
        stoplight: "YELLOW",
        holding_space_003: ["What was omitted from the raw input?"]
      },
      holding_space_003: ["Ingestion .03: preserve uncertainty."],
      approvals: { approvedByHuman: false }
    },
    {
      id: "a_semantic",
      compiler: "SEMANTIC",
      status: "DRAFT",
      stoplight: "YELLOW",
      payload: {
        terms: [{ term: ".03 holding_space_003", definition: "Required residual for human judgment at every layer." }],
        ambiguities: ["What counts as 'core' artifacts in future versions?"],
        assumptions: ["Human remains the sole signer for finalization."],
        stoplight: "YELLOW",
        holding_space_003: ["Which definitions must remain provisional?"]
      },
      holding_space_003: ["Semantic .03: protect meanings from premature closure."],
      approvals: { approvedByHuman: false }
    },
    {
      id: "a_execution",
      compiler: "EXECUTION",
      status: "DRAFT",
      stoplight: "YELLOW",
      payload: {
        plan_steps: [
          { step: "Approve artifacts as HUMAN", reversible: true, owner: "HUMAN" },
          { step: "Request finalize; signoff; finalize", reversible: true, owner: "HUMAN" }
        ],
        risks: ["ASSISTANT tries to bypass approval gate."],
        stoplight: "YELLOW",
        holding_space_003: ["Which step requires extra caution?"]
      },
      holding_space_003: ["Execution .03: preserve reversibility and oversight."],
      approvals: { approvedByHuman: false }
    },
    {
      id: "a_governance",
      compiler: "GOVERNANCE",
      status: "DRAFT",
      stoplight: "YELLOW",
      payload: {
        policy_version: "v1",
        rules_summary: "Human-only approve/reject/signoff/finalize; .03 required; stoplight binds to worst.",
        test_vectors: [
          { name: "assistant_cannot_approve", given: { actor: "ASSISTANT", action: "ARTIFACT_SET_STATUS:APPROVED" }, then: { allowed: false } },
          { name: "finalize_requires_signoff", given: { signed: true }, then: { allowed: true } }
        ],
        stoplight: "YELLOW",
        holding_space_003: ["What policy edge case do we anticipate?"]
      },
      holding_space_003: ["Governance .03: preserve future policy evolution."],
      approvals: { approvedByHuman: false }
    }
  ];
}
