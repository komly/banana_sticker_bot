import sharp from 'sharp';
import { config } from '../config';
import { StickerData } from '../types';

const EMOJI_LIST = [
    '😊', '🤩', '😮', '🤔', '😤',
    '😢', '😭', '😂', '🤦', '😳',
    '😴', '😎', '😕', '😏', '😱',
    '😟', '💪', '👍', '👎', '👋',
    '😉', '😐', '👌', '💖', '🎉'
];

export class ImageProcessorService {
    async cutGridIntoStickers(gridImagePath: string): Promise<StickerData[]> {
        try {
            console.log('Loading grid image...');

            // Load the image
            const image = sharp(gridImagePath);
            const metadata = await image.metadata();

            if (!metadata.width || !metadata.height) {
                throw new Error('Could not read image dimensions');
            }

            console.log(`Grid dimensions: ${metadata.width}x${metadata.height}`);

            // Calculate dimensions for each sticker (5x5 grid)
            const stickerWidth = Math.floor(metadata.width / 5);
            const stickerHeight = Math.floor(metadata.height / 5);

            console.log(`Each sticker: ${stickerWidth}x${stickerHeight}`);

            const stickers: StickerData[] = [];

            // Cut the grid into 25 individual stickers
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const index = row * 5 + col;

                    console.log(`Cutting sticker ${index + 1}/25...`);

                    // Extract this section of the grid
                    const left = col * stickerWidth;
                    const top = row * stickerHeight;

                    let stickerBuffer = await sharp(gridImagePath)
                        .extract({
                            left,
                            top,
                            width: stickerWidth,
                            height: stickerHeight,
                        })
                        .resize(config.stickerSize, config.stickerSize, {
                            fit: 'contain',
                            background: { r: 0, g: 0, b: 0, alpha: 0 },
                        })
                        .png()
                        .toBuffer();

                    // Check file size and compress if needed
                    if (stickerBuffer.length > config.maxStickerFileSize) {
                        console.log(`Sticker ${index + 1} too large, compressing...`);
                        stickerBuffer = await sharp(stickerBuffer)
                            .png({ quality: 80, compressionLevel: 9 })
                            .toBuffer();
                    }

                    stickers.push({
                        buffer: stickerBuffer,
                        emoji: EMOJI_LIST[index],
                    });
                }
            }

            console.log(`Successfully created ${stickers.length} stickers`);

            return stickers;
        } catch (error) {
            console.error('Error cutting grid into stickers:', error);
            throw error;
        }
    }
}

export const imageProcessorService = new ImageProcessorService();
