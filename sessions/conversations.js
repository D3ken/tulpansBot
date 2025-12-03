import { InlineKeyboard } from 'grammy';
import { UserService } from '../utils/user-service.js';

export async function addAdmin(conversation, ctx) {
  const keyboard = new InlineKeyboard().text('Отмена', 'cancel_add_admin');

  await ctx.reply(
    'Пришлите ID пользователя (не username) которого хотите сделать администратором.\n\n' +
      'Чтобы узнать ID — пусть человек напишет боту /showMyId',
    {
      reply_markup: keyboard,
    }
  );

  while (true) {
    const result = await conversation.wait({
      for: ['message:text', 'callback_query:data'],
      maxMilliseconds: 10 * 60 * 1000,
    });

    if (result.update.callback_query?.data === 'cancel_add_admin') {
      await result.answerCallbackQuery();
      await result.editMessageText('Добавление администратора отменено.');
      return;
    }

    if (!result.message?.text) {
      await ctx.reply('Пришлите именно текст с ID:', { reply_markup: keyboard });
      continue;
    }

    const input = result.message.text.trim();
    const targetUserId = Number(input);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0 || targetUserId.toString() !== input) {
      await ctx.reply('Ошибка: ID должен быть положительным числом без пробелов и символов.\nПопробуйте снова:', {
        reply_markup: keyboard,
      });
      continue;
    }

    const updateResult = await UserService.addAdminRights(targetUserId);

    if (updateResult === 'Пользователь не найден.') {
      await ctx.reply('Пользователь с таким ID ещё не писал боту. Попросите его начать диалог с ботом.');
    } else if (updateResult === 'Пользователь уже администратор.') {
      await ctx.reply('У данного пользователя уже есть права администратора.');
    } else {
      await ctx.editMessageText(`Пользователь <code>${targetUserId}</code> теперь администратор!`, {
        parse_mode: 'HTML',
      });
    }

    return;
  }
}

export async function addNewEvent(connection, ctx) {
  const keyboard = new InlineKeyboard().text('Отмена', 'cancel_add_admin');

  await ctx.reply('');
}
