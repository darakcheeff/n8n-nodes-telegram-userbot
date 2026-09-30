import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

export class TelegramUserBotHealthCheck implements INodeType {
  description: INodeTypeDescription = {
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
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
      connectionRetries: 3,
      proxy,
      timeout: 15,
    });

    try {
      await client.connect();
      const me: any = await client.getMe();
      await client.disconnect();

      return [
        [
          {
            json: {
              connected: true,
              userId: me?.id?.toString(),
              firstName: me?.firstName || '',
              lastName: me?.lastName || '',
              username: me?.username || '',
              phone: me?.phone || '',
            },
          },
        ],
      ];
    } catch (error) {
      try {
        await client.disconnect();
      } catch {}
      throw new NodeOperationError(this.getNode(), error as Error);
    }
  }
}
