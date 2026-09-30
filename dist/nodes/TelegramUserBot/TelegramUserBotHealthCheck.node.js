"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramUserBotHealthCheck = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
class TelegramUserBotHealthCheck {
    constructor() {
        this.description = {
            displayName: 'Telegram User Bot Health Check',
            name: 'telegramUserBotHealthCheck',
            icon: 'file:telegram.svg',
            group: ['transform'],
            version: 1,
            description: 'Check if the Telegram User Bot session is valid and connected',
            defaults: {
                name: 'Telegram User Bot Health Check',
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
        var _a;
        const credentials = await this.getCredentials('telegramUserBotApi');
        const apiId = parseInt(credentials.apiId, 10);
        const apiHash = credentials.apiHash;
        const sessionString = credentials.sessionString;
        let proxy;
        if (credentials.useProxy) {
            proxy = {
                socksType: 5,
                ip: credentials.proxyHost || '127.0.0.1',
                port: parseInt(credentials.proxyPort, 10) || 1080,
            };
            if (credentials.proxyUsername)
                proxy.username = credentials.proxyUsername;
            if (credentials.proxyPassword)
                proxy.password = credentials.proxyPassword;
        }
        const stringSession = new sessions_1.StringSession(sessionString);
        const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 3,
            proxy,
            timeout: 15,
        });
        try {
            await client.connect();
            const me = await client.getMe();
            await client.disconnect();
            return [
                [
                    {
                        json: {
                            connected: true,
                            userId: (_a = me === null || me === void 0 ? void 0 : me.id) === null || _a === void 0 ? void 0 : _a.toString(),
                            firstName: (me === null || me === void 0 ? void 0 : me.firstName) || '',
                            lastName: (me === null || me === void 0 ? void 0 : me.lastName) || '',
                            username: (me === null || me === void 0 ? void 0 : me.username) || '',
                            phone: (me === null || me === void 0 ? void 0 : me.phone) || '',
                        },
                    },
                ],
            ];
        }
        catch (error) {
            try {
                await client.disconnect();
            }
            catch { }
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
        }
    }
}
exports.TelegramUserBotHealthCheck = TelegramUserBotHealthCheck;
