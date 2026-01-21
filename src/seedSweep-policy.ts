import type { Session } from "../session";
import type { Artifact } from "../artifacts";
import type { Action, EvalError } from "../types";

export type SeedSweepPolicyResult = {
  allowed: boolean;
  errors: EvalError[];
};

function findApprovedSeedSweep(artifacts: Artifact[]): Artifact | undefined {
  return artifacts.find(a => a.compiler === "SEEDSWEEP" && a.status === "APPROVED");
}

export function seedSweepPreflightGate(
  session: Session,
  artifacts: Artifact[],
  action: Action
): SeedSweepPolicyResult {
  if (action.type !== "SESSION_START_COMPILATION") {
    return { allowed: true, errors: [] };
  }

  if (session.state !== "DRAFT") {
    return { allowed: true, errors: [] };
  }

  const approved = findApprovedSeedSweep(artifacts);
  if (!approved) {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_PREFLIGHT_REQUIRED",
        message: "Cannot start compilation: an APPROVED SeedSweep artifact is required as preflight."
      }]
    };
  }

  if (approved.stoplight !== "GREEN") {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_NOT_GREEN",
        message: `Cannot start compilation: SeedSweep artifact must be GREEN, currently ${approved.stoplight}.`
      }]
    };
  }

  return { allowed: true, errors: [] };
}

export function seedSweepResumeGate(
  session: Session,
  artifacts: Artifact[],
  action: Action
): SeedSweepPolicyResult {
  if (action.type !== "SESSION_RESUME_AFTER_SEEDSWEEP") {
    return { allowed: true, errors: [] };
  }

  if (!session.activeSeedSweepArtifactId) {
    return {
      allowed: false,
      errors: [{
        code: "NO_ACTIVE_SEEDSWEEP",
        message: "Cannot resume: no active SeedSweep artifact is linked to session."
      }]
    };
  }

  const active = artifacts.find(a => a.id === session.activeSeedSweepArtifactId);
  if (!active) {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_ARTIFACT_MISSING",
        message: `Cannot resume: active SeedSweep artifact ${session.activeSeedSweepArtifactId} not found.`
      }]
    };
  }

  if (active.compiler !== "SEEDSWEEP") {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_WRONG_COMPILER",
        message: "Cannot resume: linked artifact is not a SEEDSWEEP compiler artifact."
      }]
    };
  }

  if (active.status !== "APPROVED") {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_NOT_APPROVED",
        message: `Cannot resume: SeedSweep artifact must be APPROVED, currently ${active.status}.`
      }]
    };
  }

  if (active.stoplight !== "GREEN") {
    return {
      allowed: false,
      errors: [{
        code: "SEEDSWEEP_NOT_GREEN",
        message: `Cannot resume: SeedSweep artifact must be GREEN, currently ${active.stoplight}.`
      }]
    };
  }

  return { allowed: true, errors: [] };
}

export function applySeedSweepPolicyGate(
  session: Session,
  artifacts: Artifact[],
  action: Action
): SeedSweepPolicyResult {
  const preflight = seedSweepPreflightGate(session, artifacts, action);
  if (!preflight.allowed) return preflight;

  const resume = seedSweepResumeGate(session, artifacts, action);
  if (!resume.allowed) return resume;

  return { allowed: true, errors: [] };
}
