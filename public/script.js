const TIMEOUT_MS = 15_000; // Timeout duration
const TEST_FILE_SIZE = 64;
const startButton = document.getElementById('startButton');

function updateStatus(test, status) {
    document.getElementById(`${test}Status`).textContent = status;
}

function addSpeedUpdate(type, speed, unit) {
    const list = document.getElementById(`${type}List`);
    const speedDisplay = document.getElementById(`${type}Speed`);
    const time = new Date().toLocaleTimeString();

    // Update current speed
    speedDisplay.textContent = `${speed.toFixed(2)} ${unit}`;

    // Add to history
    const newUpdate = document.createElement('div');
    newUpdate.textContent = `${time}: ${speed.toFixed(2)} ${unit}`;
    list.insertBefore(newUpdate, list.firstChild);

    // Keep only last 10 updates
    while (list.children.length > 10) {
        list.removeChild(list.lastChild);
    }
}

async function measurePing(samples = 5) {
    updateStatus('ping', 'Testing ping...');
    for (let i = 0; i < samples; i++) {
        const startTime = performance.now();
        await fetch('/ping');
        const endTime = performance.now();
        const pingTime = endTime - startTime;
        addSpeedUpdate('ping', pingTime, 'ms');
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    updateStatus('ping', 'Completed');
}

async function measureDownloadSpeed() {
    updateStatus('download', 'Testing download...');
    const startTime = performance.now();
    let receivedLength = 0;
    let lastUpdate = startTime;
    let lastBytes = 0;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch('/download/', {
            signal: controller.signal
        });
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        while(true) {
            const {done, value} = await reader.read();
            if (done) break;

            receivedLength += value.length;
            const currentTime = performance.now();
            const updateInterval = (currentTime - lastUpdate) / 1000;

            if (updateInterval >= 1) {
                const bytesPerSecond = (receivedLength - lastBytes) / updateInterval;
                const speedMbps = (bytesPerSecond * 8) / (1024 * 1024);
                addSpeedUpdate('download', speedMbps, 'Mbps');

                lastUpdate = currentTime;
                lastBytes = receivedLength;
            }

            // Check if we've exceeded the time limit
            if (performance.now() - startTime >= TIMEOUT_MS) {
                controller.abort();
                break;
            }
        }

        clearTimeout(timeoutId);
    } catch (error) {
        // Handle abortion or other errors silently
    } finally {
        const downloadTime = (performance.now() - startTime) / 1000;
        const totalMB = receivedLength / (1024 * 1024);
        document.getElementById('totalDownload').textContent =
            `Total data downloaded: ${totalMB.toFixed(2)} MB`;
        return { totalMB, downloadTime };
    }
}

// Modified measureUploadSpeed function for single file
async function measureUploadSpeed() {
    updateStatus('upload', 'Testing upload...');
    const data = new Blob([new ArrayBuffer(TEST_FILE_SIZE * 1024 * 1024)]);
    const startTime = performance.now();
    let lastUpdate = startTime;
    let lastBytes = 0;
    let uploadedBytes = 0;

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        // Set timeout for the entire upload test
        const timeoutId = setTimeout(() => {
            xhr.abort();
            finishUpload();
        }, TIMEOUT_MS);

        xhr.upload.onprogress = (event) => {
            uploadedBytes = event.loaded;
            const currentTime = performance.now();
            const updateInterval = (currentTime - lastUpdate) / 1000;

            if (updateInterval >= 1) {
                const bytesPerSecond = (event.loaded - lastBytes) / updateInterval;
                const speedMbps = (bytesPerSecond * 8) / (1024 * 1024);
                addSpeedUpdate('upload', speedMbps, 'Mbps');

                lastUpdate = currentTime;
                lastBytes = event.loaded;
            }
        };

        const finishUpload = () => {
            clearTimeout(timeoutId);
            const endTime = performance.now();
            const uploadTime = (endTime - startTime) / 1000;
            const totalMB = uploadedBytes / (1024 * 1024);
            document.getElementById('totalUpload').textContent =
                `Total data uploaded: ${totalMB.toFixed(2)} MB`;
            resolve({ totalMB, uploadTime });
        };

        xhr.onload = finishUpload;
        xhr.onerror = finishUpload;
        xhr.onabort = finishUpload;

        xhr.send(data);
    });
}

// Modified runSpeedTest function
async function runSpeedTest() {
    try {
        startButton.disabled = true;

        // Clear previous results
        ['ping', 'download', 'upload'].forEach(type => {
            document.getElementById(`${type}List`).innerHTML = '';
            document.getElementById(`${type}Speed`).textContent = '- ';
            document.getElementById(`${type}Status`).textContent = 'Not started';
        });
        document.getElementById('totalDownload').textContent = '';
        document.getElementById('totalUpload').textContent = '';
        document.getElementById('avg-download-speed').textContent = '- Mbps';
        document.getElementById('avg-upload-speed').textContent = '- Mbps';

        // Run ping test
        await measurePing(5);

        // Single download test
        const downloadResult = await measureDownloadSpeed();
        const avgDownloadSpeed = (downloadResult.totalMB * 8) / downloadResult.downloadTime;
        document.getElementById('avg-download-speed').textContent =
            `${avgDownloadSpeed.toFixed(2)} Mbps`;

        updateStatus('download', 'Completed. The last measurement:');
        // Single upload test
        const uploadResult = await measureUploadSpeed();
        const avgUploadSpeed = (uploadResult.totalMB * 8) / uploadResult.uploadTime;
        document.getElementById('avg-upload-speed').textContent =
            `${avgUploadSpeed.toFixed(2)} Mbps`;

        updateStatus('upload', 'Completed. The last measurement:');

    } finally {
        startButton.disabled = false;
    }
}
startButton.addEventListener('click', runSpeedTest);