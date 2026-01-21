export type Actor = "HUMAN" | "ASSISTANT";

export type Stoplight = "GREEN" | "YELLOW" | "RED";

export type SessionState =
  | "DRAFT"
  | "IN_COMPILATION"
  | "SEEDSWEEP_IN_PROGRESS"
  | "AWAITING_HUMAN_SIGNOFF"
  | "FINALIZED";

export type ArtifactStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type CompilerId = "INGESTION" | "SEMANTIC" | "EXECUTION" | "GOVERNANCE" | "SEEDSWEEP";

export type Action =
  | { type: "SESSION_START_COMPILATION" }
  | { type: "SESSION_TRIGGER_SEEDSWEEP"; reason: string }
  | { type: "SESSION_RESUME_AFTER_SEEDSWEEP" }
  | { type: "SESSION_REQUEST_FINALIZE" }
  | { type: "SESSION_SIGNOFF"; signerName: string; signerRole?: string }
  | { type: "SESSION_FINALIZE" }
  | { type: "ARTIFACT_SET_STATUS"; artifactId: string; status: ArtifactStatus }
  | { type: "ARTIFACT_SET_STOPLIGHT"; artifactId: string; stoplight: Stoplight };

export type EvalError = {
  code: string;
  message: string;
  path?: string;
};

export type EvalResult = {
  allowed: boolean;
  errors: EvalError[];
  newSession: unknown;
  newArtifacts: unknown;
  side_effects: string[];
};
