# Test Vectors — SeedSweep Policy Gates

## 1) Preflight blocks compilation without SeedSweep

- Given:
  - session.state = DRAFT
  - no SEEDSWEEP artifact exists (or none APPROVED)
  - action = SESSION_START_COMPILATION
- Then:
  - allowed = false
  - errors includes SEEDSWEEP_PREFLIGHT_REQUIRED

## 2) Preflight blocks compilation with YELLOW SeedSweep

- Given:
  - session.state = DRAFT
  - SEEDSWEEP artifact exists with status = APPROVED but stoplight = YELLOW
  - action = SESSION_START_COMPILATION
- Then:
  - allowed = false
  - errors includes SEEDSWEEP_NOT_GREEN

## 3) Preflight allows compilation with GREEN APPROVED SeedSweep

- Given:
  - session.state = DRAFT
  - SEEDSWEEP artifact exists with status = APPROVED and stoplight = GREEN
  - action = SESSION_START_COMPILATION
- Then:
  - allowed = true

## 4) Resume blocks without active SeedSweep ID

- Given:
  - session.state = SEEDSWEEP_IN_PROGRESS
  - session.activeSeedSweepArtifactId = undefined
  - action = SESSION_RESUME_AFTER_SEEDSWEEP
- Then:
  - allowed = false
  - errors includes NO_ACTIVE_SEEDSWEEP

## 5) Resume blocks with unapproved SeedSweep

- Given:
  - session.state = SEEDSWEEP_IN_PROGRESS
  - session.activeSeedSweepArtifactId = "ss_001"
  - artifact "ss_001" exists with status = IN_REVIEW
  - action = SESSION_RESUME_AFTER_SEEDSWEEP
- Then:
  - allowed = false
  - errors includes SEEDSWEEP_NOT_APPROVED

## 6) Resume allows with GREEN APPROVED SeedSweep

- Given:
  - session.state = SEEDSWEEP_IN_PROGRESS
  - session.activeSeedSweepArtifactId = "ss_001"
  - artifact "ss_001" exists with status = APPROVED and stoplight = GREEN
  - action = SESSION_RESUME_AFTER_SEEDSWEEP
- Then:
  - allowed = true
