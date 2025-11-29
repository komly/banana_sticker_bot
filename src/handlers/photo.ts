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
import { MyContext } from '../types';

export async function handlePhoto(ctx: MyContext) {
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
                    '❌ У вас недостаточно токенов!\n\nИспользуйте /balance чтобы купить больше токенов.',
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🛒 Купить токены', callback_data: 'buy_tokens' }],
                            ],
                        },
                    }
                );
                return;
            }
        }

        // Send processing message
        const processingMsg = await ctx.reply(
            '⏳ Обрабатываю ваше фото...\n\n1️⃣ Скачиваю изображение...'
        );

        // Get the largest photo
        const photo = ctx.message?.photo?.pop();

        if (!photo) {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                processingMsg.message_id,
                '❌ Фото не найдено. Пожалуйста, отправьте корректное изображение.'
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
            '⏳ Обрабатываю ваше фото...\n\n1️⃣ ✅ Изображение скачано\n2️⃣ Генерирую сетку стикеров с помощью ИИ...\n\n⚠️ Это может занять 30-60 секунд'
        );

        // Generate sticker grid
        const photoBuffer = await fs.promises.readFile(photoPath);
        let gridImagePath = await stickerGeneratorService.generateStickerGrid(photoBuffer);

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Обрабатываю ваше фото...\n\n1️⃣ ✅ Изображение скачано\n2️⃣ ✅ ИИ сетка сгенерирована\n3️⃣ Улучшаю качество (удаление фона + апскейл)...\n\n⚠️ Это может занять 30-60 секунд'
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
            '⏳ Обрабатываю ваше фото...\n\n1️⃣ ✅ Изображение скачано\n2️⃣ ✅ ИИ сетка сгенерирована\n3️⃣ ✅ Качество улучшено\n4️⃣ Нарезаю на 25 стикеров...'
        );

        // Cut grid into 25 stickers
        const stickers = await imageProcessorService.cutGridIntoStickers(gridImagePath);

        // Update status
        await ctx.api.editMessageText(
            ctx.chat!.id,
            processingMsg.message_id,
            '⏳ Обрабатываю ваше фото...\n\n1️⃣ ✅ Изображение скачано\n2️⃣ ✅ ИИ сетка сгенерирована\n3️⃣ ✅ Качество улучшено\n4️⃣ ✅ 25 стикеров создано\n5️⃣ Загружаю в Telegram...\n\n⚠️ Это может занять 30-60 секунд'
        );

        // Create sticker pack
        // Get bot info to get username for sticker set name
        const botInfo = await ctx.api.getMe();
        const stickerSetName = telegramStickerService.generateStickerSetName(userId, botInfo.username);
        const stickerSetTitle = `Мои Стикеры ${Date.now()}`;

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
            `✅ *Твой стикерпак готов!*

🎉 [Нажми сюда, чтобы добавить стикеры](${stickerPackUrl})

🪙 Осталось токенов: ${remainingTokens}`,
            {
                parse_mode: 'Markdown',
                link_preview_options: { is_disabled: true },
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✨ Добавить стикерпак', url: stickerPackUrl },
                        ],
                        (!isWhitelisted && remainingTokens === 0)
                            ? [{ text: '🛒 Купить больше токенов', callback_data: 'buy_tokens' }]
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
            `❌ *Ошибка генерации стикерпака*\n\n${errorMessage}\n\nПожалуйста, попробуйте снова или обратитесь в поддержку.`,
            { parse_mode: 'Markdown' }
        );
    }
}
