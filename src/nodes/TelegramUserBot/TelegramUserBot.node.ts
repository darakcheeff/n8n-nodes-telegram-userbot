import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import bigInt from 'big-integer';

export class TelegramUserBot implements INodeType {
  description: INodeTypeDescription = {
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('telegramUserBotApi');
    const apiId = parseInt(credentials.apiId as string, 10);
    const apiHash = credentials.apiHash as string;
    const sessionString = credentials.sessionString as string;

    let proxy: any;
    if (credentials.useProxy) {
      proxy = {
        socksType: 5,
        ip: (credentials.proxyHost as string) || '127.0.0.1',
        port: parseInt(credentials.proxyPort as string, 10) || 1080,
      };
      if (credentials.proxyUsername) proxy.username = credentials.proxyUsername as string;
      if (credentials.proxyPassword) proxy.password = credentials.proxyPassword as string;
    }

    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      proxy,
      timeout: 30,
    });

    try {
      await client.connect();

      for (let i = 0; i < items.length; i++) {
        const operation = this.getNodeParameter('operation', i) as string;

        try {
          if (operation === 'sendMessage') {
            const chatId = this.getNodeParameter('chatId', i) as string;
            const message = this.getNodeParameter('message', i) as string;

            let target: any = chatId;
            if (/^-?\d+$/.test(chatId)) {
              try {
                const entity: any = await client.getEntity(chatId);
                if (entity instanceof Api.User) {
                  target = new Api.InputPeerUser({
                    userId: entity.id,
                    accessHash: entity.accessHash || bigInt.zero,
                  });
                } else if (entity instanceof Api.Chat) {
                  target = new Api.InputPeerChat({ chatId: entity.id });
                } else if (entity instanceof Api.Channel) {
                  target = new Api.InputPeerChannel({
                    channelId: entity.id,
                    accessHash: entity.accessHash || bigInt.zero,
                  });
                }
              } catch {
                target = chatId;
              }
            }

            const result: any = await client.sendMessage(target, { message });
            returnData.push({
              json: {
                success: true,
                messageId: result.id,
                chatId,
                date: result.date,
              },
            });
          } else if (operation === 'getMessages') {
            const chatId = this.getNodeParameter('chatId', i) as string;
            const limit = this.getNodeParameter('limit', i, 100) as number;
            const onlyUnread = this.getNodeParameter('onlyUnread', i, false) as boolean;
            const offsetId = this.getNodeParameter('offsetId', i, 0) as number;
            const offsetDate = this.getNodeParameter('offsetDate', i, 0) as number;
            const minDate = this.getNodeParameter('minDate', i, 0) as number;

            const entity = await client.getEntity(chatId);

            const getParams: any = { limit };
            if (offsetId > 0) {
              getParams.offsetId = offsetId;
            }
            if (offsetDate > 0) {
              getParams.offsetDate = offsetDate;
            }

            const messages: any = await client.getMessages(entity, getParams);

            let unreadCount = 0;
            if (onlyUnread) {
              try {
                const dialogs = await client.getDialogs({ limit: 100 });
                const dialog = dialogs.find((d: any) => d.id?.toString() === chatId);
                unreadCount = dialog?.unreadCount || 0;
              } catch {}
            }

            const messageList = [];
            for (let j = 0; j < messages.length; j++) {
              const msg = messages[j];
              if (onlyUnread && j >= unreadCount) break;
              if (minDate > 0 && msg.date && msg.date < minDate) break;

              // Fast synchronous sender resolution from embedded entities (0 extra network calls)
              let senderInfo: any = { id: msg.senderId?.toString() || '0' };
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
          } else if (operation === 'getUnreadChats') {
            const limit = this.getNodeParameter('limit', i, 100) as number;
            const dialogs = await client.getDialogs({ limit: 100 });
            const unreadChats = [];

            for (const dialog of dialogs) {
              if (dialog.unreadCount > 0) {
                const messages: any = await client.getMessages(dialog.entity, {
                  limit: Math.min(dialog.unreadCount, limit),
                });
                const messageList = [];
                for (const msg of messages) {
                  if (msg.out) continue;
                  let senderInfo: any = { id: msg.senderId?.toString() };
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

                if (unreadChats.length >= limit) break;
              }
            }

            if (unreadChats.length > 0) {
              for (const chat of unreadChats) {
                returnData.push({ json: { success: true, ...chat } });
              }
            } else {
              returnData.push({
                json: {
                  success: true,
                  message: 'No unread chats',
                  count: 0,
                },
              });
            }
          } else if (operation === 'markAsRead') {
            const chatId = this.getNodeParameter('chatId', i) as string;
            const entity = await client.getEntity(chatId);
            await client.markAsRead(entity);
            returnData.push({
              json: {
                success: true,
                chatId,
                markedAsRead: true,
              },
            });
          } else if (operation === 'importContact') {
            const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
            const firstName = this.getNodeParameter('firstName', i) as string;
            const lastName = this.getNodeParameter('lastName', i, '') as string;

            const contact = new Api.InputPhoneContact({
              clientId: bigInt(Date.now()),
              phone: phoneNumber.replace(/\s+/g, ''),
              firstName,
              lastName,
            });

            const result: any = await client.invoke(
              new Api.contacts.ImportContacts({
                contacts: [contact],
              }),
            );

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
            } else {
              returnData.push({
                json: {
                  success: false,
                  message: 'Contact not registered on Telegram',
                },
              });
            }
          } else if (operation === 'getDialogs') {
            const limit = this.getNodeParameter('limit', i, 100) as number;
            const dialogs = await client.getDialogs({ limit });
            const dialogList = dialogs.map((d: any) => ({
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
          } else if (operation === 'getSelfInfo') {
            const me: any = await client.getMe();
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
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({ json: { error: (error as Error).message } });
            continue;
          }
          throw error;
        }
      }

      await client.disconnect();
      return [returnData];
    } catch (error) {
      try {
        await client.disconnect();
      } catch {}
      throw new NodeOperationError(this.getNode(), error as Error);
    }
  }
}
