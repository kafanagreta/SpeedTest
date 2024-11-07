// server.js
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Generate test files
function generateRandomData(size) {
    return crypto.randomBytes(size);
}

const testFiles = {
    small: generateRandomData(2 * 1024 * 1024),    // 2MB
    medium: generateRandomData(8 * 1024 * 1024),   // 4MB
    large: generateRandomData(16 * 1024 * 1024),   // 8MB
    xlarge: generateRandomData(32 * 1024 * 1024),   // 32MB
    xtralarge: generateRandomData(64 * 1024 * 1024)   // 64MB
};

app.use(express.static('public'));
app.use(express.json({ limit: '100mb' }));

// Ping endpoint
app.get('/ping', (req, res) => {
    res.send('pong');
});

// Download endpoint
app.get('/download/:size', (req, res) => {
    const size = req.params.size;
    if (testFiles[size]) {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': testFiles[size].length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.send(testFiles[size]);
    } else {
        res.status(400).send('Invalid size');
    }
});

// Upload endpoint
app.post('/upload', (req, res) => {
    let receivedBytes = 0;
    req.on('data', chunk => {
        receivedBytes += chunk.length;
    });

    req.on('end', () => {
        res.json({
            received: true,
            size: receivedBytes,
            timestamp: Date.now()
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});