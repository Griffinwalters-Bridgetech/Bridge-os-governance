import { z } from "zod";
import type { ArtifactStatus, CompilerId, Stoplight } from "./types";
import { HoldingSpace003Schema } from "./session";

export const IngestionPayloadSchema = z.object({
  source: z.enum(["CHAT", "NOTE", "DOC", "OTHER"]),
  raw_input: z.string().min(1),
  normalized_summary: z.string().min(1),
  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),
  holding_space_003: HoldingSpace003Schema
});

export const SemanticPayloadSchema = z.object({
  terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(1),
  ambiguities: z.array(z.string().min(1)).optional(),
  assumptions: z.array(z.string().min(1)).optional(),
  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),
  holding_space_003: HoldingSpace003Schema
});

export const ExecutionPayloadSchema = z.object({
  plan_steps: z.array(z.object({
    step: z.string().min(1),
    reversible: z.boolean(),
    owner: z.enum(["HUMAN", "ASSISTANT"]).default("HUMAN")
  })).min(1),
  risks: z.array(z.string().min(1)).optional(),
  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),
  holding_space_003: HoldingSpace003Schema
});

export const GovernancePayloadSchema = z.object({
  policy_version: z.string().min(1),
  rules_summary: z.string().min(1),
  test_vectors: z.array(z.object({
    name: z.string().min(1),
    given: z.record(z.any()),
    then: z.record(z.any())
  })).min(1),
  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),
  holding_space_003: HoldingSpace003Schema
});

export const SeedSweepPhaseSchema = z.enum(["STOP", "WITNESS", "SWEEP", "SEED", "STABILIZE"]);

export const SeedSweepPayloadSchema = z.object({
  trigger: z.enum(["HUMAN_REQUEST", "CONFUSION_DETECTED", "STOPLIGHT_RED", "RECURSION_LOOP"]),
  phases: z.object({
    stop: z.object({
      pause_acknowledged: z.boolean(),
      objective: z.string().min(1),
      holding_space_003: HoldingSpace003Schema
    }),
    witness: z.object({
      observations: z.array(z.string().min(1)).min(1),
      contradictions: z.array(z.string().min(1)).optional(),
      holding_space_003: HoldingSpace003Schema
    }),
    sweep: z.object({
      debris: z.array(z.object({
        item: z.string().min(1),
        action: z.enum(["REMOVE", "PARK", "KEEP"])
      })).min(1),
      holding_space_003: HoldingSpace003Schema
    }),
    seed: z.object({
      candidates: z.array(z.string().min(1)).min(1),
      selected: z.string().min(1),
      success_condition: z.string().min(1),
      holding_space_003: HoldingSpace003Schema
    }),
    stabilize: z.object({
      next_action: z.string().min(1),
      reversible: z.boolean(),
      watch_for: z.array(z.string().min(1)).min(1),
      holding_space_003: HoldingSpace003Schema
    })
  })
});

export const ArtifactSchema = z.object({
  id: z.string().min(1),
  compiler: z.enum(["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE", "SEEDSWEEP"]),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"]),
  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),

  payload: z.union([
    IngestionPayloadSchema,
    SemanticPayloadSchema,
    ExecutionPayloadSchema,
    GovernancePayloadSchema,
    SeedSweepPayloadSchema
  ]),

  holding_space_003: HoldingSpace003Schema,

  approvals: z.object({
    approvedByHuman: z.boolean(),
    approvedAt: z.string().min(1).optional(),
    approvedBy: z.string().min(1).optional()
  })
});

export type Artifact = z.infer<typeof ArtifactSchema> & {
  compiler: CompilerId;
  status: ArtifactStatus;
  stoplight: Stoplight;
};
