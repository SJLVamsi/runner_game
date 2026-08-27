# Security Review: *Leela: Chronicles of Bharat*

This document summarizes the security posture, vulnerabilities fixed, and validation audits for the event deployment version of the game.

---

## 1. Security Auditing Matrix

| Vulnerability Area | Severity | Risk Assessment | Mitigation Applied | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Directory Traversal** | High | P1 | Relocated static file hosting to `/public` folder, preventing access to server code/configs. | **SECURE** |
| **Score Spoofing (Cheating)** | High | P1 | Implemented server-side duration-rate checks inside `submit_score` Socket.io callback. | **SECURE** |
| **Cross-Site Scripting (XSS)** | Medium | P2 | Implemented DOM HTML sanitization escaping on the leaderboard presentation client. | **SECURE** |
| **Supply Chain Risks** | Low | P3 | Audited Node.js dependencies (`express`, `socket.io`) using `npm audit`. | **SECURE (0 Vuln)** |

---

## 2. Detailed Security Implementations

### A. Directory Sandboxing (Path Traversal Prevention)
* **Threat:** A client requesting `http://localhost:3000/server.js` or `http://localhost:3000/scores.json` could retrieve sensitive IP addresses, server port bindings, or read/modify the leaderboard flat-file database.
* **Mitigation:** The client codebase (HTML, CSS, JS, Three.js) was sandboxed inside a dedicated `/public` folder. The static serving middleware is constrained to this folder:
  `app.use(express.static(path.join(__dirname, 'public')))`
  Any request targeting paths outside `/public` returns a `404 Not Found` error.

### B. Score Injection Protection (Leaderboard Integrity)
* **Threat:** Competitors opening the browser console could emit `submit_score` socket events to artificially claim Rank 1.
* **Mitigation:**
  1. The server tracks the start of a run when the client emits `start_run`.
  2. When the score is submitted, the server computes the active elapsed duration.
  3. The server computes the maximum mathematically possible score rate for the duration:
     $$\text{Max Score} = (\text{Duration} \times 22) + (\text{Butter Collected} \times 115) + 1200$$
  4. Scores exceeding this threshold are logged, rejected, and the client receives a warning.

### C. Cross-Site Scripting (XSS) Prevention
* **Threat:** A player inputting a nickname like `<script>maliciousCode()</script>` could hijack the projected scoreboard screen.
* **Mitigation:** All names displayed on the projected leaderboard page are processed through an HTML escaping function:
  ```javascript
  function escapeHtml(str) {
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
  }
  ```
