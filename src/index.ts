import { createBot } from './bot';
import { prisma } from './db/prisma';

async function main() {
    console.log('🤖 Starting Telegram Sticker Bot...');

    // Test database connection
    try {
        await prisma.$connect();
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }

    // Create and start bot
    const bot = createBot();

    // Handle shutdown gracefully
    process.once('SIGINT', async () => {
        console.log('\n⏹️  Stopping bot...');
        await bot.stop();
        await prisma.$disconnect();
        process.exit(0);
    });

    process.once('SIGTERM', async () => {
        console.log('\n⏹️  Stopping bot...');
        await bot.stop();
        await prisma.$disconnect();
        process.exit(0);
    });

    // Start bot
    await bot.start({
        onStart: (botInfo) => {
            console.log(`✅ Bot started as @${botInfo.username}`);
            console.log('📸 Ready to create sticker packs!');
        },
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
