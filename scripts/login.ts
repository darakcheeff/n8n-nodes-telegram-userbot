import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
const input = require('input');

(async () => {
  console.log('=== Telegram User Bot Login ===');
  const apiId = parseInt(await input.text('Enter your Telegram API ID: '), 10);
  const apiHash = await input.text('Enter your Telegram API Hash: ');
  const phoneNumber = await input.text('Enter your Phone Number (e.g. +79991234567): ');

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => await input.password('Enter 2FA Password (if enabled): '),
    phoneCode: async () => await input.text('Enter Verification Code from Telegram: '),
    onError: (err) => console.log('Auth Error:', err),
  });

  console.log('\n✅ Successfully Logged In!');
  console.log('\nYour Session String (save this in n8n Telegram User Bot credentials):');
  console.log('--------------------------------------------------');
  console.log(client.session.save());
  console.log('--------------------------------------------------');
  await client.disconnect();
  process.exit(0);
})();
