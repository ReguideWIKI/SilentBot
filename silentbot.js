const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const chalk = require('chalk'); // Add chalk for colored logs

const POSITION_URL = "https://ceremony-backend.silentprotocol.org/ceremony/position";
const PING_URL = "https://ceremony-backend.silentprotocol.org/ceremony/ping";

const TELEGRAM_BOT_TOKEN = '7967235265:AAHdTKlwR0fYBt2CEEzNaUrmD3KxLavGOLM';
const TELEGRAM_CHAT_ID = '-1001787620122';
const MESSAGE_THREAD_ID = 152233; // ID của topic Testnet - Silent Protocol

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        message_thread_id: MESSAGE_THREAD_ID,
        text: message
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(chalk.red("Error sending message to Telegram:"), await response.text());
        }

        console.log(chalk.green("Message sent to Telegram successfully."));
    } catch (err) {
        console.error(chalk.red("Error sending message to Telegram:"), err);
    }
}

async function sendRequest(url, token) {
    const headers = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "authorization": `Bearer ${token}`,
        "if-none-match": 'W/"14-Y53wuE/mmbSikKcT/WualL1N65U"',
        "origin": "https://ceremony.silentprotocol.org",
        "referer": "https://ceremony.silentprotocol.org/",
        "sec-ch-ua": '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    };

    try {
        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) {
            console.error(chalk.red(`Request failed: ${response.status} ${response.statusText}`));
        }
        return await response.json();
    } catch (error) {
        console.error(chalk.red(`Request failed: ${error.message}`));
        return null;
    }
}

async function getPosition(token) {
    return await sendRequest(POSITION_URL, token);
}

async function pingServer(token) {
    return await sendRequest(PING_URL, token);
}

function loadTokens() {
    try {
        const data = fs.readFileSync('token.txt', 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        console.log(chalk.green(`Loaded ${data.length} token(s).`));
        return data;
    } catch (err) {
        console.error(chalk.red("Error: Cannot read file token.txt!"), err);
        return [];
    }
}

function workerFunction({ token, name }) {
    (async () => {
        let positionResult = await getPosition(token);
        let pingResult = await pingServer(token);

        // Retry logic if pingResult is not OK
        let retries = 3;
        while (!pingResult && retries > 0) {
            console.log(chalk.yellow(`${name} retrying...`));
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
            pingResult = await pingServer(token);
            retries--;
        }

        let message = `${name} is pinging ${pingResult ? "successfully" : "failed"} | `;
        if (pingResult) {
            message += `Behind ${positionResult.behind} users | Estimated wait time: ${positionResult.timeRemaining}`;

            if (positionResult.behind > 50 && positionResult.behind < 60) {
                await sendTelegramMessage(`${name}: Behind ${positionResult.behind} users. Estimated wait time: ${positionResult.timeRemaining}`);
            }

            if (positionResult.behind > 200 && positionResult.behind < 210) {
                await sendTelegramMessage(`${name}: Queue is long! ${positionResult.behind} users waiting.`);
            }
        } else {
            message += "Error fetching data";
        }

        parentPort.postMessage(message);
    })();
}

async function runAutomation(tokens) {
    const tokenData = tokens.map((token, index) => ({
        token,
        name: `Profile ${index + 1}:`
    }));

    while (true) {
        let messages = "";
        const promises = tokenData.map((data, index) => new Promise((resolve) => {
            const delay = Math.floor(Math.random() * 5000) + 1000; // Random delay between 1 to 5 seconds
            setTimeout(() => {
                const worker = new Worker(__filename, { workerData: data });
                worker.on('message', (message) => {
                    messages += message + '\n';
                    resolve();
                });
            }, delay);
        }));

        await Promise.all(promises);
        console.log(messages);
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

if (isMainThread) {
    async function main() {
        const tokens = loadTokens();
        if (tokens.length === 0) {
            console.log(chalk.red("No tokens found. Exiting program."));
            return;
        }
        sendTelegramMessage(`Bot updated 9/3: ${tokens.length} token(s) loaded, running...`);
        runAutomation(tokens);
    }

    main();
} else {
    workerFunction(workerData);
}
