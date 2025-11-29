export interface OpenRouterMessage {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: {
            url: string;
        };
    }>;
}

export interface OpenRouterResponse {
    choices: Array<{
        message: {
            content?: string;
            images?: Array<{
                image_url: {
                    url: string;
                };
            }>;
        };
    }>;
}

export interface StickerData {
    buffer: Buffer;
    emoji: string;
}

import { Context } from 'grammy';
import { HydrateFlavor } from '@grammyjs/hydrate';

export type MyContext = HydrateFlavor<Context>;
