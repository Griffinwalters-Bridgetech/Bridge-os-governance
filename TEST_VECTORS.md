# Test Vectors — Unified evaluate()

These are designed so "Gloves" (or Kemi) can port into Vitest/Jest later.
For now, they are manual + programmatic checkpoints.

## 1) Assistant cannot approve artifact
- Given:
  - actor = ASSISTANT
  - action = ARTIFACT_SET_STATUS { status: APPROVED }
- Then:
  - allowed = false
  - errors includes HUMAN_GATE_REQUIRED

## 2) Human can approve artifact
- Given:
  - actor = HUMAN
  - action = ARTIFACT_SET_STATUS { status: APPROVED }
- Then:
  - allowed = true

## 3) .03 required at session level
- Given:
  - session.holding_space_003 = []
  - any action
- Then:
  - allowed = false
  - errors includes SCHEMA_INVALID for holding_space_003

## 4) .03 required at artifact level
- Given:
  - any artifact.holding_space_003 = []
- Then:
  - allowed = false
  - errors includes SCHEMA_INVALID for artifact.holding_space_003

## 5) Stoplight binding (worst artifact dominates session)
- Given:
  - one core artifact stoplight = RED
- Then:
  - session.stoplight becomes RED after evaluate()

## 6) Finalize blocked without signoff
- Given:
  - session.state = AWAITING_HUMAN_SIGNOFF
  - all core artifacts APPROVED
  - session.human_signoff.signed = false
  - actor = HUMAN
  - action = SESSION_FINALIZE
- Then:
  - allowed = false
  - errors includes SIGNOFF_REQUIRED

## 7) Finalize blocked if any RED
- Given:
  - all core artifacts APPROVED
  - one core artifact stoplight = RED
  - session.human_signoff.signed = true
  - actor = HUMAN
  - action = SESSION_FINALIZE
- Then:
  - allowed = false
  - errors includes STOPLIGHT_RED_BLOCKS_FINALIZE

## 8) Happy path to FINALIZED
- Given:
  - actor = HUMAN
  - all core artifacts APPROVED
  - all core stoplights GREEN
  - session.state = AWAITING_HUMAN_SIGNOFF
  - session.human_signoff.signed = true
- When:
  - action = SESSION_FINALIZE
- Then:
  - allowed = true
  - newSession.state = FINALIZED

## 9) SeedSweep pause/resume gate
- Given:
  - action = SESSION_TRIGGER_SEEDSWEEP
- Then:
  - session.state = SEEDSWEEP_IN_PROGRESS
  - session.activeSeedSweepArtifactId is set
- And:
  - Attempt resume while SeedSweep artifact status != APPROVED
- Then:
  - allowed = false
  - errors includes SEEDSWEEP_NOT_APPROVED
