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
                        {
                            name: 'All Messages',
                            value: 'all',
                            description: 'Trigger on all incoming messages',
                        },
                        {
                            name: 'Private Messages Only',
                            value: 'private',
                            description: 'Trigger only on private (direct) messages',
                        },
                        {
                            name: 'Group Messages Only',
                            value: 'group',
                            description: 'Trigger only on group messages',
                        },
                        {
                            name: 'Specific Chat',
                            value: 'specific',
                            description: 'Trigger only on messages from a specific chat',
                        },
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
        }
        const stringSession = new sessions_1.StringSession(sessionString);
        const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
            proxy,
            timeout: 30,
        });
        await client.connect();
        const eventHandler = async (event) => {
            const message = event.message;
            // Skip outgoing messages if not included
            if (!includeOutgoing && message.out) {
                return;
            }
            // Apply filters
            if (filter === 'private') {
                if (!event.isPrivate)
                    return;
            }
            else if (filter === 'group') {
                if (!event.isGroup && !event.isChannel)
                    return;
            }
            else if (filter === 'specific') {
                const chatId = this.getNodeParameter('chatId');
                const messageChatId = message.chatId?.toString();
                if (messageChatId !== chatId)
                    return;
            }
            // Get sender information
            let senderInfo = { id: '' };
            try {
                const sender = await message.getSender();
                if (sender instanceof telegram_1.Api.User) {
                    senderInfo = {
                        id: sender.id.toString(),
                        firstName: sender.firstName || undefined,
                        lastName: sender.lastName || undefined,
                        username: sender.username || undefined,
                        phone: sender.phone || undefined,
                    };
                }
            }
            catch {
                senderInfo = { id: message.senderId?.toString() || 'unknown' };
            }
            // Get chat information
            let chatInfo = { id: '', type: 'unknown' };
            try {
                const chat = await message.getChat();
                if (chat instanceof telegram_1.Api.User) {
                    chatInfo = {
                        id: chat.id.toString(),
                        type: 'private',
                        title: [chat.firstName, chat.lastName].filter(Boolean).join(' ') || undefined,
                    };
                }
                else if (chat instanceof telegram_1.Api.Chat) {
                    chatInfo = {
                        id: chat.id.toString(),
                        type: 'group',
                        title: chat.title,
                    };
                }
                else if (chat instanceof telegram_1.Api.Channel) {
                    chatInfo = {
                        id: chat.id.toString(),
                        type: chat.megagroup ? 'supergroup' : 'channel',
                        title: chat.title,
                    };
                }
            }
            catch {
                chatInfo = { id: message.chatId?.toString() || 'unknown', type: 'unknown' };
            }
            // Build output data
            const outputData = {
                messageId: message.id,
                text: message.text || '',
                date: message.date,
                chatId: message.chatId?.toString(),
                senderId: message.senderId?.toString(),
                isOutgoing: message.out,
                isPrivate: event.isPrivate,
                isGroup: event.isGroup,
                isChannel: event.isChannel,
                sender: senderInfo,
                chat: chatInfo,
                replyToMessageId: message.replyTo?.replyToMsgId,
                hasMedia: message.media !== undefined,
                mediaType: message.media?.className || null,
            };
            this.emit([this.helpers.returnJsonArray([outputData])]);
        };
        // Add event handler for new messages
        client.addEventHandler(eventHandler, new events_1.NewMessage({}));
        // Return manual trigger response
        const closeFunction = async () => {
            await client.disconnect();
        };
        return {
            closeFunction,
        };
    }
}
exports.TelegramUserBotTrigger = TelegramUserBotTrigger;
//# sourceMappingURL=TelegramUserBotTrigger.node.js.map