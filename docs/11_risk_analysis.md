# Risk Analysis: *Leela: Chronicles of Bharat*

This document identifies operational, technical, and logistics risks associated with executing the game as an interactive installation at a live event, alongside mitigation strategies.

---

## 1. Key Project Risks & Mitigation Matrix

### A. Venue Wi-Fi / Cellular Network Congestion
* **Risk:** Live events have high densities of mobile devices, often leading to saturated local cellular networks and slow public Wi-Fi. Visitors scanning the QR code might experience timed-out downloads.
* **Impact:** Critical (Game fails to load, zero player participation).
* **Mitigation Strategy:**
  1. **Ultra-Lightweight Bundle:** Maintain a strict limit of under 10MB for the core game files, including models and textures.
  2. **Local Static Server:** Host the game files on a local physical server unit at the booth (e.g., a Raspberry Pi acting as a local Wi-Fi hotspot access point). Visitors connect directly to "Leela_WiFi" and load the game locally, bypassing external internet networks completely.
  3. **Draco Compression & Audio Compression:** Compress all mesh files and convert audio tracks to highly compressed mono MP3 formats.

### B. Mobile Browser Compatibility on Guest Devices
* **Risk:** Visitors use a wide variety of mobile devices, ranging from old Android models with outdated browsers to high-end iPhones. The Three.js WebGL canvas might fail to render on older GPUs or crash Safari/Chrome.
* **Impact:** High (Excludes visitors with older devices).
* **Mitigation Strategy:**
  1. **Polyfills & WebGL Detection:** Include a script that detects WebGL capability before loading. If WebGL is not supported, automatically serve a lightweight 2D HTML5 fallback runner.
  2. **Low-spec Graphics Setting:** Implement a "Graphics: Low" toggle on the main menu that disables post-processing shadows, simplifies lighting to a simple ambient model, and halves texture sizes.
  3. **On-Site Kiosks:** Provide dedicated physical desktop Kiosks equipped with verified web browsers, ensuring all visitors can play regardless of their smartphone's capabilities.

### C. Live Leaderboard System Sync Failures
* **Risk:** The local WebSocket server at the venue might drop connections under heavy spikes, causing players' scores to fail to display on the projected scoreboard screen.
* **Impact:** Medium (Reduces competitive excitement).
* **Mitigation Strategy:**
  1. **Local Storage Retry Logic:** If the WebSocket server is unreachable, the client saves the score in the browser's local storage (`localStorage`). Once connection is re-established, the client automatically pushes the pending scores.
  2. **Robust Node.js Design:** Use a clean, asynchronous Node.js script optimized for high connections, paired with Redis caching for speed.

### D. Kiosk Hardware Failure / Public Misuse
* **Risk:** Dedicated PC kiosks run continuously during the event. Players might accidentally exit the game window, crash the browser, or damage the controllers.
* **Impact:** Medium (Kiosks become inactive).
* **Mitigation Strategy:**
  1. **Kiosk Mode Software:** Run the browser in absolute Fullscreen Kiosk Mode (e.g., via Google Chrome `--kiosk` startup flag) and lock down the OS desktop using kiosk restriction policies.
  2. **Heavy-duty Arcade Hardware:** Use rugged, industrial-grade USB arcade controllers that can withstand continuous, heavy physical play.
  3. **Auto-Reset Idle timer:** If no input is detected for 60 seconds, the game automatically resets to the main menu and clears the current run.
