export type SeedSweepPhase = "STOP" | "WITNESS" | "SWEEP" | "SEED" | "STABILIZE" | "COMPLETE";

export type SeedSweepTrigger =
  | "HUMAN_REQUEST"
  | "CONFUSION_DETECTED"
  | "STOPLIGHT_RED"
  | "RECURSION_LOOP"
  | "PRE_SESSION_PREFLIGHT";

export type SeedSweepStoplight = "GREEN" | "YELLOW" | "RED";

export type Phase003 = {
  holding_space_003: string[];
};

export type SeedSweepPhaseState = {
  phase: SeedSweepPhase;
  stoplight: SeedSweepStoplight;
  trigger: SeedSweepTrigger;

  stop: {
    pause_acknowledged: boolean;
    objective: string;
    phase_003: Phase003;
    confirmedByHuman: boolean;
    confirmedAt?: string;
  };

  witness: {
    observations: string[];
    contradictions: string[];
    phase_003: Phase003;
    confirmedByHuman: boolean;
    confirmedAt?: string;
  };

  sweep: {
    debris: { item: string; action: "REMOVE" | "PARK" | "KEEP" }[];
    phase_003: Phase003;
    confirmedByHuman: boolean;
    confirmedAt?: string;
  };

  seed: {
    candidates: string[];
    selected: string;
    success_condition: string;
    phase_003: Phase003;
    confirmedByHuman: boolean;
    confirmedAt?: string;
  };

  stabilize: {
    next_action: string;
    reversible: boolean;
    watch_for: string[];
    recheck_at?: string;
    phase_003: Phase003;
    confirmedByHuman: boolean;
    confirmedAt?: string;
  };

  completedAt?: string;
};

export function createDefaultSeedSweepState(trigger: SeedSweepTrigger): SeedSweepPhaseState {
  return {
    phase: "STOP",
    stoplight: "YELLOW",
    trigger,
    stop: {
      pause_acknowledged: false,
      objective: "",
      phase_003: { holding_space_003: ["I will confirm when I have actually paused."] },
      confirmedByHuman: false,
    },
    witness: {
      observations: [],
      contradictions: [],
      phase_003: { holding_space_003: ["I will confirm what is true vs assumed."] },
      confirmedByHuman: false,
    },
    sweep: {
      debris: [],
      phase_003: { holding_space_003: ["I will confirm what to remove vs park."] },
      confirmedByHuman: false,
    },
    seed: {
      candidates: [],
      selected: "",
      success_condition: "",
      phase_003: { holding_space_003: ["I will confirm the chosen seed is the right next step."] },
      confirmedByHuman: false,
    },
    stabilize: {
      next_action: "",
      reversible: true,
      watch_for: [],
      phase_003: { holding_space_003: ["I will confirm stability + what to watch for."] },
      confirmedByHuman: false,
    },
  };
}

export type SeedSweepPhaseGateError = {
  phase: SeedSweepPhase;
  message: string;
};

function has003(x: Phase003): boolean {
  return Array.isArray(x?.holding_space_003) && x.holding_space_003.length >= 1 && x.holding_space_003.every(s => s.trim().length > 0);
}

export function computeSeedSweepStoplight(state: SeedSweepPhaseState): SeedSweepStoplight {
  const hasUnresolvedContradictions = state.witness.contradictions.length > 0 && state.sweep.debris.length === 0;
  const hasParked = state.sweep.debris.some(d => d.action === "PARK");
  const stabilizeMissing = state.phase === "COMPLETE" && (!state.stabilize.next_action || state.stabilize.watch_for.length === 0);

  if (hasUnresolvedContradictions) return "RED";
  if (hasParked && !state.stabilize.recheck_at) return "RED";
  if (stabilizeMissing) return "RED";

  if (state.phase === "COMPLETE") return "GREEN";
  return "YELLOW";
}

