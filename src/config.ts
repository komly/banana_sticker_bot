import dotenv from 'dotenv';

dotenv.config();

export const config = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
    databaseUrl: process.env.DATABASE_URL || '',
    modelName: process.env.MODEL_NAME || 'google/gemini-3-pro-image-preview',

    // Whitelist for unlimited generations (for debugging)
    whitelistUsernames: ['dpetrov3'],

    // Token pricing
    tokenPrices: [
        { stars: 25, tokens: 1 },
        { stars: 50, tokens: 2 },
        { stars: 100, tokens: 4 },
        { stars: 200, tokens: 9 },
    ],

    defaultTokens: 0,
    tokensPerGeneration: 1,

    // Sticker settings
    stickerSize: 512,
    maxStickerFileSize: 512 * 1024, // 512KB
};

// Validation
if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!config.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
}

if (!config.replicateApiToken) {
    throw new Error('REPLICATE_API_TOKEN is required');
}
