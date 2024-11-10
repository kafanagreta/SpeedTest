# Speed Test Web Application
This application is created by [Ekin Gündoğdu] and [Hakan Karaduman] for the first project of CS468/568 course. 

## Installation
Speed test application only requires [Node.js](https://nodejs.org/) to run. 
Install the dependencies and start the server inside a remote server.

```sh
cd speed-test
npm i
node server.js
```

or alternatively:

```sh
cd speed-test
npm install
npm run start
```

### File Structure
```sh
speed-test/
├── public/
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## Approach
In this application there are 3 different tests: Ping, Download, Upload.

### Ping Test
- Sends 5 consecutive ping requests to the server.
- Measures round-trip time for each request and displays individual ping results in milliseconds.

### Download Test
- Creates 6 simultaneous connections to maximize bandwidth usage.
- Downloads a 96MB test file from the server.
- Reports the download speed every second.
- At the end of the test, calculates the average download speed.
- The test duration is at most 15 seconds.

### Upload Test
- Generates a 64MB test file.
- Uploads the file to the server.
- Reports the upload speed every second.
- At the end of the test, calculates the average download speed.
- The test duration is at most 15 seconds.

## Usage
 Just click the `Start Test` button and see the results!

[//]: #
   [Ekin Gündoğdu]: <https://github.com/kafanagreta>
   [Hakan Karaduman]: <https://github.com/egelsia>
   [node.js]: <http://nodejs.org>
