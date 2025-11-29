import { run } from '@grammyjs/runner';
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

    // Create bot
    const bot = createBot();

    // Initialize bot (fetch info)
    await bot.init();
    console.log(`✅ Bot started as @${bot.botInfo.username}`);
    console.log('📸 Ready to create sticker packs!');

    // Start runner for concurrent processing
    const runner = run(bot);

    // Handle shutdown gracefully
    const stopRunner = async () => {
        if (runner.isRunning()) {
            await runner.stop();
        }
        await prisma.$disconnect();
        process.exit(0);
    };

    process.once('SIGINT', async () => {
        console.log('\n⏹️  Stopping bot...');
        await stopRunner();
    });

    process.once('SIGTERM', async () => {
        console.log('\n⏹️  Stopping bot...');
        await stopRunner();
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
