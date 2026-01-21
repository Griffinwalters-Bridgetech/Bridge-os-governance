import type { Actor, Action, EvalResult, EvalError, Stoplight } from "./types";
import type { Session } from "./session";
import type { Artifact } from "./artifacts";
import { validateSession, validateArtifacts } from "./validate";
import { worstStoplight } from "./stoplight";
import { humanOnlyGate, transitionPolicy } from "./policy";
import { applySeedSweepPolicyGate } from "./evaluate.seedSweep-hook";

/**
 * Unified evaluate() function.
 * Deterministic pure function.
 * No AI judgment: just rules.
 */
export function evaluate(
  session: Session,
  artifacts: Artifact[],
  action: Action,
  actor: Actor
): EvalResult {
  const errors: EvalError[] = [];
  const side_effects: string[] = [];

  // 1) Schema validation (session + artifacts)
  errors.push(...validateSession(session));
  errors.push(...validateArtifacts(artifacts));

  // 2) Human-only gates
  errors.push(...humanOnlyGate(actor, action));

  // If schema/gate violations exist, do not mutate state.
  if (errors.length > 0) {
    return { allowed: false, errors, newSession: session, newArtifacts: artifacts, side_effects };
  }

  // 3) SeedSweep policy gate (INTEGRATED)
  const seedSweepGate = applySeedSweepPolicyGate(session, artifacts, action);
  if (!seedSweepGate.allowed) {
    return {
      allowed: false,
      errors: [...errors, ...seedSweepGate.errors],
      newSession: session,
      newArtifacts: artifacts,
      side_effects
    };
  }

  // 4) Stoplight binding: session stoplight becomes worst of core artifacts (and seedsweep, if active)
  const boundStoplight = bindStoplight(session, artifacts);

  // Apply stoplight binding regardless of action (deterministic)
  let newSession: Session = { ...session, stoplight: boundStoplight, updatedAt: nowIso() };
  let newArtifacts: Artifact[] = artifacts.map((a) => ({ ...a }));

  // 5) Transition prerequisites
  errors.push(...transitionPolicy(newSession, newArtifacts, action));

  if (errors.length > 0) {
    return { allowed: false, errors, newSession, newArtifacts, side_effects };
  }

  // 6) Apply action (pure state updates)
  switch (action.type) {
    case "SESSION_START_COMPILATION": {
      newSession = { ...newSession, state: "IN_COMPILATION", updatedAt: nowIso() };
      side_effects.push("Session moved to IN_COMPILATION.");
      break;
    }

    case "SESSION_TRIGGER_SEEDSWEEP": {
      const ss = ensureSeedSweepArtifact(newArtifacts, actor);
      newSession = {
        ...newSession,
        state: "SEEDSWEEP_IN_PROGRESS",
        activeSeedSweepArtifactId: ss.id,
        updatedAt: nowIso()
      };
      side_effects.push(`SeedSweep triggered: ${action.reason}. Active artifact: ${ss.id}`);
      break;
    }

    case "SESSION_RESUME_AFTER_SEEDSWEEP": {
      newSession = { ...newSession, state: "IN_COMPILATION", updatedAt: nowIso() };
      side_effects.push("Session resumed after SeedSweep.");
      break;
    }

    case "SESSION_REQUEST_FINALIZE": {
      newSession = { ...newSession, state: "AWAITING_HUMAN_SIGNOFF", updatedAt: nowIso() };
      side_effects.push("Session moved to AWAITING_HUMAN_SIGNOFF.");
      break;
    }

    case "SESSION_SIGNOFF": {
      newSession = {
        ...newSession,
        human_signoff: {
          signed: true,
          signedBy: action.signerName,
          signedRole: action.signerRole ?? "HUMAN",
          signedAt: nowIso()
        },
        updatedAt: nowIso()
      };
      side_effects.push("Human signoff recorded.");
      break;
    }

    case "SESSION_FINALIZE": {
      newSession = { ...newSession, state: "FINALIZED", updatedAt: nowIso() };
      side_effects.push("Session FINALIZED.");
      break;
    }

    case "ARTIFACT_SET_STATUS": {
      newArtifacts = newArtifacts.map((a) =>
        a.id === action.artifactId
          ? {
              ...a,
              status: action.status,
              approvals:
                action.status === "APPROVED"
                  ? { approvedByHuman: actor === "HUMAN", approvedAt: nowIso(), approvedBy: actor === "HUMAN" ? "HUMAN" : undefined }
                  : { ...a.approvals }
            }
          : a
      );
      side_effects.push(`Artifact ${action.artifactId} status set to ${action.status}.`);
      break;
    }

    case "ARTIFACT_SET_STOPLIGHT": {
      newArtifacts = newArtifacts.map((a) => (a.id === action.artifactId ? { ...a, stoplight: action.stoplight } : a));
      side_effects.push(`Artifact ${action.artifactId} stoplight set to ${action.stoplight}.`);
      break;
    }
  }

  // Re-bind stoplight after mutations.
  newSession = { ...newSession, stoplight: bindStoplight(newSession, newArtifacts), updatedAt: nowIso() };

  return { allowed: true, errors: [], newSession, newArtifacts, side_effects };
}

function bindStoplight(session: Session, artifacts: Artifact[]): Stoplight {
  const core = artifacts.filter((a) => ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"].includes(a.compiler));
  const lights: Stoplight[] = core.map((a) => a.stoplight);

  if (session.state === "SEEDSWEEP_IN_PROGRESS" && session.activeSeedSweepArtifactId) {
    const ss = artifacts.find((a) => a.id === session.activeSeedSweepArtifactId);
    if (ss) lights.push(ss.stoplight);
  }

  const worst = worstStoplight(lights);
  if (session.state === "IN_COMPILATION" && lights.length === 0) return "YELLOW";
  return worst;
}

function ensureSeedSweepArtifact(artifacts: Artifact[], actor: Actor): Artifact {
  const existing = artifacts.find((a) => a.compiler === "SEEDSWEEP" && a.status !== "REJECTED");
  if (existing) return existing;

  const id = `ss_${Math.random().toString(16).slice(2, 10)}`;
  const now = nowIso();

  const ss: Artifact = {
    id,
    compiler: "SEEDSWEEP",
    status: "DRAFT",
    stoplight: "YELLOW",
    payload: {
      trigger: "HUMAN_REQUEST",
      phases: {
        stop: { pause_acknowledged: false, objective: "Pause and create holding space.", holding_space_003: ["What must remain human here?"] },
        witness: { observations: ["What is happening right now?"], holding_space_003: ["What might we be missing?"] },
        sweep: { debris: [{ item: "Unresolved contradiction", action: "PARK" }], holding_space_003: ["Which debris must be handled by a human?"] },
        seed: { candidates: ["Small reversible next step"], selected: "Small reversible next step", success_condition: "Clarity increases; stoplight improves.", holding_space_003: ["What is the human decision?"] },
        stabilize: { next_action: "Resume compilation with clarity.", reversible: true, watch_for: ["Looping", "Escalation"], holding_space_003: ["Where do we re-check?"] }
      }
    },
    holding_space_003: ["SeedSweep created: preserve .03 at artifact level."],
    approvals: { approvedByHuman: false }
  };

  artifacts.push(ss);
  return ss;
}

function nowIso(): string {
  return new Date().toISOString();
}
