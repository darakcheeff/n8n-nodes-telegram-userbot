import { ITriggerFunctions, ITriggerResponse, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';

export class TelegramUserBotTrigger implements INodeType {
  description: INodeTypeDescription = {
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

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = await this.getCredentials('telegramUserBotApi');
    const apiId = parseInt(credentials.apiId as string, 10);
    const apiHash = credentials.apiHash as string;
    const sessionString = credentials.sessionString as string;
    const filter = this.getNodeParameter('filter') as string;
    const includeOutgoing = this.getNodeParameter('includeOutgoing') as boolean;

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

    await client.connect();

    const handler = async (event: any) => {
      const msg = event.message;
      if (!includeOutgoing && msg.out) return;

      const isPrivate = msg.isPrivate;
      const isGroup = msg.isGroup || msg.isChannel;

      if (filter === 'private' && !isPrivate) return;
      if (filter === 'group' && !isGroup) return;
      if (filter === 'specific') {
        const targetChatId = this.getNodeParameter('chatId') as string;
        if (msg.chatId?.toString() !== targetChatId) return;
      }

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

      this.emit([
        [
          {
            json: {
              messageId: msg.id,
              chatId: msg.chatId?.toString(),
              text: msg.text || msg.message || '',
              date: msg.date,
              isOutgoing: Boolean(msg.out),
              sender: senderInfo,
              hasMedia: msg.media !== undefined,
              mediaType: msg.media?.className || null,
              replyToMsgId: msg.replyTo?.replyToMsgId || null,
            },
          },
        ],
      ]);
    };

    client.addEventHandler(handler, new NewMessage({}));

    async function closeFunction() {
      try {
        client.removeEventHandler(handler, new NewMessage({}));
        await client.disconnect();
      } catch {}
    }

    return {
      closeFunction,
    };
  }
}
