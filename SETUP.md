# Quick Setup Guide

## Current Status

✅ **Completed:**
- All source code files created
- Dependencies installed with pnpm
- Database created
- Prisma client generated

⏳ **Next Steps:**

### 1. Configure API Keys

You need to edit the `.env` file with your API keys:

**Get Telegram Bot Token:**
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token you receive

**Get OpenRouter API Key:**
1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign in or create an account
3. Navigate to Keys section
4. Create a new API key
5. Copy the key

**Get Replicate API Token:**
1. Go to [https://replicate.com/](https://replicate.com/)
2. Sign up or log in
3. Go to your account settings
4. Find API tokens section
5. Create a new token and copy it

**Edit .env file:**
```env
TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
OPENROUTER_API_KEY=your_actual_openrouter_key_here
REPLICATE_API_TOKEN=your_actual_replicate_token_here
DATABASE_URL="postgresql://localhost:5432/sticker_bot?schema=public"
```

### 2. Run Database Migrations

Once you've configured the `.env` file:

```bash
pnpm db:migrate
```

This will create the necessary database tables.

### 3. Start the Bot

```bash
pnpm dev
```

You should see:
```
🤖 Starting Telegram Sticker Bot...
✅ Database connected
✅ Bot started as @your_bot_name
📸 Ready to create sticker packs!
```

### 4. Test the Bot

1. Open Telegram and find your bot
2. Send `/start` to see the welcome message
3. Send a photo to test sticker generation
4. Check your token balance with `/balance`

## Important Notes

- **First Token**: Each new user gets 1 free token for testing
- **Telegram Stars**: To enable real payments, you need to configure your bot with a payment provider in BotFather
- **Model**: The bot uses `google/gemini-2.0-flash-exp:free` by default (you can change in `.env`)

## Testing Without Real Payments

The payment flow is implemented, but Telegram Stars payments require production configuration. For now, you can:
1. Test the sticker generation with your free token
2. View the balance menu to see purchase options
3. The actual payment will only work after configuring payment provider in BotFather

## Troubleshooting

**Database connection errors:**
- Make sure PostgreSQL is running
- Verify the DATABASE_URL in `.env` is correct
- Check that the `sticker_bot` database exists

**Bot not responding:**
- Verify TELEGRAM_BOT_TOKEN is correct
- Check that the bot is not running in another terminal
- Look for errors in the console output

**Image generation fails:**
- Verify OPENROUTER_API_KEY is valid
- Check your OpenRouter account has credits
- The model might be rate-limited (wait a minute and try again)
