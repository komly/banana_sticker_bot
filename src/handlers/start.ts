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

        const welcomeMessage = `🎨 *Welcome to Sticker Pack Generator!*

Send me a photo and I'll create a personalized sticker pack with 25 unique stickers featuring you!

*How it works:*
1️⃣ Send me your photo
2️⃣ AI generates 25 cute stickers with different emotions
3️⃣ Get your custom sticker pack!

*Token System:*
🪙 You have *${user.tokens} token${user.tokens !== 1 ? 's' : ''}*
1 generation = 1 token

Need more tokens? Use /balance to buy more! 💫`;

        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💰 Check Balance', callback_data: 'balance' },
                        { text: '🛒 Buy Tokens', callback_data: 'buy_tokens' },
                    ],
                ],
            },
        });
    } catch (error) {
        console.error('Error in start handler:', error);
        await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
}
