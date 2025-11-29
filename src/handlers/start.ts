import { Context } from 'grammy';
import { userService } from '../db/user.service';

export async function handleStart(ctx: Context) {
    try {
        const userId = ctx.from?.id;
        const username = ctx.from?.username;

        if (!userId) {
            return;
        }

        // Create or get user
        const user = await userService.getOrCreateUser(userId, username);

        const welcomeMessage = `🎨 *Добро пожаловать в Генератор Стикерпаков!*

Пришли мне свою фотографию, и я создам персональный стикерпак из 25 уникальных стикеров с твоим лицом!

*Как это работает:*
1️⃣ Пришли мне фото
2️⃣ ИИ сгенерирует 25 милых стикеров с разными эмоциями
3️⃣ Получи свой готовый стикерпак!

*Система токенов:*
🪙 У тебя есть *${user.tokens} токен${user.tokens !== 1 ? 'ов' : ''}*
1 генерация = 1 токен

Нужно больше токенов? Используй /balance чтобы купить еще! 💫`;

        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💰 Проверить баланс', callback_data: 'balance' },
                        { text: '🛒 Купить токены', callback_data: 'buy_tokens' },
                    ],
                ],
            },
        });
    } catch (error) {
        console.error('Error in start handler:', error);
        await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
}
