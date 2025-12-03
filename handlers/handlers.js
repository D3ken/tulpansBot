import { InputMediaBuilder } from 'grammy';
import * as keyboards from '../keyboards/keyboards.js';
import * as textInfo from '../assets/info/textInfo.js';
import { adminID } from '../admins.js';
import { UserService } from '../utils/user-service.js';

function handCommands(bot) {
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '<b>Привет!</b>\nЯ — бот канала @tulpanski.\nПомогу узнать всё о выращивании и продаже свежих тюльпанов к 8 марта в Петрозаводске.',
      { parse_mode: 'HTML' }
    );
    await ctx.reply('Выберите, что вас интересует в меню 👇', { reply_markup: keyboards.start_kb });
  });

  bot.command('admin', async (ctx) => {
    if (adminID.includes(ctx.from.id) || UserService.checkIsAdmin(ctx.from.id)) {
      await ctx.reply('<b>Вы попали в админ панель.</b>\n\nВыберите действие которое хотите сделать 👇', {
        reply_markup: keyboards.admin_panel_inlineKb,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply('У вас нет прав администратора.');
    }
  });

  bot.command('showMyId', async (ctx) => {
    await ctx.reply(ctx.from.id);
  });
}

function handMessages(bot) {
  bot.hears('📖 Узнать о процессе выращивания', async (ctx) => {
    await ctx.replyWithPhoto(textInfo.growingProcess.image(), {
      caption: textInfo.growingProcess.title,
      parse_mode: 'HTML',
    });
    await ctx.reply(`${textInfo.growingProcess.text}`, {
      parse_mode: 'HTML',
    });
  });

  bot.hears('🔍 Ознакомиться с ассортиментом и ценами', async (ctx) => {
    await ctx.reply('📒 <b>Ассортимент товаров и цен.</b>\nВыберите что вас инетерсует 👇', {
      reply_markup: keyboards.assort_inlineKb,
      parse_mode: 'HTML',
    });
  });

  bot.hears('👤 Связаться с менеджером', async (ctx) => {
    await ctx.reply('<b>Вы можете связаться с менеджером: @tulpanski1👤\nЛибо нажав на кнопку ниже .</b>', {
      reply_markup: keyboards.cancelButton_inlineKb,
      parse_mode: 'HTML',
    });
  });
}

function handCallbacks(bot) {
  bot.callbackQuery('one_color_tulpans', async (ctx) => {
    await ctx.replyWithMediaGroup([
      InputMediaBuilder.photo(textInfo.assortimentInfo.image1(), {
        caption: textInfo.assortimentInfo.text,
        parse_mode: 'HTML',
      }),
      InputMediaBuilder.photo(textInfo.assortimentInfo.image2()),
      InputMediaBuilder.photo(textInfo.assortimentInfo.image3()),
    ]);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
  });

  bot.callbackQuery('mix_sorts', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('<b>В меню вы можете выбрать один из готовых миксов, либо составить индивидуальный микс 👇</b>', {
      reply_markup: keyboards.select_mix_inlineKb,
      parse_mode: 'HTML',
    });
  });

  bot.callbackQuery(/^option\d+$/, async (ctx) => {
    const optionId = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();
    await ctx.replyWithPhoto(textInfo.mixSorts[optionId].image(), {
      caption: textInfo.mixSorts[optionId].text,
      reply_markup: keyboards.back_or_buy_inlineKb,
      parse_mode: 'HTML',
    });
    await ctx.deleteMessage();
  });

  bot.callbackQuery('back_to_mix_sorts', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
    await ctx.reply('<b>В меню вы можете выбрать один из готовых миксов, либо составить индивидуальный микс 👇</b>', {
      reply_markup: keyboards.select_mix_inlineKb,
      parse_mode: 'HTML',
    });
  });

  bot.callbackQuery('add_new_admin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter('addAdmin');
  });
}

export function setupHandlers(bot) {
  handCommands(bot);
  handMessages(bot);
  handCallbacks(bot);
}
