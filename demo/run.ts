import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust this import path to match your project structure
import { evaluate } from "../src/evaluate.js";

const FIXTURES = path.join(__dirname, "fixtures");
const OUTPUT = path.join(__dirname, "output");

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT)) {
  fs.mkdirSync(OUTPUT, { recursive: true });
}

// Load initial state
let session = JSON.parse(
  fs.readFileSync(path.join(FIXTURES, "session.json"), "utf8")
);
let artifacts = JSON.parse(
  fs.readFileSync(path.join(FIXTURES, "artifacts.json"), "utf8")
);

// Open transcript stream
const transcript = fs.createWriteStream(
  path.join(OUTPUT, "transcript.jsonl"),
  { flags: "w" }
);

// Timeline collector
const timeline: string[] = [];
timeline.push("# Bridge PIA Locktight Demo Timeline");
timeline.push("");
timeline.push(`Started: ${new Date().toISOString()}`);
timeline.push("");

let stepNumber = 0;

function step(
  label: string,
  actor: "HUMAN" | "ASSISTANT",
  action: any,
  expectAllowed: boolean,
  expectedErrorCode?: string
) {
  stepNumber++;
  
  console.log(`\n--- Step ${stepNumber}: ${label} ---`);
  console.log(`Actor: ${actor}`);
  console.log(`Action: ${action.type}`);
  
  // Call evaluate with separate arguments (matching your function signature)
  const result = evaluate(session, artifacts, action, actor);

  // Write to transcript
  transcript.write(
    JSON.stringify({
      step: stepNumber,
      label,
      actor,
      action,
      result: {
        allowed: result.allowed,
        errors: result.errors,
        sessionState: result.newSession.state,
        sessionStoplight: result.newSession.stoplight
      }
    }) + "\n"
  );

  // Check expected outcome
  if (result.allowed !== expectAllowed) {
    const errMsg = `❌ Step ${stepNumber} FAILED: ${label}\n` +
      `   Expected allowed=${expectAllowed}, got ${result.allowed}\n` +
      `   Errors: ${JSON.stringify(result.errors)}`;
    console.error(errMsg);
    timeline.push(`❌ Step ${stepNumber}: ${label} - FAILED (expected ${expectAllowed ? "ALLOWED" : "BLOCKED"})`);
    throw new Error(errMsg);
  }

  // Check expected error code if specified
  if (expectedErrorCode && !result.allowed) {
    const hasExpectedError = result.errors.some((e: any) => e.code === expectedErrorCode);
    if (!hasExpectedError) {
      const errMsg = `❌ Step ${stepNumber} FAILED: ${label}\n` +
        `   Expected error code: ${expectedErrorCode}\n` +
        `   Got: ${result.errors.map((e: any) => e.code).join(", ")}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
    console.log(`✓ Correctly blocked with: ${expectedErrorCode}`);
  }

  // Update state for next step
  session = result.newSession;
  artifacts = result.newArtifacts;

  // Log success
  const status = result.allowed ? "✅ ALLOWED" : "🛑 BLOCKED";
  console.log(`${status} | State: ${session.state} | Stoplight: ${session.stoplight}`);
  
  timeline.push(
    `${status} Step ${stepNumber}: ${label}` +
    ` | state=${session.state} | stoplight=${session.stoplight}`
  );

  return result;
}

// ============================================
// THE LOCKTIGHT DEMO SEQUENCE
// ============================================

try {
  console.log("\n🔒 BRIDGE PIA LOCKTIGHT DEMO");
  console.log("============================\n");
  console.log("This demo proves deterministic governance enforcement.");
  console.log("Each step either passes or the demo fails fast.\n");

  // --- SEEDSWEEP PREFLIGHT ---
  
  step(
    "Attempt compilation before SeedSweep approved (should BLOCK)",
    "HUMAN",
    { type: "SESSION_START_COMPILATION" },
    false,
    "SEEDSWEEP_PREFLIGHT_REQUIRED"
  );

  step(
    "Assistant attempts to approve SeedSweep (should BLOCK - human gate)",
    "ASSISTANT",
    { type: "ARTIFACT_SET_STATUS", artifactId: "seedsweep", status: "APPROVED" },
    false,
    "HUMAN_GATE_REQUIRED"
  );

  step(
    "Human approves SeedSweep",
    "HUMAN",
    { type: "ARTIFACT_SET_STATUS", artifactId: "seedsweep", status: "APPROVED" },
    true
  );

  step(
    "Attempt compilation with SeedSweep YELLOW (should BLOCK)",
    "HUMAN",
    { type: "SESSION_START_COMPILATION" },
    false,
    "SEEDSWEEP_NOT_GREEN"
  );

  step(
    "Human sets SeedSweep stoplight to GREEN",
    "HUMAN",
    { type: "ARTIFACT_SET_STOPLIGHT", artifactId: "seedsweep", stoplight: "GREEN" },
    true
  );

  step(
    "Start compilation (now allowed)",
    "HUMAN",
    { type: "SESSION_START_COMPILATION" },
    true
  );

  // --- CORE ARTIFACT APPROVALS ---

  step(
    "Assistant attempts to approve Ingestion (should BLOCK - human gate)",
    "ASSISTANT",
    { type: "ARTIFACT_SET_STATUS", artifactId: "ingestion", status: "APPROVED" },
    false,
    "HUMAN_GATE_REQUIRED"
  );

  step(
    "Human approves Ingestion",
    "HUMAN",
    { type: "ARTIFACT_SET_STATUS", artifactId: "ingestion", status: "APPROVED" },
    true
  );

  step(
    "Human approves Semantic",
    "HUMAN",
    { type: "ARTIFACT_SET_STATUS", artifactId: "semantic", status: "APPROVED" },
    true
  );

  step(
    "Human approves Execution",
    "HUMAN",
    { type: "ARTIFACT_SET_STATUS", artifactId: "execution", status: "APPROVED" },
    true
  );

  step(
    "Human approves Governance",
    "HUMAN",
    { type: "ARTIFACT_SET_STATUS", artifactId: "governance", status: "APPROVED" },
    true
  );

  // --- FINALIZATION ---

  step(
    "Request finalize (all core approved)",
    "HUMAN",
    { type: "SESSION_REQUEST_FINALIZE" },
    true
  );

  step(
    "Assistant attempts signoff (should BLOCK - human gate)",
    "ASSISTANT",
    { type: "SESSION_SIGNOFF", signedBy: "AI", signedRole: "ASSISTANT" },
    false,
    "HUMAN_GATE_REQUIRED"
  );

  step(
    "Human signoff",
    "HUMAN",
    { type: "SESSION_SIGNOFF", signedBy: "Griffin", signedRole: "Father" },
    true
  );

  step(
    "Assistant attempts finalize (should BLOCK - human gate)",
    "ASSISTANT",
    { type: "SESSION_FINALIZE" },
    false,
    "HUMAN_GATE_REQUIRED"
  );

  step(
    "Human finalize",
    "HUMAN",
    { type: "SESSION_FINALIZE" },
    true
  );

  // --- COMPLETION ---

  timeline.push("");
  timeline.push(`Completed: ${new Date().toISOString()}`);
  timeline.push("");
  timeline.push("## Summary");
  timeline.push("");
  timeline.push(`Total steps: ${stepNumber}`);
  timeline.push(`Final state: ${session.state}`);
  timeline.push(`Final stoplight: ${session.stoplight}`);
  timeline.push("");
  timeline.push("**All gates held. The .03 is infrastructure.**");

  // Write timeline
  fs.writeFileSync(path.join(OUTPUT, "timeline.md"), timeline.join("\n"));

  // Close transcript
  transcript.end();

  console.log("\n============================");
  console.log("✅ DEMO COMPLETED SUCCESSFULLY");
  console.log("============================\n");
  console.log(`Final state: ${session.state}`);
  console.log(`Final stoplight: ${session.stoplight}`);
  console.log(`\nOutputs written to: ${OUTPUT}/`);
  console.log("  - transcript.jsonl (full audit log)");
  console.log("  - timeline.md (human-readable summary)");
  console.log("\nThe governance engine is real. The gates hold.");

} catch (err) {
  // Write partial timeline on failure
  timeline.push("");
  timeline.push("## DEMO FAILED");
  timeline.push("");
  timeline.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
  fs.writeFileSync(path.join(OUTPUT, "timeline.md"), timeline.join("\n"));
  transcript.end();
  
  console.error("\n❌ DEMO FAILED - See error above");
  process.exit(1);
}