import { Context } from 'grammy';
import { userService } from '../db/user.service';
import { config } from '../config';

export async function handleBalance(ctx: Context) {
    try {
        const userId = ctx.from?.id;

        if (!userId) {
            return;
        }

        const user = await userService.getUser(userId);

        if (!user) {
            await ctx.reply('Please start the bot first using /start');
            return;
        }

        const message = `💰 *Your Balance*

🪙 Tokens: *${user.tokens}*

Each sticker pack generation costs 1 token.
Buy more tokens below! ⬇️`;

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    ...config.tokenPrices.map((price) => [
                        {
                            text: `⭐ ${price.stars} Stars → ${price.tokens} Tokens`,
                            callback_data: `buy_${price.stars}`,
                        },
                    ]),
                ],
            },
        });
    } catch (error) {
        console.error('Error in balance handler:', error);
        await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
}

export async function handleBuyTokens(ctx: Context) {
    await handleBalance(ctx);
}

export async function handleBuyCallback(ctx: Context, stars: number) {
    try {
        const userId = ctx.from?.id;

        if (!userId) {
            return;
        }

        const priceOption = config.tokenPrices.find((p) => p.stars === stars);

        if (!priceOption) {
            await ctx.answerCallbackQuery('Invalid option');
            return;
        }

        // Create invoice for Telegram Stars payment
        const title = `${priceOption.tokens} Tokens`;
        const description = `Purchase ${priceOption.tokens} tokens for sticker generation`;
        const payload = `tokens_${priceOption.tokens}_${Date.now()}`;
        const currency = 'XTR'; // Telegram Stars currency code

        await ctx.replyWithInvoice(title, description, payload, '', currency, [
            {
                label: `${priceOption.tokens} Tokens`,
                amount: priceOption.stars,
            },
        ]);

        await ctx.answerCallbackQuery();
    } catch (error) {
        console.error('Error in buy callback handler:', error);
        await ctx.answerCallbackQuery('Error creating invoice');
    }
}
