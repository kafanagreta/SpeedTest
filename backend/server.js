const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('frontend')); // Serve static files from the 'public' directory
app.use(express.json({ limit: '50mb' })); // For large uploads, if necessary

const PORT = 3000;
app.get('/ping', (req, res) => {
    res.send('pong');
});
// Endpoint to measure download speed by serving a file of known size
app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, '..', 'assets', 'DEMO.mp4'); // Replace with actual file path
    res.sendFile(filePath);
});

// Endpoint to measure upload speed by receiving a file of known size
app.post('/upload', (req, res) => {
    const uploadStart = Date.now();
    let fileSize = 0;

    req.on('data', (chunk) => {
        fileSize += chunk.length; // Accumulate the total size of chunks received
    });

    req.on('end', () => {
        const uploadTime = Date.now() - uploadStart; // Calculate upload time
        res.json({ uploadTime, fileSize });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
