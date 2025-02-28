const axios = require('axios');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const POSITION_URL = "https://ceremony-backend.silentprotocol.org/ceremony/position";
const PING_URL = "https://ceremony-backend.silentprotocol.org/ceremony/ping";

function loadTokens() {
    try {
        const data = fs.readFileSync('token.txt', 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        console.log(chalk.green(`== Loading ${data.length} token(s).`));
        return data;
    } catch (err) {
        console.error(chalk.red("Error: Cannot read file token.txt!", err));
        return [];
    }
}

function loadProxies() {
    try {
        const data = fs.readFileSync('proxy.txt', 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const [ip, port, username, password] = line.split(':');
                return `http://${username}:${password}@${ip}:${port}`;
            });
        console.log(chalk.green(`== Loading ${data.length} proxy(s).`));
        return data;
    } catch (err) {
        console.warn(chalk.yellow("Error: Cannot read file proxy.txt, will run with local internet."));
        return [];
    }
}

function loadUserAgents() {
    try {
        const data = fs.readFileSync('useragent.txt', 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
        console.log(chalk.green(`== Loading ${data.length} user-agent(s).`));
        return data;
    } catch (err) {
        console.error(chalk.red("Error: Cannot read file useragent.txt!", err));
        return [];
    }
}

function getHeaders(token, userAgent) {
    return {
        "Authorization": `Bearer ${token}`,
        "Accept": "*/*",
        "User-Agent": userAgent
    };
}

async function getPosition(token, proxy, userAgent) {
    try {
        const options = { headers: getHeaders(token, userAgent) };
        if (proxy) options.httpsAgent = new HttpsProxyAgent(proxy);

        const response = await axios.get(POSITION_URL, options);
        return {
            success: true,
            behind: response.data.behind,
            timeRemaining: response.data.timeRemaining
        };
    } catch (err) {
        return {
            success: false,
            error: err.response?.status || err.message
        };
    }
}

async function pingServer(token, proxy, userAgent) {
    try {
        const options = { headers: getHeaders(token, userAgent) };
        if (proxy) options.httpsAgent = new HttpsProxyAgent(proxy);

        await axios.get(PING_URL, options);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.response?.status || err.message };
    }
}

function logMessages(messages) {
    const chunks = messages.match(/[\s\S]{1,4000}/g);
    for (const chunk of chunks) {
        console.log(chunk);
    }
}

function workerFunction({ token, proxy, userAgent, name }) {
    (async () => {
        const positionResult = await getPosition(token, proxy, userAgent);
        const pingResult = await pingServer(token, proxy, userAgent);

        let message = `${name} | PING ${pingResult.success ? "Thành công" : "Thất bại"} | `;
        if (positionResult.success) {
            message += `${positionResult.behind} | ${positionResult.timeRemaining}\n`;
        } else {
            message += `Lỗi: ${positionResult.error}\n`;
        }

        parentPort.postMessage(message);
    })();
}

async function runAutomation(tokens, proxies, userAgents) {
    const tokenData = tokens.map((token, index) => ({
        token,
        name: `Account ${index + 1}`,
        proxy: proxies[index] || null,
        userAgent: userAgents[index] || "Mozilla/5.0"
    }));

    while (true) {
        let messages = "";
        const promises = tokenData.map(data => new Promise((resolve) => {
            const worker = new Worker(__filename, {
                workerData: data
            });
            worker.on('message', (message) => {
                messages += message;
                resolve();
            });
        }));

        await Promise.all(promises);
        logMessages(messages);

        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

if (isMainThread) {
    async function main() {
        const tokens = loadTokens();
        const proxies = loadProxies();
        const userAgents = loadUserAgents();

        if (tokens.length === 0) {
            console.log(chalk.red("🚫 Không có token nào. Thoát chương trình."));
            return;
        }

        if (proxies.length < tokens.length) {
            console.warn(chalk.yellow("⚠️ Số lượng proxy ít hơn số token. Một số token sẽ không dùng proxy."));
        }

        if (userAgents.length < tokens.length) {
            console.warn(chalk.yellow("⚠️ Số lượng user-agent ít hơn số token. Một số token sẽ dùng user-agent mặc định."));
        }

        runAutomation(tokens, proxies, userAgents);
    }

    main();
} else {
    workerFunction(workerData);
}
