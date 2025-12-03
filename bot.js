import { Bot, GrammyError, HttpError } from 'grammy';
import { setupHandlers } from './handlers/handlers.js';
import { connectDB } from './database/db.js';
import { UserService } from './utils/user-service.js';
import { conversations, createConversation } from '@grammyjs/conversations';
import { addAdmin } from './sessions/conversations.js';
// import { IORedis } from 'ioredis';
import 'dotenv/config';

// const redis = new IORedis({
//   host: 'localhost',
//   port: 6379,
// });

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(addAdmin, 'addAdmin'));

bot.use(async (ctx, next) => {
  try {
    const user = await UserService.findOrCreateUser(ctx);
    ctx.user = user;
    await next();
  } catch (error) {
    console.error('❌ Ошибка в middleware пользователя:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке вашего профиля. Попробуйте позже.');
  }
});

setupHandlers(bot);

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Ошибка в запросе:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Не удалось связаться с Telegram:', e);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
});

async function startBot() {
  try {
    await connectDB();
    await bot.start();
    console.log('✅ Бот запущен');
  } catch (error) {
    console.error('❌ Ошибка при запуске бота:', error);
    process.exit(1);
  }
}

startBot();

process.once('SIGINT', () => {
  console.log('🛑 Бот остановлен (SIGINT)');
  bot.stop();
});

process.once('SIGTERM', () => {
  console.log('🛑 Бот остановлен (SIGTERM)');
  bot.stop();
});