export function validatePhaseGates(state: SeedSweepPhaseState, actor: "HUMAN" | "ASSISTANT"): SeedSweepPhaseGateError[] {
  const errs: SeedSweepPhaseGateError[] = [];

  if (!state.stop.pause_acknowledged) errs.push({ phase: "STOP", message: "STOP requires pause_acknowledged = true." });
  if (!state.stop.objective.trim()) errs.push({ phase: "STOP", message: "STOP requires an objective (one sentence)." });
  if (!has003(state.stop.phase_003)) errs.push({ phase: "STOP", message: "STOP requires phase-level holding_space_003 (min 1 item)." });

  if (state.phase !== "STOP") {
    if (state.witness.observations.length < 1) errs.push({ phase: "WITNESS", message: "WITNESS requires at least 1 observation." });
    if (!has003(state.witness.phase_003)) errs.push({ phase: "WITNESS", message: "WITNESS requires phase-level holding_space_003 (min 1 item)." });
  }

  if (state.phase === "SWEEP" || state.phase === "SEED" || state.phase === "STABILIZE" || state.phase === "COMPLETE") {
    if (state.sweep.debris.length < 1) errs.push({ phase: "SWEEP", message: "SWEEP requires at least 1 debris item." });
    if (!has003(state.sweep.phase_003)) errs.push({ phase: "SWEEP", message: "SWEEP requires phase-level holding_space_003 (min 1 item)." });
  }

  if (state.phase === "SEED" || state.phase === "STABILIZE" || state.phase === "COMPLETE") {
    if (state.seed.candidates.length < 1) errs.push({ phase: "SEED", message: "SEED requires at least 1 candidate seed." });
    if (!state.seed.selected.trim()) errs.push({ phase: "SEED", message: "SEED requires selected seed." });
    if (!state.seed.success_condition.trim()) errs.push({ phase: "SEED", message: "SEED requires success_condition." });
    if (!has003(state.seed.phase_003)) errs.push({ phase: "SEED", message: "SEED requires phase-level holding_space_003 (min 1 item)." });
  }

  if (state.phase === "STABILIZE" || state.phase === "COMPLETE") {
    if (!state.stabilize.next_action.trim()) errs.push({ phase: "STABILIZE", message: "STABILIZE requires next_action." });
    if (state.stabilize.watch_for.length < 1) errs.push({ phase: "STABILIZE", message: "STABILIZE requires at least 1 watch_for." });
    if (!has003(state.stabilize.phase_003)) errs.push({ phase: "STABILIZE", message: "STABILIZE requires phase-level holding_space_003 (min 1 item)." });
  }

  if (actor === "ASSISTANT") {
    const anyConfirmed =
      state.stop.confirmedByHuman ||
      state.witness.confirmedByHuman ||
      state.sweep.confirmedByHuman ||
      state.seed.confirmedByHuman ||
      state.stabilize.confirmedByHuman;

    if (anyConfirmed) errs.push({ phase: state.phase, message: "ASSISTANT cannot confirm any SeedSweep phase." });
  }

  const tsErr = (phase: SeedSweepPhase, confirmed: boolean, at?: string) => {
    if (confirmed && !at) errs.push({ phase, message: `Phase ${phase} confirmation requires confirmedAt timestamp.` });
  };
  tsErr("STOP", state.stop.confirmedByHuman, state.stop.confirmedAt);
  tsErr("WITNESS", state.witness.confirmedByHuman, state.witness.confirmedAt);
  tsErr("SWEEP", state.sweep.confirmedByHuman, state.sweep.confirmedAt);
  tsErr("SEED", state.seed.confirmedByHuman, state.seed.confirmedAt);
  tsErr("STABILIZE", state.stabilize.confirmedByHuman, state.stabilize.confirmedAt);

  if (state.phase === "COMPLETE") {
    const allConfirmed =
      state.stop.confirmedByHuman &&
      state.witness.confirmedByHuman &&
      state.sweep.confirmedByHuman &&
      state.seed.confirmedByHuman &&
      state.stabilize.confirmedByHuman;

    if (!allConfirmed) errs.push({ phase: "COMPLETE", message: "COMPLETE requires all phases confirmed by HUMAN." });
  }

  return errs;
}

export function nextPhase(current: SeedSweepPhase): SeedSweepPhase {
  switch (current) {
    case "STOP": return "WITNESS";
    case "WITNESS": return "SWEEP";
    case "SWEEP": return "SEED";
    case "SEED": return "STABILIZE";
    case "STABILIZE": return "COMPLETE";
    case "COMPLETE": return "COMPLETE";
  }
}
