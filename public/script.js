const TIMEOUT_MS = 15_000; // Timeout duration for requests (15 seconds)
const TEST_FILE_SIZE = 64; // Size of the test file for the upload speed test (64 MB)
const startButton = document.getElementById('startButton');

// Function to update the status of a given test (ping, download, upload)
function updateStatus(test, status) {
    document.getElementById(`${test}Status`).textContent = status; // Update the status element of the specific test
}

// Function to add a speed update to the corresponding test type (ping, download, upload)
function addSpeedUpdate(type, speed, unit) {
    const list = document.getElementById(`${type}List`);
    const speedDisplay = document.getElementById(`${type}Speed`); // Get the current speed display element
    const time = new Date().toLocaleTimeString();

    // Update the current speed display
    speedDisplay.textContent = `${speed.toFixed(2)} ${unit}`;

    // Create a new element for the speed update and insert it at the top of the list
    const newUpdate = document.createElement('div');
    newUpdate.textContent = `${time}: ${speed.toFixed(2)} ${unit}`;
    list.insertBefore(newUpdate, list.firstChild);

    // Keep only the last 10 speed updates in the list
    while (list.children.length > 10) {
        list.removeChild(list.lastChild);
    }
}

// Function to measure ping by sending multiple requests (default 5 samples)
async function measurePing(samples = 5) {
    updateStatus('ping', 'Testing ping...');
    for (let i = 0; i < samples; i++) {
        const startTime = performance.now();
        await fetch('/ping'); // Send a ping request
        const endTime = performance.now();
        const pingTime = endTime - startTime; // Calculate the ping time
        addSpeedUpdate('ping', pingTime, 'ms'); // Add the ping result to the list
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for 200 ms between samples
    }
    updateStatus('ping', 'Completed');
}

// Function to measure download speed using multiple concurrent connections
async function measureDownloadSpeed(concurrentConnections = 6) {
    updateStatus('download', 'Testing download...');

    const downloadPromises = []; // Array to hold the promises for concurrent downloads
    let totalReceivedLength = 0; // Variable to track the total amount of data received
    const startTime = performance.now();
    let lastUpdate = startTime; // Record the last update time
    let lastBytes = 0; // Track the last number of bytes received for speed calculation

    // Create multiple concurrent download requests
    for (let i = 0; i < concurrentConnections; i++) {
        const controller = new AbortController(); // Create a controller to manage the fetch request
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS); // Set a timeout for the request

        // Fetch data using the AbortController and handle the download
        const fetchData = fetch('/download/', {
            signal: controller.signal // Attach the controller's signal to the fetch request
        }).then(async (response) => {
            const reader = response.body.getReader(); // Create a reader to read the response body

            // Read the data stream in chunks
            while (true) {
                const { done, value } = await reader.read(); // Read the next chunk of data
                if (done) break; // Exit the loop when the data stream is done

                totalReceivedLength += value.length; // Update the total data received
                const currentTime = performance.now(); // Record the current time
                const updateInterval = (currentTime - lastUpdate) / 1000; // Calculate the time since the last update

                // If at least 1 second has passed, calculate and display the download speed
                if (updateInterval >= 1) {
                    const bytesPerSecond = (totalReceivedLength - lastBytes) / updateInterval;
                    const speedMbps = (bytesPerSecond * 8) / (1024 * 1024); // Convert speed to Mbps
                    addSpeedUpdate('download', speedMbps, 'Mbps'); // Add the download speed to the list
                    lastUpdate = currentTime; // Update the last update time
                    lastBytes = totalReceivedLength; // Update the last number of bytes received
                }
            }

            clearTimeout(timeoutId); // Clear the timeout once the request is completed
        }).catch(() => {
            // abort silently 
        });

        downloadPromises.push(fetchData); // Add the download promise to the array
    }

    // Wait for all download requests to complete
    await Promise.all(downloadPromises);

    const downloadTime = (performance.now() - startTime) / 1000; // Calculate total download time
    const totalMB = totalReceivedLength / (1024 * 1024); // Calculate total downloaded data in MB
    document.getElementById('totalDownload').textContent =
        `Total data downloaded: ${totalMB.toFixed(2)} MB`; // Display total downloaded data

    return { totalMB, downloadTime }; // Return the total data and download time
}

