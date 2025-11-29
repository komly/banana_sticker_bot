import { userService } from '../db/user.service';
import { transactionService } from '../db/transaction.service';
import { MyContext } from '../types';
import { config } from '../config';

export async function handlePreCheckoutQuery(ctx: MyContext) {
    try {
        await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
        console.error('Error handling pre-checkout query:', error);
        await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
}

export async function handleSuccessfulPayment(ctx: MyContext) {
    try {
        const userId = ctx.from?.id;
        const payment = ctx.message?.successful_payment;

        if (!userId || !payment) {
            return;
        }

        // Extract token amount from invoice payload
        // Payload format: tokens_AMOUNT_TIMESTAMP
        const payload = payment.invoice_payload;
        const match = payload.match(/^tokens_(\d+)_/);

        if (!match) {
            console.error('Invalid invoice payload:', payload);
            return;
        }

        const tokenAmount = parseInt(match[1], 10);
        const starsAmount = payment.total_amount;

        // Add tokens to user
        await userService.addTokens(userId, tokenAmount);

        // Log transaction
        await transactionService.logPurchase(userId, tokenAmount, starsAmount);

        const newBalance = await userService.getUserTokens(userId);

        await ctx.reply(
            `✅ *Оплата прошла успешно!*

Вы получили *${tokenAmount} токенов*!

💰 Новый баланс: *${newBalance} токенов*

Готовы создавать потрясающие стикерпаки! 🎨`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error handling successful payment:', error);
        await ctx.reply('Оплата получена, но произошла ошибка. Пожалуйста, обратитесь в поддержку.');
    }
}
