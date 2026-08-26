# n8n-nodes-telegram-userbot

Enhanced Community Node for n8n to integrate with Telegram User Bot (MTProto) via GramJS.

## Features
- **Pagination Support:** Full support for `offsetId`, `offsetDate`, and `minDate` in `Get Messages` for seamless backfilling of large channel histories.
- **High Performance:** Zero N+1 requests — fast synchronous sender extraction from embedded GramJS entities without triggering `FLOOD_WAIT`.
- **Get Dialogs & Channels:** Retrieve all user chats, channels, supergroups, and unread counts.
- **Send Messages & Mark As Read:** Direct userbot messaging and interaction.
- **Import Contacts & Health Check:** Direct contact management and connection status checks.

## Installation in n8n

### Docker
```yaml
environment:
  - N8N_COMMUNITY_PACKAGES=n8n-nodes-telegram-userbot
```

### npm
```bash
npm install n8n-nodes-telegram-userbot
```

## Credentials Setup
1. Get `apiId` and `apiHash` from [my.telegram.org](https://my.telegram.org).
2. Generate session string by running:
   ```bash
   npm run login
   ```
3. Enter credentials in n8n under **Telegram User Bot API**.

## License
MIT
