"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramUserBotTrigger = void 0;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const events_1 = require("telegram/events");
class TelegramUserBotTrigger {
    constructor() {
        this.description = {
            displayName: 'Telegram User Bot Trigger',
            name: 'telegramUserBotTrigger',
            icon: 'file:telegram.svg',
            group: ['trigger'],
            version: 1,
            description: 'Triggers when a new message is received via Telegram User Bot (MTProto)',
            defaults: {
                name: 'Telegram User Bot Trigger',
            },
            inputs: [],
            outputs: ['main'],
            credentials: [
                {
                    name: 'telegramUserBotApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Filter',
                    name: 'filter',
                    type: 'options',
                    options: [
                        { name: 'All Messages', value: 'all', description: 'Trigger on all incoming messages' },
                        { name: 'Private Messages Only', value: 'private', description: 'Trigger only on private messages' },
                        { name: 'Group Messages Only', value: 'group', description: 'Trigger only on group messages' },
                        { name: 'Specific Chat', value: 'specific', description: 'Trigger only on messages from a specific chat' },
                    ],
                    default: 'private',
                    description: 'Filter which messages to trigger on',
                },
                {
                    displayName: 'Chat ID',
                    name: 'chatId',
                    type: 'string',
                    displayOptions: {
                        show: {
                            filter: ['specific'],
                        },
                    },
                    default: '',
                    description: 'The specific chat ID to listen to',
                },
                {
                    displayName: 'Include Outgoing',
                    name: 'includeOutgoing',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to also trigger on messages you send',
                },
            ],
        };
    }
    async trigger() {
        const credentials = await this.getCredentials('telegramUserBotApi');
        const apiId = parseInt(credentials.apiId, 10);
        const apiHash = credentials.apiHash;
        const sessionString = credentials.sessionString;
        const filter = this.getNodeParameter('filter');
        const includeOutgoing = this.getNodeParameter('includeOutgoing');
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
            connectionRetries: 5,
            proxy,
            timeout: 30,
        });
        await client.connect();
        const handler = async (event) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const msg = event.message;
            if (!includeOutgoing && msg.out)
                return;
            const isPrivate = msg.isPrivate;
            const isGroup = msg.isGroup || msg.isChannel;
            if (filter === 'private' && !isPrivate)
                return;
            if (filter === 'group' && !isGroup)
                return;
            if (filter === 'specific') {
                const targetChatId = this.getNodeParameter('chatId');
                if (((_a = msg.chatId) === null || _a === void 0 ? void 0 : _a.toString()) !== targetChatId)
                    return;
            }
            let senderInfo = { id: (_b = msg.senderId) === null || _b === void 0 ? void 0 : _b.toString() };
            if (msg.sender) {
                const s = msg.sender;
                senderInfo = {
                    id: ((_c = s.id) === null || _c === void 0 ? void 0 : _c.toString()) || ((_d = msg.senderId) === null || _d === void 0 ? void 0 : _d.toString()),
                    firstName: s.firstName || null,
                    lastName: s.lastName || null,
                    username: s.username || null,
                    phone: s.phone || null,
                };
            }
            this.emit([
                [
                    {
                        json: {
                            messageId: msg.id,
                            chatId: (_e = msg.chatId) === null || _e === void 0 ? void 0 : _e.toString(),
                            text: msg.text || msg.message || '',
                            date: msg.date,
                            isOutgoing: Boolean(msg.out),
                            sender: senderInfo,
                            hasMedia: msg.media !== undefined,
                            mediaType: ((_f = msg.media) === null || _f === void 0 ? void 0 : _f.className) || null,
                            replyToMsgId: ((_g = msg.replyTo) === null || _g === void 0 ? void 0 : _g.replyToMsgId) || null,
                        },
                    },
                ],
            ]);
        };
        client.addEventHandler(handler, new events_1.NewMessage({}));
        async function closeFunction() {
            try {
                client.removeEventHandler(handler, new events_1.NewMessage({}));
                await client.disconnect();
            }
            catch { }
        }
        return {
            closeFunction,
        };
    }
}
exports.TelegramUserBotTrigger = TelegramUserBotTrigger;
