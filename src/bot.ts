import { Bot } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';
import { config } from './config';
import { handleStart } from './handlers/start';
import { handleBalance, handleBuyTokens, handleBuyCallback } from './handlers/balance';
import { handlePhoto } from './handlers/photo';
import { handlePreCheckoutQuery, handleSuccessfulPayment } from './handlers/payment';
import { MyContext } from './types';

export function createBot() {
    const bot = new Bot<MyContext>(config.telegramBotToken);

    // Use hydration plugin
    bot.use(hydrate());

    // Command handlers
    bot.command('start', handleStart);
    bot.command('balance', handleBalance);

    // Callback query handlers
    bot.callbackQuery('balance', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleBalance(ctx);
    });

    bot.callbackQuery('buy_tokens', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleBuyTokens(ctx);
    });

    // Handle buy callbacks (buy_100, buy_200, etc.)
    bot.callbackQuery(/^buy_(\d+)$/, async (ctx) => {
        const stars = parseInt(ctx.match[1], 10);
        await handleBuyCallback(ctx, stars);
    });

    // Payment handlers
    bot.on('pre_checkout_query', handlePreCheckoutQuery);
    bot.on('message:successful_payment', handleSuccessfulPayment);

    // Photo handler
    bot.on('message:photo', handlePhoto);

    // Error handler
    bot.catch((err) => {
        console.error('Bot error:', err);
    });

    return bot;
}
