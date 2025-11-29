import { Api, InputFile } from 'grammy';
import { StickerData } from '../types';

export class TelegramStickerService {
    async createStickerSet(
        api: Api,
        userId: number,
        name: string,
        title: string,
        stickers: StickerData[]
    ): Promise<string> {
        try {
            console.log('Creating sticker set...');

            if (stickers.length === 0) {
                throw new Error('No stickers provided');
            }

            // Create the sticker set with the first sticker
            const firstSticker = new InputFile(stickers[0].buffer, 'sticker.png');

            await api.createNewStickerSet(userId, name, title, [
                {
                    sticker: firstSticker,
                    format: 'static',
                    emoji_list: [stickers[0].emoji],
                },
            ]);

            console.log('Sticker set created, adding remaining stickers...');

            // Add the remaining stickers
            for (let i = 1; i < stickers.length; i++) {
                console.log(`Adding sticker ${i + 1}/${stickers.length}...`);

                const stickerFile = new InputFile(stickers[i].buffer, 'sticker.png');

                await api.addStickerToSet(userId, name, {
                    sticker: stickerFile,
                    format: 'static',
                    emoji_list: [stickers[i].emoji],
                });

                // Add a small delay to avoid rate limiting
                await this.delay(100);
            }

            console.log('All stickers added successfully');

            const stickerPackUrl = `https://t.me/addstickers/${name}`;
            return stickerPackUrl;
        } catch (error) {
            console.error('Error creating sticker set:', error);
            throw error;
        }
    }

    generateStickerSetName(userId: number, botUsername: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7);
        // Telegram requires sticker set names to end with _by_<bot_username>
        return `s${userId}_${timestamp}_${random}_by_${botUsername}`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const telegramStickerService = new TelegramStickerService();
