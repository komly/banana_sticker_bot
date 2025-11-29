import { prisma } from './prisma';

export class TransactionService {
    async logPurchase(telegramId: number, amount: number, stars: number) {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'PURCHASE',
                amount,
                stars,
            },
        });
    }

    async logSpend(telegramId: number) {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'SPEND',
                amount: 1,
            },
        });
    }

    async getUserTransactions(telegramId: number) {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        return user?.transactions ?? [];
    }
}

export const transactionService = new TransactionService();
