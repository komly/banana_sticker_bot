import { Context } from 'grammy';
import { userService } from '../db/user.service';
import { transactionService } from '../db/transaction.service';
import { config } from '../config';

export async function handlePreCheckoutQuery(ctx: Context) {
    // Always approve pre-checkout
    await ctx.answerPreCheckoutQuery(true);
}

export async function handleSuccessfulPayment(ctx: Context) {
    try {
        const userId = ctx.from?.id;
        const payment = ctx.message?.successful_payment;

        if (!userId || !payment) {
            return;
        }

        // Extract token amount from payload
        const payload = payment.invoice_payload;
        const match = payload.match(/tokens_(\d+)_/);

        if (!match) {
            console.error('Invalid payment payload:', payload);
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
            `✅ *Payment Successful!*

You received *${tokenAmount} tokens*!

💰 New balance: *${newBalance} tokens*

Ready to create amazing sticker packs! 🎨`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error handling successful payment:', error);
        await ctx.reply('Payment received but there was an error. Please contact support.');
    }
}
