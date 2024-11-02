const backendUrl = 'http://localhost:3000';

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('status').innerText = 'Testing...';
    document.getElementById('results').style.display = 'none';

    // Start with measuring ping
    measurePing()
        .then(() => measureDownloadSpeed())
        .then(() => measureUploadSpeed())
        .catch(err => console.error('Error during speed test:', err));
});

async function measurePing() {
    const startTime = Date.now();
    await fetch(`${backendUrl}/ping`);
    const ping = Date.now() - startTime;
    document.getElementById('pingResult').innerText = `Ping: ${ping} ms`;
    return ping;
}

async function measureDownloadSpeed() {

    const downloadStart = Date.now();
    const response = await fetch(`${backendUrl}/download`);
    const blob = await response.blob(); // Downloaded file as blob

    const downloadTime = Date.now() - downloadStart;
    const fileSizeInMB = blob.size / (1024 * 1024); // Convert bytes to MB
    const downloadSpeed = (fileSizeInMB / (downloadTime / 1000)).toFixed(2); // Mbps

    document.getElementById('downloadResult').innerText = `Download Speed: ${downloadSpeed} Mbps`;
    document.getElementById('dataUsage').innerText = `Data Used: ${fileSizeInMB.toFixed(2)} MB`;
    return downloadSpeed;
}

async function measureUploadSpeed() {
    const fileSizeInMB = 5; // Size of the file to upload, in MB
    const testFile = new Blob([new Uint8Array(fileSizeInMB * 1024 * 1024)]); // Generate a 5MB file

    const uploadStart = Date.now();
    const response = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': testFile.size,
        },
        body: testFile,
    });

    if (!response.ok) {
        console.error('Upload failed:', response.statusText);
        return; // Exit if the upload fails
    }

    const { uploadTime } = await response.json();

    // Calculate elapsed upload time
    const uploadEnd = Date.now();
    const elapsedTime = uploadEnd - uploadStart; // in milliseconds

    // Ensure uploadTime is correctly calculated
    let uploadSpeed = 0;

    if (elapsedTime > 0) {
        // Calculate upload speed in Mbps
        uploadSpeed = (fileSizeInMB / (elapsedTime / 1000)).toFixed(2); // Correct conversion to seconds
        document.getElementById('uploadResult').innerText = `Upload Speed: ${uploadSpeed} Mbps`;
    } else {
        console.error('Upload time is too short or zero');
        document.getElementById('uploadResult').innerText = 'Upload Speed: Error calculating speed';
    }

    // Make sure to display results regardless of success
    document.getElementById('results').style.display = 'block';
    document.getElementById('status').innerText = 'Test completed!';

    return uploadSpeed; // Return uploadSpeed
}
