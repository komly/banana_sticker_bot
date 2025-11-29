import { Context } from 'grammy';
import path from 'path';
import { userService } from '../db/user.service';
import { transactionService } from '../db/transaction.service';
import { downloadTelegramFile, ensureTempDir, cleanupFile } from '../utils/download';
import { stickerGeneratorService } from '../services/sticker-generator';
import { imageProcessorService } from '../services/image-processor';
import { telegramStickerService } from '../services/telegram-stickers';
import { replicateProcessorService } from '../services/replicate-processor';
import fs from 'fs';
import { config } from '../config'; // Added import for config

export async function handlePhoto(ctx: Context) {
    const userId = ctx.from?.id;
    const username = ctx.from?.username; // Added username

    if (!userId) {
        return;
    }

    try {
        // Check if user is in whitelist (unlimited generations for debugging)
        const isWhitelisted = username && config.whitelistUsernames.includes(username);

        // Check if user has tokens (skip for whitelisted users)
        if (!isWhitelisted) { // Wrapped token check
            const tokens = await userService.getUserTokens(userId);

            if (tokens < 1) {
                await ctx.reply(
                    '❌ You don\'t have enough tokens!\n\nUse /balance to buy more tokens.',
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🛒 Buy Tokens', callback_data: 'buy_tokens' }],
                            ],
                        },
                    }
                );
                return;
            }
        }

        // Send processing message
        const processingMsg = await ctx.reply(
            '⏳ Processing your photo...\n\n1️⃣ Downloading image...'
        );

        // Get the largest photo
        const photo = ctx.message?.photo?.pop();

        if (!photo) {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                processingMsg.message_id,
                '❌ No photo found. Please send a valid image.'
            );
            return;
        }

        // Download photo
        const tempDir = ensureTempDir();
        const photoPath = path.join(tempDir, `photo_${userId}_${Date.now()}.jpg`);

        await downloadTelegramFile(ctx.api, photo.file_id, photoPath);

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Processing your photo...\n\n1️⃣ ✅ Image downloaded\n2️⃣ Generating sticker grid with AI...\n\n⚠️ This may take 30-60 seconds'
        );

        // Generate sticker grid
        const photoBuffer = await fs.promises.readFile(photoPath);
        let gridImagePath = await stickerGeneratorService.generateStickerGrid(photoBuffer);

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Processing your photo...\n\n1️⃣ ✅ Image downloaded\n2️⃣ ✅ AI grid generated\n3️⃣ Enhancing quality (removing background + upscaling)...\n\n⚠️ This may take 30-60 seconds'
        );

        // Process entire grid (remove background + upscale) - much cheaper than processing 25 stickers separately!
        const gridBuffer = await fs.promises.readFile(gridImagePath);
        const processedGridBuffer = await replicateProcessorService.processStickerQuality(gridBuffer);

        // Save processed grid
        const processedGridPath = path.join(tempDir, `processed_grid_${userId}_${Date.now()}.png`);
        await fs.promises.writeFile(processedGridPath, processedGridBuffer);

        // Clean up original grid
        cleanupFile(gridImagePath);
        gridImagePath = processedGridPath;

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Processing your photo...\n\n1️⃣ ✅ Image downloaded\n2️⃣ ✅ AI grid generated\n3️⃣ ✅ Quality enhanced\n4️⃣ Cutting into 25 stickers...'
        );

        // Cut grid into 25 stickers
        const stickers = await imageProcessorService.cutGridIntoStickers(gridImagePath);

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Processing your photo...\n\n1️⃣ ✅ Image downloaded\n2️⃣ ✅ AI grid generated\n3️⃣ ✅ 25 stickers created\n4️⃣ Uploading to Telegram...\n\n⚠️ This may take 30-60 seconds'
        );

        // Create sticker pack
        // Get bot info to get username for sticker set name
        const botInfo = await ctx.api.getMe();
        const stickerSetName = telegramStickerService.generateStickerSetName(userId, botInfo.username);
        const stickerSetTitle = `My Stickers ${Date.now()}`;

        const stickerPackUrl = await telegramStickerService.createStickerSet(
            ctx.api,
            userId,
            stickerSetName,
            stickerSetTitle,
            stickers
        );

        // Deduct token (skip for whitelisted users)
        if (!isWhitelisted) {
            await userService.deductToken(userId);
            await transactionService.logSpend(userId);
        }

        const remainingTokens = isWhitelisted ? '∞' : await userService.getUserTokens(userId);

        // Send success message
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            `✅ *Your sticker pack is ready!*

🎉 [Click here to add stickers](${stickerPackUrl})

🪙 Remaining tokens: ${remainingTokens}`,
            {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✨ Add Sticker Pack', url: stickerPackUrl },
                        ],
                        (!isWhitelisted && remainingTokens === 0)
                            ? [{ text: '🛒 Buy More Tokens', callback_data: 'buy_tokens' }]
                            : [],
                    ].filter((row) => row.length > 0),
                },
            }
        );

        // Cleanup
        cleanupFile(photoPath);
        cleanupFile(gridImagePath);
    } catch (error) {
        console.error('Error in photo handler:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await ctx.reply(
            `❌ *Error generating sticker pack*\n\n${errorMessage}\n\nPlease try again or contact support.`,
            { parse_mode: 'Markdown' }
        );
    }
}
