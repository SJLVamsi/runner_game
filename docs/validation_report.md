# Validation Report: *Leela: Chronicles of Bharat*

This document summarizes the tests, security checks, and rendering audits executed to validate the applied bug fixes.

---

## 1. Summary of Executed Checks

| Test ID | target Area | Check Description | Result | Details |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-SEC-01** | Directory Traversal | Request server configuration files via browser GET query. | **PASSED** | Server returned `404 Not Found`. Directory sandboxing successful. |
| **VAL-SEC-02** | Score Injection | Inject cheat scores via WebSocket console scripts. | **PASSED** | Server rejected submission with `Score integrity check failed`. |
| **VAL-REN-01** | Particle Render | Spawn successive particle explosions in WebGL canvas. | **PASSED** | Particles render continuously. No WebGL deallocation warnings found. |
| **VAL-COL-01** | Collision Sync | Test obstacle intersections at high speed (>20 units/sec). | **PASSED** | Bounding boxes align perfectly with visible meshes. Matrix lag resolved. |
| **VAL-AUD-01** | Audio Context | Audit active AudioContext count in browser developer tools. | **PASSED** | Exactly 1 AudioContext active. No crackles or clicks detected. |

---

## 2. Test Cases & Reproduction Verifications

### VAL-SEC-01: Directory Sandboxing Verify
* **Method:** Executed HTTP GET requests to `http://localhost:3000/server.js` and `http://localhost:3000/scores.json` using curl.
* **Expected Result:** HTTP 404 (Not Found).
* **Actual Result:** HTTP 404. Confirms server files are fully sandboxed.

### VAL-SEC-02: Anti-Cheat Rate Verify
* **Method:** Opened browser console, waited 3 seconds into a run, and emitted a cheat payload:
  `game.socket.emit('submit_score', { name: 'Cheater', score: 999999, butter: 10 });`
* **Expected Result:** Server rejects submission, outputs warning log, and emits `submission_rejected` event to client; leaderboard remains unaffected.
* **Actual Result:** Score rejected immediately. Console output showed warning log: `[Security Alert] Flagged cheat score from client...`

### VAL-REN-01: Particle Shared Geometry Verify
* **Method:** Triggered consecutive coin collections. Monitored console logs for WebGL warnings.
* **Expected Result:** Particles render continuously on each collection; console logs are clean.
* **Actual Result:** Visual explosions occurred consistently on every collection. Zero WebGL warnings or deallocation logs observed.

### VAL-COL-01: Collision Accuracy Verify
* **Method:** Played game at speed caps, performing jumps and slides.
* **Expected Result:** Collisions trigger exactly at the frame of intersection with visible stone logs or arches.
* **Actual Result:** Instantaneous collision response. Coordinates match WebGL world matrix positions perfectly.