// Function to measure upload speed by sending a test file to the server
async function measureUploadSpeed() {
    updateStatus('upload', 'Testing upload...');
    const data = new Blob([new ArrayBuffer(TEST_FILE_SIZE * 1024 * 1024)]); // Create a test file of the specified size
    const startTime = performance.now();
    let lastUpdate = startTime; // Record the last update time
    let lastBytes = 0; // Track the last number of bytes uploaded
    let uploadedBytes = 0; // Track the total number of bytes uploaded

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest(); // Create a new XMLHttpRequest for the upload
        xhr.open('POST', '/upload', true); // Open a POST request to the '/upload' route

        // Set timeout for the entire upload process
        const timeoutId = setTimeout(() => {
            xhr.abort(); // Abort the upload if it times out
            finishUpload();
        }, TIMEOUT_MS);

        // Event listener for progress updates during the upload
        xhr.upload.onprogress = (event) => {
            uploadedBytes = event.loaded; // Get the number of bytes uploaded so far
            const currentTime = performance.now(); // Record the current time
            const updateInterval = (currentTime - lastUpdate) / 1000; // Calculate the time since the last update

            // If at least 1 second has passed, calculate and display the upload speed
            if (updateInterval >= 1) {
                const bytesPerSecond = (event.loaded - lastBytes) / updateInterval;
                const speedMbps = (bytesPerSecond * 8) / (1024 * 1024); // Convert speed to Mbps
                addSpeedUpdate('upload', speedMbps, 'Mbps'); // Add the upload speed to the list

                lastUpdate = currentTime; // Update the last update time
                lastBytes = event.loaded; // Update the last number of bytes uploaded
            }
        };

        // Finish the upload process and calculate the total upload time
        const finishUpload = () => {
            clearTimeout(timeoutId); // Clear the timeout
            const endTime = performance.now();
            const uploadTime = (endTime - startTime) / 1000; // Calculate the total upload time
            const totalMB = uploadedBytes / (1024 * 1024); // Calculate total uploaded data in MB
            document.getElementById('totalUpload').textContent =
                `Total data uploaded: ${totalMB.toFixed(2)} MB`;
            resolve({ totalMB, uploadTime }); // Return the total data and upload time
        };

        xhr.onload = finishUpload; // Handle the onload event when the upload is complete
        xhr.onerror = finishUpload; // Handle any error during the upload
        xhr.onabort = finishUpload; // Handle abort during the upload

        xhr.send(data); // Send the test file
    });
}

// Function to run the speed test
async function runSpeedTest() {
    try {
        startButton.disabled = true;

        // Clear previous results from the UI
        ['ping', 'download', 'upload'].forEach(type => {
            document.getElementById(`${type}List`).innerHTML = ''; // Clear the speed update list
            document.getElementById(`${type}Speed`).textContent = '- '; // Reset the current speed display
            document.getElementById(`${type}Status`).textContent = 'Not started'; // Reset the status
        });
        document.getElementById('totalDownload').textContent = ''; // Reset total download display
        document.getElementById('totalUpload').textContent = ''; // Reset total upload display
        document.getElementById('avg-download-speed').textContent = '- Mbps'; // Reset average download speed display
        document.getElementById('avg-upload-speed').textContent = '- Mbps'; // Reset average upload speed display

        // Run ping test
        await measurePing(5);

        // Run download test with multiple connections (6 by default)
        const downloadResult = await measureDownloadSpeed(6);
        const avgDownloadSpeed = (downloadResult.totalMB * 8) / downloadResult.downloadTime; // Calculate average download speed
        document.getElementById('avg-download-speed').textContent =
            `${avgDownloadSpeed.toFixed(2)} Mbps`; // Display the average download speed

        updateStatus('download', 'Completed. The last measurement:');


        const uploadResult = await measureUploadSpeed();
        const avgUploadSpeed = (uploadResult.totalMB * 8) / uploadResult.uploadTime; // Calculate average upload speed
        document.getElementById('avg-upload-speed').textContent =
            `${avgUploadSpeed.toFixed(2)} Mbps`; // Display the average upload speed

        updateStatus('upload', 'Completed. The last measurement:'); // Update the status for upload

    } finally {
        startButton.disabled = false;
    }
}

// Add event listener to the start button to run the speed test when clicked
startButton.addEventListener('click', runSpeedTest);
