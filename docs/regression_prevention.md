# Regression Prevention: *Leela: Chronicles of Bharat*

This document outlines the testing, code-review, and monitoring safeguards implemented to prevent the recurrence of the fixed bugs in future sprints.

---

## 1. Why Weren't These Bugs Caught?

* **BUG-001 (Shared Geometry Disposal):** Lack of WebGL lifecycle tests. Geometry buffers are difficult to mock in basic unit tests, and the deallocation crash occurred only after an entity was recycled (delayed symptom).
* **BUG-002 (Directory Exposure):** Missing directory structural reviews. prototype codes often conflate backend and frontend paths, and no static path validation step was ran before deployment planning.
* **BUG-003 (Score Injection):** Developers assumed a closed client environment (event kiosks) and did not audit public socket protocols for rate limits.
* **BUG-004 (Coordinate Lag):** Three.js's deferred world matrix update is an engine-level optimization. Its impact on frame lag was not checked under high speeds.
* **BUG-005 (Multiple Audio Contexts):** Subsystems were built modularly in isolation; there was no centralized design check for audio managers.

---

## 2. Regression Prevention Safeguards

To prevent these issues from returning, we establish the following safeguards:

### A. Automated Directory Audits
Prior to any deployment or release tagging, an automated shell script checks for file exposures:
```bash
# Verify that private server configs are not present inside the public directory
if [ -f public/server.js ] || [ -f public/scores.json ]; then
    echo "ERROR: Security boundary breach! Private files found in public static folder."
    exit 1
fi
```
This script has been integrated into the build pipeline.

### B. Standardized Resource Disposal Policy
A new code-review checklist rule dictates that **shared assets (geometries, textures) must never call `.dispose()` inside entity-level destructors**. Disposal of shared assets is strictly reserved for the class that constructed them originally (e.g., the global parent managers).

### C. Server-Side Protocol Auditing
Any new WebSocket events added in future multiplayer sprints must:
1. Implement type and range checks for all incoming JSON fields.
2. Require rate limits and duration tracking on the server.
3. Throw error events to client terminals if integrity checks fail.

### D. Single Audio Context Enforcement
No new class may call `new AudioContext()`. If a class requires audio synthesis, it must request the shared `audioCtx` instance from the parent `Game` controller in its constructor.
