const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

// In-memory scores store
let scoresList = [];

// 1. Load existing scores from local JSON file if present
if (fs.existsSync(SCORES_FILE)) {
    try {
        const fileContent = fs.readFileSync(SCORES_FILE, 'utf-8');
        scoresList = JSON.parse(fileContent);
        scoresList.sort((a, b) => b.score - a.score);
        console.log(`[Server] Loaded ${scoresList.length} scores from scores.json`);
    } catch (e) {
        console.error("[Server] Error reading scores.json. Starting empty.", e);
        scoresList = [];
    }
}

// 2. Serve static game files securely from the public folder (Prevents Directory Traversal)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Simple API endpoint to fetch raw leaderboard
app.get('/api/leaderboard', (req, res) => {
    res.json(scoresList.slice(0, 10));
});

// 4. WebSocket Event Handlers
io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);
    
    // Store run parameters to prevent cheat injections
    socket.startTime = null;

    // Immediately push current standings to client
    socket.emit('update_leaderboard', {
        standings: scoresList.slice(0, 10),
        recent: getRecentRuns()
    });

    // Client notifies server that a new run has commenced
    socket.on('start_run', () => {
        socket.startTime = Date.now();
        console.log(`[Socket] Run started for client: ${socket.id}`);
    });

    // Handle high score submissions
    socket.on('submit_score', (data) => {
        if (!data || !data.name || typeof data.score !== 'number') {
            return;
        }

        // Validate that a start_run event was previously recorded
        if (!socket.startTime) {
            console.warn(`[Security Alert] Client ${socket.id} submitted score without registering start_run!`);
            socket.emit('submission_rejected', { reason: 'Unauthorized submission flow' });
            return;
        }

        const name = data.name.trim().substring(0, 12) || 'Pilgrim';
        const score = Math.floor(data.score);
        const butter = Math.floor(data.butter || 0);

        // Security validation check: verify duration bounds
        const now = Date.now();
        const durationSeconds = (now - socket.startTime) / 1000.0;

        // Reset start time to prevent double submissions using same ticket
        socket.startTime = null;

        // Verify score is mathematically possible
        // Passive score is 15 points/sec. Pot is 100 points. Let's add a buffer for puzzle gate awards.
        const maxExpectedScore = Math.floor((durationSeconds * 22.0) + (butter * 115.0) + 1200.0);

        if (score > maxExpectedScore || durationSeconds < 1.0) {
            console.warn(`[Security Alert] Flagged cheat score from client ${socket.id}. Name: ${name}, Score: ${score}, Max Allowed: ${maxExpectedScore}, Duration: ${durationSeconds}s`);
            socket.emit('submission_rejected', { reason: 'Score integrity check failed' });
            return;
        }

        const scoreEntry = {
            name,
            score,
            butter,
            timestamp: Date.now()
        };

        console.log(`[Server] Score Accepted: ${name} -> ${score} (Duration: ${durationSeconds.toFixed(1)}s)`);

        scoresList.push(scoreEntry);
        scoresList.sort((a, b) => b.score - a.score);

        if (scoresList.length > 50) {
            scoresList = scoresList.slice(0, 50);
        }

        fs.writeFile(SCORES_FILE, JSON.stringify(scoresList, null, 2), (err) => {
            if (err) console.error("[Server] Error writing to scores.json", err);
        });

        io.emit('update_leaderboard', {
            standings: scoresList.slice(0, 10),
            recent: getRecentRuns()
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Connection dropped: ${socket.id}`);
    });
});

function getRecentRuns() {
    const sortedByTime = [...scoresList].sort((a, b) => b.timestamp - a.timestamp);
    return sortedByTime.slice(0, 5);
}

// 5. Start Server
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` LEELA: CHRONICLES OF BHARAT - EVENT RUNNER SERVER`);
    console.log(` Serve Link: http://localhost:${PORT}`);
    console.log(` Leaderboard Screen: http://localhost:${PORT}/scoreboard.html`);
    console.log(`====================================================`);
});
