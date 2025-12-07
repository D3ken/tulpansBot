import cron from 'node-cron';
import { Services } from './services.js';

export function scheduleNews(bot, redis) {
  cron.schedule('* * * * *', async () => {
    const keys = await redis.keys('news:*');
    if (keys.length === 0) return;

    const now = Date.now();

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;

      const news = JSON.parse(raw);

      if (news.scheduledAt <= now) {
        const deleted = await redis.del(key);
        if (deleted === 0) {
          console.log(`Новость ${key} уже была обработана другим процессом`);
          continue;
        }

        console.log(`Отправляем новость ${key}`);

        const userIds = await Services.getAllUserIds();

        for (const userId of userIds) {
          try {
            await bot.api.copyMessage(userId, news.message.chat_id, news.message.message_id);
          } catch (err) {}
        }

        console.log(`Новость ${key} успешно разослана и удалена`);
      }
    }
  });

  console.log('Планировщик отложенных рассылок запущен (по MongoDB)');
}
