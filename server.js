// server.js
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Generate test files
function generateRandomData(size) {
    return crypto.randomBytes(size);
}

const testData = generateRandomData(64 * 1024 * 1024);

app.use(express.static('public'));
app.use(express.json({ limit: '64mb' }));

// Ping endpoint
app.get('/ping', (req, res) => {
    res.send('CS468/568');
});

// Download endpoint
app.get('/download/', (req, res) => {
    if (testData) {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Length': testData.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.send(testData);
    } else {
        res.status(400).send('Unknown error.');
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