// Import necessary modules
const express = require('express'); // Express web framework
const path = require('path');
const crypto = require('crypto'); // Used for generating random data (for testing purposes)
const app = express(); // Create an Express app

// Function to generate random data of a given size (in bytes)
function generateRandomData(size) {
    return crypto.randomBytes(size); // Generate random bytes of specified size
}

// Generate a 64MB test data file
const testData = generateRandomData(64 * 1024 * 1024);

// Serve static files from the 'public' directory ( TML, CSS, JS for frontend)
app.use(express.static('public'));
// Parse incoming JSON requests with a size limit of 64MB
app.use(express.json({ limit: '64mb' }));

// Ping endpoint: A simple GET request that returns a string response
app.get('/ping', (req, res) => {
    res.send('CS468'); // Sends a simple text response to the client
});

// Download endpoint: A GET request that sends the generated test data (64MB)
app.get('/download/', (req, res) => {
    if (testData) {
        // Set headers for the response
        res.set({
            'Content-Type': 'application/octet-stream', // Set MIME type for binary data
            'Content-Length': testData.length, // Set the length of the data
            'Cache-Control': 'no-store, no-cache, must-revalidate, private' // Disable caching
        });
        res.send(testData); // Send the test data to the client
    } else {
        res.status(400).send('Unknown error.');
    }
});

// Upload endpoint: A POST request that receives data from the client
app.post('/upload', (req, res) => {
    let receivedBytes = 0; // Initialize a variable to track the number of received bytes
    // Listen for incoming data chunks and accumulate the received bytes
    req.on('data', chunk => {
        receivedBytes += chunk.length; // Add the length of each chunk to the total received bytes
    });

    // Once all data has been received, send a response
    req.on('end', () => {
        res.json({
            received: true, // Indicate that the data was received successfully
            size: receivedBytes, // Return the total size of the received data in bytes
            timestamp: Date.now() // Return the current timestamp of when the upload ended
        });
    });
});

// Define the port the server will listen on
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
