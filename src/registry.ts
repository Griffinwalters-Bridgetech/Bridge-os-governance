import type { CompilerId } from "./types";

export type CompilerMode = "STANDARD" | "PRE_PARALLEL";

export type CompilerRegistryEntry = {
  id: CompilerId;
  description: string;
  mode: CompilerMode;
};

export const COMPILER_REGISTRY: CompilerRegistryEntry[] = [
  { id: "SEEDSWEEP", description: "Reset + detection + restoration (STOP → WITNESS → SWEEP → SEED → STABILIZE)", mode: "PRE_PARALLEL" },
  { id: "INGESTION", description: "Capture raw input into normalized summary and signals", mode: "STANDARD" },
  { id: "SEMANTIC", description: "Define terms, ambiguities, assumptions; preserve meaning boundaries", mode: "STANDARD" },
  { id: "EXECUTION", description: "Convert meaning into reversible steps; assign owners; track risks", mode: "STANDARD" },
  { id: "GOVERNANCE", description: "Bind rules, gates, and tests; prove determinism; forbid bypass", mode: "STANDARD" }
];
