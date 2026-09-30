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
            subtitle: '={{$parameter["operation"]}}',
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
                        {
                            name: 'Check Chatlist / Addlist',
                            value: 'checkChatlist',
                            description: 'Get channels and groups inside a Telegram addlist / chatlist invite link',
                            action: 'Check chatlist / addlist',
                        },
                    ],
                    default: 'sendMessage',
                },
                // Chat ID parameter
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
                    description: 'The Telegram chat ID (e.g. -1001234567890 or @username)',
                },
                // Send Message fields
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
                // Get Messages & Dialogs Limit
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
                // Pagination parameter: Offset ID
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
                // Pagination parameter: Offset Date
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
                // Stop condition: Min Date
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
                // Only Unread
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
                // Import Contact fields
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
                // Addlist Slug / URL parameter
                {
                    displayName: 'Slug or URL',
                    name: 'slug',
                    type: 'string',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['checkChatlist'],
                        },
                    },
                    default: '',
                    description: 'The addlist slug (e.g. IFpH9zDbQDljZTBi) or full link (https://t.me/addlist/IFpH9zDbQDljZTBi)',
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                                const dialog = dialogs.find((d) => { var _a; return ((_a = d.id) === null || _a === void 0 ? void 0 : _a.toString()) === chatId; });
                                unreadCount = (dialog === null || dialog === void 0 ? void 0 : dialog.unreadCount) || 0;
                            }
                            catch { }
                        }
                        const messageList = [];
                        for (let j = 0; j < messages.length; j++) {
                            const msg = messages[j];
                            if (onlyUnread && j >= unreadCount)
                                break;
                            if (minDate > 0 && msg.date && msg.date < minDate)
                                break;
                            // Fast synchronous sender resolution from embedded entities (0 extra network calls)
                            let senderInfo = { id: ((_a = msg.senderId) === null || _a === void 0 ? void 0 : _a.toString()) || '0' };
                            if (msg.sender) {
                                const s = msg.sender;
                                senderInfo = {
                                    id: ((_b = s.id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = msg.senderId) === null || _c === void 0 ? void 0 : _c.toString()) || '0',
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
                                mediaType: ((_d = msg.media) === null || _d === void 0 ? void 0 : _d.className) || null,
                                replyToMsgId: ((_e = msg.replyTo) === null || _e === void 0 ? void 0 : _e.replyToMsgId) || null,
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
                                    limit: Math.min(dialog.unreadCount, limit),
                                });
                                const messageList = [];
                                for (const msg of messages) {
                                    if (msg.out)
                                        continue;
                                    let senderInfo = { id: (_f = msg.senderId) === null || _f === void 0 ? void 0 : _f.toString() };
                                    if (msg.sender) {
                                        const s = msg.sender;
                                        senderInfo = {
                                            id: ((_g = s.id) === null || _g === void 0 ? void 0 : _g.toString()) || ((_h = msg.senderId) === null || _h === void 0 ? void 0 : _h.toString()),
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
                                        chatId: (_j = dialog.id) === null || _j === void 0 ? void 0 : _j.toString(),
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
                        const lastName = this.getNodeParameter('lastName', i, '');
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
                        const dialogList = dialogs.map((d) => {
                            var _a, _b, _c;
                            return ({
                                id: (_a = d.id) === null || _a === void 0 ? void 0 : _a.toString(),
                                name: d.name || d.title,
                                isUser: d.isUser,
                                isGroup: d.isGroup,
                                isChannel: d.isChannel,
                                unreadCount: d.unreadCount,
                                topMessage: ((_b = d.message) === null || _b === void 0 ? void 0 : _b.id) || d.topMessage || null,
                                date: ((_c = d.message) === null || _c === void 0 ? void 0 : _c.date) || d.date || null,
                            });
                        });
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
                    else if (operation === 'checkChatlist') {
                        const rawSlug = this.getNodeParameter('slug', i);
                        const cleanSlug = rawSlug.replace(/^.*\/addlist\//, '').replace(/[^a-zA-Z0-9_-]/g, '');
                        try {
                            const inviteRes = await client.invoke(new telegram_1.Api.chatlists.CheckChatlistInvite({
                                slug: cleanSlug,
                            }));
                            const folderTitle = inviteRes.title || null;
                            const chats = Array.isArray(inviteRes.chats) ? inviteRes.chats : [];
                            const extractedChannels = [];
                            for (const c of chats) {
                                const rawId = ((_k = c.id) === null || _k === void 0 ? void 0 : _k.toString()) || '';
                                let channelId = rawId;
                                if (c.broadcast || c.megagroup) {
                                    channelId = rawId.startsWith('-100') ? rawId : (rawId.startsWith('-') ? rawId : `-100${rawId}`);
                                }
                                const channelType = c.broadcast ? 'channel' : (c.megagroup ? 'supergroup' : 'group');
                                const username = c.username || null;
                                const inviteLink = username ? `https://t.me/${username}` : `https://t.me/addlist/${cleanSlug}`;
                                extractedChannels.push({
                                    slug: cleanSlug,
                                    folder_title: folderTitle,
                                    channel_id: channelId,
                                    title: c.title || 'Untitled',
                                    username: username,
                                    channel_type: channelType,
                                    participants_count: c.participantsCount || null,
                                    invite_link: inviteLink,
                                    is_verified: Boolean(c.verified),
                                    is_scam: Boolean(c.scam),
                                    is_fake: Boolean(c.fake),
                                });
                            }
                            returnData.push({
                                json: {
                                    success: true,
                                    slug: cleanSlug,
                                    folder_title: folderTitle,
                                    chats_count: extractedChannels.length,
                                    channels: extractedChannels,
                                },
                            });
                        }
                        catch (err) {
                            const errMsg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
                            returnData.push({
                                json: {
                                    success: false,
                                    slug: cleanSlug,
                                    error: errMsg,
                                    is_expired: errMsg.includes('INVITE_SLUG_EXPIRED') || errMsg.includes('INVITE_SLUG_INVALID'),
                                },
                            });
                        }
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
