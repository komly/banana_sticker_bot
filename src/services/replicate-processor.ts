import Replicate from 'replicate';
import { config } from '../config';
import fs from 'fs';

export class ReplicateProcessorService {
    private replicate: Replicate;

    constructor() {
        this.replicate = new Replicate({
            auth: config.replicateApiToken,
        });
    }

    /**
     * Remove background from image using AI
     */
    async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
        try {
            console.log('Removing background...');

            // Convert buffer to base64 data URL
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            const output = await this.replicate.run(
                '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
                {
                    input: {
                        image: dataUrl,
                        format: 'png',
                        reverse: false,
                        threshold: 0,
                        background_type: 'rgba',
                    },
                }
            ) as any;

            // Download the result
            const resultUrl = typeof output === 'string' ? output : output.url();
            const response = await fetch(resultUrl);

            if (!response.ok) {
                throw new Error(`Failed to download result: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('Error removing background:', error);
            throw error;
        }
    }

    /**
     * Upscale image using Recraft Crisp Upscale
     */
    async upscaleImage(imageBuffer: Buffer): Promise<Buffer> {
        try {
            console.log('Upscaling image...');

            // Convert buffer to base64 data URL
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            const output = await this.replicate.run(
                'recraft-ai/recraft-crisp-upscale',
                {
                    input: {
                        image: dataUrl,
                    },
                }
            ) as any;

            // Download the result
            const resultUrl = typeof output === 'string' ? output : output.url();
            const response = await fetch(resultUrl);

            if (!response.ok) {
                throw new Error(`Failed to download result: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('Error upscaling image:', error);
            throw error;
        }
    }

    /**
     * Process single sticker: remove background then upscale
     */
    async processStickerQuality(imageBuffer: Buffer): Promise<Buffer> {
        try {
            // Step 1: Upscale
            const upscaled = await this.upscaleImage(imageBuffer);

            // Step 2: Remove background
            const noBg = await this.removeBackground(upscaled);


            return noBg;
        } catch (error) {
            console.error('Error processing sticker quality:', error);
            // Return original if processing fails
            return imageBuffer;
        }
    }
}

export const replicateProcessorService = new ReplicateProcessorService();
