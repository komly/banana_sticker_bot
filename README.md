# Telegram Sticker Bot

A Telegram bot that creates custom sticker packs from photos using AI. Users can send a photo and receive a personalized sticker pack with 25 unique stickers featuring different emotions and expressions.

## Features

- 🎨 AI-powered sticker generation using Google Nano Banana
- ✨ Automatic background removal with neural networks
- 🔍 AI upscaling for crisp, high-quality stickers
- 🪙 Token-based system (1 token per generation)
- ⭐ Purchase tokens with Telegram Stars
- 📦 Automatic sticker pack creation (25 stickers per pack)
- 💰 Balance tracking and transaction history

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- OpenRouter API Key (from [OpenRouter](https://openrouter.ai/))
- Replicate API Token (from [Replicate](https://replicate.com/))

## Setup

1. **Install dependencies:**

```bash
pnpm install
```

2. **Create PostgreSQL database:**

```bash
createdb sticker_bot
```

3. **Configure environment variables:**

Edit the `.env` file and add your API keys:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OPENROUTER_API_KEY=your_openrouter_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
DATABASE_URL="postgresql://localhost:5432/sticker_bot?schema=public"
```

**To get your API keys:**
- Telegram Bot Token: Talk to [@BotFather](https://t.me/botfather) on Telegram
- OpenRouter API Key: Sign up at [OpenRouter](https://openrouter.ai/)
- Replicate API Token: Sign up at [Replicate](https://replicate.com/) and get your token

4. **Setup database:**

```bash
pnpm db:generate
pnpm db:migrate
```

5. **Start the bot:**

```bash
pnpm dev
```

## Usage

1. Start the bot: `/start`
2. Check your balance: `/balance`
3. Send a photo to generate a sticker pack
4. Buy more tokens with Telegram Stars

## Commands

- `/start` - Welcome message and bot introduction
- `/balance` - Check token balance and buy more tokens

## Tech Stack

- **Language:** TypeScript
- **Bot Framework:** Grammy
- **Database:** PostgreSQL with Prisma ORM
- **Image Processing:** Sharp
- **AI:** OpenRouter (Google Nano Banana model)

## Project Structure

```
src/
├── bot.ts                    # Bot initialization and handlers
├── config.ts                 # Configuration and environment variables
├── index.ts                  # Application entry point
├── db/
│   ├── prisma.ts            # Prisma client
│   ├── user.service.ts      # User management
│   └── transaction.service.ts # Transaction logging
├── handlers/
│   ├── start.ts             # /start command
│   ├── balance.ts           # Balance and token purchase
│   ├── photo.ts             # Photo processing
│   └── payment.ts           # Payment handling
├── services/
│   ├── sticker-generator.ts # AI sticker generation
│   ├── image-processor.ts   # Image grid cutting
│   └── telegram-stickers.ts # Sticker pack upload
├── types/
│   └── index.ts             # TypeScript types
└── utils/
    ├── base64.ts            # Image encoding
    └── download.ts          # File download utilities
```

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build for production
pnpm build

# Start production build
pnpm start

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## License

MIT
