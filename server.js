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
        // Sort descending by score
        scoresList.sort((a, b) => b.score - a.score);
        console.log(`[Server] Loaded ${scoresList.length} scores from scores.json`);
    } catch (e) {
        console.error("[Server] Error reading scores.json. Starting empty.", e);
        scoresList = [];
    }
}

// 2. Serve static game files directly from the project directory
app.use(express.static(__dirname));

// 3. Simple API endpoint to fetch raw leaderboard
app.get('/api/leaderboard', (req, res) => {
    res.json(scoresList.slice(0, 10));
});

// 4. WebSocket Event Handlers
io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);

    // Immediately push current top 10 rankings to the connected client
    socket.emit('update_leaderboard', {
        standings: scoresList.slice(0, 10),
        recent: getRecentRuns()
    });

    // Handle high score submissions
    socket.on('submit_score', (data) => {
        if (!data || !data.name || typeof data.score !== 'number') {
            return;
        }

        const name = data.name.trim().substring(0, 12) || 'Pilgrim';
        const score = Math.floor(data.score);
        const butter = Math.floor(data.butter || 0);

        const scoreEntry = {
            name,
            score,
            butter,
            timestamp: Date.now()
        };

        console.log(`[Server] Score Submitted: ${name} -> ${score} (Makhan: ${butter})`);

        // Insert score
        scoresList.push(scoreEntry);
        
        // Sort descending
        scoresList.sort((a, b) => b.score - a.score);

        // Cap list size to top 50 records to save disk space
        if (scoresList.length > 50) {
            scoresList = scoresList.slice(0, 50);
        }

        // Persist records to file
        fs.writeFile(SCORES_FILE, JSON.stringify(scoresList, null, 2), (err) => {
            if (err) console.error("[Server] Error writing to scores.json", err);
        });

        // Broadcast updated standings to all connected screens/clients
        io.emit('update_leaderboard', {
            standings: scoresList.slice(0, 10),
            recent: getRecentRuns()
        });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Connection dropped: ${socket.id}`);
    });
});

/**
 * Grabs the last 5 runs sorted by recency to show in the marquee.
 */
function getRecentRuns() {
    // Sort by timestamp descending
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
