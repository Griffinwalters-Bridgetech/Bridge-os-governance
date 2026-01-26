import type { Actor, Action, EvalError } from "./types";
import type { Session } from "./session";
import type { Artifact } from "./artifacts";
const CORE_COMPILERS = ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"] as const;

export function humanOnlyGate(actor: Actor, action: Action): EvalError[] {
  const isArtifactStatusChange = action.type === "ARTIFACT_SET_STATUS" && (action.status === "APPROVED" || action.status === "REJECTED");
  const isSessionSignoff = action.type === "SESSION_SIGNOFF";
  const isFinalize = action.type === "SESSION_FINALIZE";

  if (actor === "ASSISTANT" && (isArtifactStatusChange || isSessionSignoff || isFinalize)) {
    return [{ code: "HUMAN_GATE_REQUIRED", message: `Action ${action.type} requires HUMAN authority.` }];
  }
  return [];
}

export function transitionPolicy(session: Session, artifacts: Artifact[], action: Action): EvalError[] {
  const errors: EvalError[] = [];

  const core = coreArtifacts(artifacts);
  for (const compiler of CORE_COMPILERS) {
    const matches = core.filter((a) => a.compiler === compiler);

    if (matches.length === 0) {
      errors.push({
        code: "CORE_ARTIFACT_MISSING",
        message: `Missing required ${compiler} artifact.`
      });
    }

    if (matches.length > 1) {
      errors.push({
        code: "DUPLICATE_CORE_ARTIFACT",
        message: `Multiple ${compiler} artifacts detected. Only one is allowed.`
      });
    }
  }
  const anyCoreMissing = ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"].some((id) => !core.some((a) => a.compiler === id));

  const anyRed = core.some((a) => a.stoplight === "RED") || session.stoplight === "RED";
  const allApproved = ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"].every((id) =>
    core.some((a) => a.compiler === id && a.status === "APPROVED")
  );

  if (action.type === "SESSION_START_COMPILATION") {
    if (session.state === "FINALIZED") errors.push({ code: "SESSION_ALREADY_FINAL", message: "Session already FINALIZED." });
    if (anyCoreMissing) errors.push({ code: "MISSING_CORE_ARTIFACTS", message: "Cannot start: missing one or more core artifacts." });
  }

  if (action.type === "SESSION_RESUME_AFTER_SEEDSWEEP") {
    if (session.state !== "SEEDSWEEP_IN_PROGRESS") {
      errors.push({
        code: "NOT_IN_SEEDSWEEP",
        message: "Session is not in SEEDSWEEP_IN_PROGRESS."
      });
    }

    if (!session.activeSeedSweepArtifactId) {
      errors.push({
        code: "NO_ACTIVE_SEEDSWEEP",
        message: "Cannot resume: no active SeedSweep artifact."
      });
    } else {
      const ss = artifacts.find((a) => a.id === session.activeSeedSweepArtifactId);

      if (!ss) {
        errors.push({
          code: "SEEDSWEEP_ARTIFACT_MISSING",
          message: "Active SeedSweep artifact not found."
        });
      } else if (ss.compiler !== "SEEDSWEEP") {
        errors.push({
          code: "SEEDSWEEP_WRONG_COMPILER",
          message: "Active SeedSweep artifact is not a SEEDSWEEP artifact."
        });
      } else if (ss.status !== "APPROVED") {
        errors.push({
          code: "SEEDSWEEP_NOT_APPROVED",
          message: "Cannot resume: SeedSweep artifact must be APPROVED."
        });
      }
    }
  }

  if (action.type === "SESSION_REQUEST_FINALIZE") {
    if (!allApproved) errors.push({ code: "CORE_NOT_APPROVED", message: "Cannot request finalize: all core artifacts must be APPROVED." });
    if (anyRed) errors.push({ code: "STOPLIGHT_RED_BLOCKS_FINALIZE", message: "Cannot request finalize: RED stoplight blocks finalization." });
  }

  if (action.type === "SESSION_SIGNOFF") {
    if (session.state !== "AWAITING_HUMAN_SIGNOFF") errors.push({ code: "NOT_AWAITING_SIGNOFF", message: "Session must be AWAITING_HUMAN_SIGNOFF." });
  }

  if (action.type === "SESSION_FINALIZE") {
    if (session.state !== "AWAITING_HUMAN_SIGNOFF") errors.push({ code: "NOT_READY_TO_FINALIZE", message: "Session must be AWAITING_HUMAN_SIGNOFF." });
    if (!session.human_signoff.signed) errors.push({ code: "SIGNOFF_REQUIRED", message: "Cannot finalize: human signoff is required." });
    if (!allApproved) errors.push({ code: "CORE_NOT_APPROVED", message: "Cannot finalize: all core artifacts must be APPROVED." });
    if (anyRed) errors.push({ code: "STOPLIGHT_RED_BLOCKS_FINALIZE", message: "Cannot finalize: RED stoplight blocks finalization." });
  }

  return errors;
}

export function coreArtifacts(artifacts: Artifact[]): Artifact[] {
  return artifacts.filter((a) => ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"].includes(a.compiler));
}
