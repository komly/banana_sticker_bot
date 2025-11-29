import { prisma } from './prisma';
import { config } from '../config';

export class UserService {
    async getOrCreateUser(telegramId: number, username?: string) {
        let user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: BigInt(telegramId),
                    username,
                    tokens: config.defaultTokens,
                },
            });
        }

        return user;
    }

    async getUserTokens(telegramId: number): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });

        return user?.tokens ?? 0;
    }

    async deductToken(telegramId: number): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { telegramId: BigInt(telegramId) },
            });

            if (!user || user.tokens < 1) {
                return false;
            }

            await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { tokens: { decrement: 1 } },
            });

            return true;
        } catch (error) {
            console.error('Error deducting token:', error);
            return false;
        }
    }

    async addTokens(telegramId: number, amount: number): Promise<void> {
        await prisma.user.update({
            where: { telegramId: BigInt(telegramId) },
            data: { tokens: { increment: amount } },
        });
    }

    async getUser(telegramId: number) {
        return prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });
    }
}

export const userService = new UserService();
