"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramUserBot = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const big_integer_1 = __importDefault(require("big-integer"));
class TelegramUserBot {
    constructor() {
        this.description = {
            displayName: 'Telegram User Bot',
            name: 'telegramUserBot',
            icon: 'file:telegram.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{["operation"]}}',
            description: 'Send messages, export history with pagination, and manage dialogs via Telegram User Bot (MTProto)',
            defaults: {
                name: 'Telegram User Bot',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'telegramUserBotApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Send Message',
                            value: 'sendMessage',
                            description: 'Send a text message to a chat',
                            action: 'Send a message',
                        },
                        {
                            name: 'Get Messages',
                            value: 'getMessages',
                            description: 'Get messages from a chat with pagination and date filter',
                            action: 'Get messages',
                        },
                        {
                            name: 'Get Unread Chats',
                            value: 'getUnreadChats',
                            description: 'Get all chats with unread messages (for polling)',
                            action: 'Get unread chats',
                        },
                        {
                            name: 'Mark As Read',
                            value: 'markAsRead',
                            description: 'Mark messages in a chat as read',
                            action: 'Mark as read',
                        },
                        {
                            name: 'Import Contact',
                            value: 'importContact',
                            description: 'Import a contact by phone number and get their Telegram ID',
                            action: 'Import a contact',
                        },
                        {
                            name: 'Get Dialogs',
                            value: 'getDialogs',
                            description: 'Get list of chats/dialogs',
                            action: 'Get dialogs',
                        },
                        {
                            name: 'Get Self Info',
                            value: 'getSelfInfo',
                            description: 'Get information about the logged-in account',
                            action: 'Get self info',
                        },
                    ],
                    default: 'sendMessage',
                },
                {
                    displayName: 'Chat ID',
                    name: 'chatId',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['sendMessage', 'getMessages', 'markAsRead'],
                        },
                    },
                    default: '',
                    description: 'The Telegram chat ID',
                },
                {
                    displayName: 'Message',
                    name: 'message',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['sendMessage'],
                        },
                    },
                    default: '',
                    description: 'The message text to send',
                    typeOptions: {
                        rows: 4,
                    },
                },
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    displayOptions: {
                        show: {
                            operation: ['getMessages', 'getDialogs', 'getUnreadChats'],
                        },
                    },
                    default: 100,
                    description: 'Maximum number of items to return (1-100 recommended per page)',
                },
                {
                    displayName: 'Offset Message ID',
                    name: 'offsetId',
                    type: 'number',
                    displayOptions: {
                        show: {
                            operation: ['getMessages'],
                        },
                    },
                    default: 0,
                    description: 'Only return messages older than this message ID (for pagination)',
                },
                {
                    displayName: 'Offset Date (Unix Timestamp)',
                    name: 'offsetDate',
                    type: 'number',
                    displayOptions: {
                        show: {
                            operation: ['getMessages'],
                        },
                    },
                    default: 0,
                    description: 'Only return messages older than this Unix timestamp (seconds)',
                },
                {
                    displayName: 'Stop at Date (Unix Timestamp)',
                    name: 'minDate',
                    type: 'number',
                    displayOptions: {
                        show: {
                            operation: ['getMessages'],
                        },
                    },
                    default: 0,
                    description: 'Stop retrieving messages older than this Unix timestamp (seconds)',
                },
                {
                    displayName: 'Only Unread',
                    name: 'onlyUnread',
                    type: 'boolean',
                    displayOptions: {
                        show: {
                            operation: ['getMessages'],
                        },
                    },
                    default: false,
                    description: 'Whether to only return unread messages',
                },
                {
                    displayName: 'Phone Number',
                    name: 'phoneNumber',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['importContact'],
                        },
                    },
                    default: '',
                    placeholder: '+79991234567',
                    description: 'Phone number with country code',
                },
                {
                    displayName: 'First Name',
                    name: 'firstName',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['importContact'],
                        },
                    },
                    default: 'Contact',
                    description: 'First name for the contact',
                },
                {
                    displayName: 'Last Name',
                    name: 'lastName',
                    type: 'string',
                    displayOptions: {
                        show: {
                            operation: ['importContact'],
                        },
                    },
                    default: '',
                    description: 'Last name for the contact (optional)',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
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
        try {
            await client.connect();
            for (let i = 0; i < items.length; i++) {
                const operation = this.getNodeParameter('operation', i);
                try {
                    if (operation === 'sendMessage') {
                        const chatId = this.getNodeParameter('chatId', i);
                        const message = this.getNodeParameter('message', i);
                        let target = chatId;
                        if (/^-?\d+$/.test(chatId)) {
                            try {
                                const entity = await client.getEntity(chatId);
                                if (entity instanceof telegram_1.Api.User) {
                                    target = new telegram_1.Api.InputPeerUser({
                                        userId: entity.id,
                                        accessHash: entity.accessHash || big_integer_1.default.zero,
                                    });
                                }
                                else if (entity instanceof telegram_1.Api.Chat) {
                                    target = new telegram_1.Api.InputPeerChat({ chatId: entity.id });
                                }
                                else if (entity instanceof telegram_1.Api.Channel) {
                                    target = new telegram_1.Api.InputPeerChannel({
                                        channelId: entity.id,
                                        accessHash: entity.accessHash || big_integer_1.default.zero,
                                    });
                                }
                            }
                            catch {
                                target = chatId;
                            }
                        }
                        const result = await client.sendMessage(target, { message });
                        returnData.push({
                            json: {
                                success: true,
                                messageId: result.id,
                                chatId,
                                date: result.date,
                            },
                        });
                    }
                    else if (operation === 'getMessages') {
                        const chatId = this.getNodeParameter('chatId', i);
                        const limit = this.getNodeParameter('limit', i, 100);
                        const onlyUnread = this.getNodeParameter('onlyUnread', i, false);
                        const offsetId = this.getNodeParameter('offsetId', i, 0);
                        const offsetDate = this.getNodeParameter('offsetDate', i, 0);
                        const minDate = this.getNodeParameter('minDate', i, 0);

                        const entity = await client.getEntity(chatId);

                        const getParams = { limit };
                        if (offsetId > 0) {
                            getParams.offsetId = offsetId;
                        }
                        if (offsetDate > 0) {
                            getParams.offsetDate = offsetDate;
                        }

                        const messages = await client.getMessages(entity, getParams);

                        let unreadCount = 0;
                        if (onlyUnread) {
                            try {
                                const dialogs = await client.getDialogs({ limit: 100 });
                                const dialog = dialogs.find(d => d.id?.toString() === chatId);
                                unreadCount = dialog?.unreadCount || 0;
                            } catch {}
                        }

                        const messageList = [];
                        for (let j = 0; j < messages.length; j++) {
                            const msg = messages[j];
                            if (onlyUnread && j >= unreadCount)
                                break;
                            if (minDate > 0 && msg.date && msg.date < minDate)
                                break;

                            let senderInfo = { id: msg.senderId?.toString() || '0' };
                            if (msg.sender) {
                                const s = msg.sender;
                                senderInfo = {
                                    id: s.id?.toString() || msg.senderId?.toString() || '0',
                                    firstName: s.firstName || null,
                                    lastName: s.lastName || null,
                                    username: s.username || null,
                                    phone: s.phone || null,
                                };
                            }

                            messageList.push({
                                messageId: msg.id,
                                text: msg.text || msg.message || '',
                                date: msg.date,
                                isOutgoing: Boolean(msg.out),
                                sender: senderInfo,
                                hasMedia: msg.media !== undefined,
                                mediaType: msg.media?.className || null,
                                replyToMsgId: msg.replyTo?.replyToMsgId || null,
                            });
                        }
                        returnData.push({
                            json: {
                                success: true,
                                chatId,
                                unreadCount,
                                messages: messageList,
                                count: messageList.length,
                            },
                        });
                    }
                    else if (operation === 'getUnreadChats') {
                        const limit = this.getNodeParameter('limit', i, 100);
                        const dialogs = await client.getDialogs({ limit: 100 });
                        const unreadChats = [];
                        for (const dialog of dialogs) {
                            if (dialog.unreadCount > 0) {
                                const messages = await client.getMessages(dialog.entity, {
                                    limit: Math.min(dialog.unreadCount, limit)
                                });
                                const messageList = [];
                                for (const msg of messages) {
                                    if (msg.out)
                                        continue;
                                    let senderInfo = { id: msg.senderId?.toString() };
                                    if (msg.sender) {
                                        const s = msg.sender;
                                        senderInfo = {
                                            id: s.id?.toString() || msg.senderId?.toString(),
                                            firstName: s.firstName || null,
                                            lastName: s.lastName || null,
                                            username: s.username || null,
                                            phone: s.phone || null,
                                        };
                                    }
                                    messageList.push({
                                        messageId: msg.id,
                                        text: msg.text || msg.message || '',
                                        date: msg.date,
                                        sender: senderInfo,
                                        hasMedia: msg.media !== undefined,
                                    });
                                }
                                if (messageList.length > 0) {
                                    unreadChats.push({
                                        chatId: dialog.id?.toString(),
                                        chatName: dialog.name || dialog.title,
                                        isUser: dialog.isUser,
                                        isGroup: dialog.isGroup,
                                        unreadCount: dialog.unreadCount,
                                        messages: messageList,
                                    });
                                }
                                if (unreadChats.length >= limit)
                                    break;
                            }
                        }
                        if (unreadChats.length > 0) {
                            for (const chat of unreadChats) {
                                returnData.push({ json: { success: true, ...chat } });
                            }
                        }
                        else {
                            returnData.push({
                                json: {
                                    success: true,
                                    message: 'No unread chats',
                                    count: 0,
                                },
                            });
                        }
                    }
                    else if (operation === 'markAsRead') {
                        const chatId = this.getNodeParameter('chatId', i);
                        const entity = await client.getEntity(chatId);
                        await client.markAsRead(entity);
                        returnData.push({
                            json: {
                                success: true,
                                chatId,
                                markedAsRead: true,
                            },
                        });
                    }
                    else if (operation === 'importContact') {
                        const phoneNumber = this.getNodeParameter('phoneNumber', i);
                        const firstName = this.getNodeParameter('firstName', i);
                        const lastName = this.getNodeParameter('lastName', i);
                        const contact = new telegram_1.Api.InputPhoneContact({
                            clientId: (0, big_integer_1.default)(Date.now()),
                            phone: phoneNumber.replace(/\s+/g, ''),
                            firstName,
                            lastName,
                        });
                        const result = await client.invoke(new telegram_1.Api.contacts.ImportContacts({
                            contacts: [contact],
                        }));
                        if (result.users && result.users.length > 0) {
                            const user = result.users[0];
                            returnData.push({
                                json: {
                                    success: true,
                                    userId: user.id.toString(),
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    username: user.username,
                                    phone: user.phone,
                                },
                            });
                        }
                        else {
                            returnData.push({
                                json: {
                                    success: false,
                                    message: 'Contact not registered on Telegram',
                                },
                            });
                        }
                    }
                    else if (operation === 'getDialogs') {
                        const limit = this.getNodeParameter('limit', i, 100);
                        const dialogs = await client.getDialogs({ limit });
                        const dialogList = dialogs.map((d) => ({
                            id: d.id?.toString(),
                            name: d.name || d.title,
                            isUser: d.isUser,
                            isGroup: d.isGroup,
                            isChannel: d.isChannel,
                            unreadCount: d.unreadCount,
                        }));
                        returnData.push({
                            json: {
                                success: true,
                                count: dialogList.length,
                                dialogs: dialogList,
                            },
                        });
                    }
                    else if (operation === 'getSelfInfo') {
                        const me = await client.getMe();
                        returnData.push({
                            json: {
                                success: true,
                                userId: me.id.toString(),
                                firstName: me.firstName,
                                lastName: me.lastName,
                                username: me.username,
                                phone: me.phone,
                            },
                        });
                    }
                }
                catch (error) {
                    if (this.continueOnFail()) {
                        returnData.push({ json: { error: error.message } });
                        continue;
                    }
                    throw error;
                }
            }
            await client.disconnect();
            return [returnData];
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
exports.TelegramUserBot = TelegramUserBot;
