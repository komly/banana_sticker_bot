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
            await ctx.reply('Пожалуйста, запустите бота с помощью /start');
            return;
        }

        const message = `💰 *Твой баланс*

🪙 Токены: *${user.tokens}*

Генерация одного стикерпака стоит 1 токен.
Купи больше токенов ниже! ⬇️`;

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    ...config.tokenPrices.map((price) => [
                        {
                            text: `⭐ ${price.stars} Звезд → ${price.tokens} Токенов`,
                            callback_data: `buy_${price.stars}`,
                        },
                    ]),
                ],
            },
        });
    } catch (error) {
        console.error('Error in balance handler:', error);
        await ctx.reply('Извините, что-то пошло не так. Пожалуйста, попробуйте позже.');
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
            await ctx.answerCallbackQuery('Неверная опция');
            return;
        }

        // Create invoice for Telegram Stars payment
        const title = `${priceOption.tokens} Токенов`;
        const description = `Покупка ${priceOption.tokens} токенов для генерации стикеров`;
        const payload = `tokens_${priceOption.tokens}_${Date.now()}`;
        const currency = 'XTR'; // Telegram Stars currency code

        await ctx.api.sendInvoice(
            ctx.chat!.id,
            title,
            description,
            payload,
            '', // provider_token is empty for Stars
            currency,
            [
                {
                    label: `${priceOption.tokens} Токенов`,
                    amount: priceOption.stars,
                },
            ]
        );

        await ctx.answerCallbackQuery();
    } catch (error) {
        console.error('Error in buy callback handler:', error);
        await ctx.answerCallbackQuery('Ошибка создания счета');
    }
}
