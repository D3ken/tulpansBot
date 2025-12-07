import { Bot, GrammyError, HttpError, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { RedisAdapter } from '@grammyjs/storage-redis';
import { addAdmin } from './sessions/conversations.js';
import { addNewEvent } from './sessions/conversations.js';
import { addNewMix } from './sessions/conversations.js';
import { deleteMix } from './sessions/conversations.js';
import { editSoloTulpanPrice } from './sessions/conversations.js';
import { editSoloTulpanDescription } from './sessions/conversations.js';
import { editSoloTulpanImages } from './sessions/conversations.js';
import { editGrowingProcessImage } from './sessions/conversations.js';
import { initSoloTulpan } from './sessions/conversations.js';
import { preOrder } from './sessions/conversations.js';
import { scheduleNews } from './utils/scheduler.js';
import { setupHandlers } from './handlers/handlers.js';
import { Services } from './utils/services.js';
import { connectDB } from './database/db.js';
import { redis } from './utils/redis.js';
import 'dotenv/config';

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(
  session({
    initial: () => ({}),
    storage: new RedisAdapter({ instance: redis }),
  })
);

bot.use(conversations());
bot.use(createConversation(addAdmin, 'addAdmin'));
bot.use(createConversation(addNewEvent, 'addNewEvent'));
bot.use(createConversation(addNewMix, 'addNewMix'));
bot.use(createConversation(deleteMix, 'deleteMix'));
bot.use(createConversation(editSoloTulpanPrice, 'editSoloTulpanPrice'));
bot.use(createConversation(editSoloTulpanDescription, 'editSoloTulpanDescription'));
bot.use(createConversation(editSoloTulpanImages, 'editSoloTulpanImages'));
bot.use(createConversation(editGrowingProcessImage, 'editGrowingProcessImage'));
bot.use(createConversation(initSoloTulpan, 'initSoloTulpan'));
bot.use(createConversation(preOrder, 'preOrder'));
bot.use(hydrate());

scheduleNews(bot, redis);

bot.use(async (ctx, next) => {
  try {
    const user = await Services.findOrCreateUser(ctx);
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
