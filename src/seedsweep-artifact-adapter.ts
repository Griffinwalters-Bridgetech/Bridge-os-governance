import type { SeedSweepPhaseState, SeedSweepStoplight } from "./seedsweep-phase-machine";

export type Stoplight = "GREEN" | "YELLOW" | "RED";
export type ArtifactStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type SeedSweepArtifact = {
  id: string;
  compiler: "SEEDSWEEP";
  status: ArtifactStatus;
  stoplight: Stoplight;
  holding_space_003: string[];
  approvals: {
    approvedByHuman: boolean;
    approvedAt?: string;
  };
  payload: {
    state: SeedSweepPhaseState;
    summary: string;
  };
};

export function createSeedSweepArtifact(seedSweepState: SeedSweepPhaseState): SeedSweepArtifact {
  return {
    id: "artifact_seedsweep_001",
    compiler: "SEEDSWEEP",
    status: "DRAFT",
    stoplight: "YELLOW",
    holding_space_003: ["I will approve SeedSweep only when it genuinely stabilizes the next action."],
    approvals: { approvedByHuman: false },
    payload: {
      state: seedSweepState,
      summary: "",
    }
  };
}

export function updateSeedSweepArtifactFromState(
  artifact: SeedSweepArtifact,
  state: SeedSweepPhaseState,
  stoplight: SeedSweepStoplight
): SeedSweepArtifact {
  const summary =
    state.phase === "COMPLETE"
      ? [
          `Trigger: ${state.trigger}`,
          `Objective: ${state.stop.objective}`,
          `Observations: ${state.witness.observations.join(" | ")}`,
          `Contradictions: ${state.witness.contradictions.join(" | ")}`,
          `Debris: ${state.sweep.debris.map(d => `${d.action}:${d.item}`).join(" | ")}`,
          `Selected Seed: ${state.seed.selected}`,
          `Success Condition: ${state.seed.success_condition}`,
          `Next Action: ${state.stabilize.next_action}`,
          `Watch For: ${state.stabilize.watch_for.join(" | ")}`,
          `Recheck: ${state.stabilize.recheck_at ?? "(none)"}`,
          `CompletedAt: ${state.completedAt ?? "(none)"}`,
        ].join("\n")
      : artifact.payload.summary;

  return {
    ...artifact,
    stoplight: stoplight,
    payload: { state, summary }
  };
}
