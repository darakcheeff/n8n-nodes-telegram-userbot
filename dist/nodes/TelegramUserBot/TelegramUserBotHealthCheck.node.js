"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramUserBotHealthCheck = void 0;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
class TelegramUserBotHealthCheck {
    constructor() {
        this.description = {
            displayName: 'Telegram User Bot Health Check',
            name: 'telegramUserBotHealthCheck',
            icon: 'file:telegram.svg',
            group: ['output'],
            version: 1,
            subtitle: 'Test Connection',
            description: 'Simple health check to verify Telegram connection works',
            defaults: {
                name: 'Telegram Health Check',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'telegramUserBotApi',
                    required: true,
                },
            ],
            properties: [],
        };
    }
    async execute() {
        const startTime = Date.now();
        const steps = [];
        try {
            steps.push('Getting credentials...');
            const credentials = await this.getCredentials('telegramUserBotApi');
            const apiId = parseInt(credentials.apiId, 10);
            const apiHash = credentials.apiHash;
            const sessionString = credentials.sessionString;
            steps.push(`API ID: ${apiId}, Session length: ${sessionString?.length || 0}`);
            if (!apiId || isNaN(apiId)) {
                throw new Error('Invalid API ID');
            }
            if (!apiHash) {
                throw new Error('Missing API Hash');
            }
            if (!sessionString) {
                throw new Error('Missing Session String');
            }
            // Build proxy config if enabled
            let proxy;
            if (credentials.useProxy) {
                proxy = {
                    socksType: 5,
                    ip: credentials.proxyHost || '127.0.0.1',
                    port: parseInt(credentials.proxyPort, 10) || 1080,
                };
                if (credentials.proxyUsername) {
                    proxy.username = credentials.proxyUsername;
                }
                if (credentials.proxyPassword) {
                    proxy.password = credentials.proxyPassword;
                }
                steps.push(`Using proxy: ${proxy.ip}:${proxy.port}`);
            }
            else {
                steps.push('No proxy configured');
            }
            steps.push('Creating client...');
            const stringSession = new sessions_1.StringSession(sessionString);
            const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: 2,
                timeout: 10,
                proxy,
            });
            steps.push('Connecting...');
            // Add timeout wrapper
            const connectPromise = client.connect();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000);
            });
            await Promise.race([connectPromise, timeoutPromise]);
            steps.push(`Connected in ${Date.now() - startTime}ms`);
            steps.push('Getting user info...');
            const me = await client.getMe();
            steps.push(`Got user: ${me.firstName} (${me.id})`);
            steps.push('Disconnecting...');
            await client.disconnect();
            steps.push('Disconnected');
            const totalTime = Date.now() - startTime;
            return [[{
                        json: {
                            success: true,
                            healthy: true,
                            totalTimeMs: totalTime,
                            user: {
                                id: me.id.toString(),
                                firstName: me.firstName || null,
                                username: me.username || null,
                            },
                            proxyUsed: proxy ? `${proxy.ip}:${proxy.port}` : null,
                            steps,
                        },
                    }]];
        }
        catch (error) {
            const totalTime = Date.now() - startTime;
            const errorMessage = error.message;
            steps.push(`ERROR: ${errorMessage}`);
            return [[{
                        json: {
                            success: false,
                            healthy: false,
                            totalTimeMs: totalTime,
                            error: errorMessage,
                            steps,
                        },
                    }]];
        }
    }
}
exports.TelegramUserBotHealthCheck = TelegramUserBotHealthCheck;
//# sourceMappingURL=TelegramUserBotHealthCheck.node.js.map