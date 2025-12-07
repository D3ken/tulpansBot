import { InlineKeyboard } from 'grammy';
import { Services } from '../utils/services.js';
import { redis } from '../utils/redis.js';

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

export async function addNewEvent(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_news');

  await ctx.reply('Пришлите новость для рассылки (можно фото, текст, видео, документ):', {
    reply_markup: cancelKb,
  });

  const contentMsg = await conversation.wait();
  if (contentMsg.callbackQuery?.data === 'cancel_news') {
    await contentMsg.answerCallbackQuery();
    return await contentMsg.editMessageText('Рассылка отменена.');
  }

  const messageToSend = contentMsg.message;

  await ctx.reply('Задайте дату и время публикации в формате:\n<code>12.12.2025 15:30</code>', {
    parse_mode: 'HTML',
    reply_markup: cancelKb,
  });

  let scheduledAt;

  while (true) {
    const dateMsg = await conversation.waitFor('message:text');
    if (dateMsg.message.text === '/cancel') {
      return await dateMsg.reply('Отменено.');
    }

    const match = dateMsg.message.text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{1,2}):(\d{2})$/);
    if (!match) {
      await dateMsg.reply('Неверный формат! Пример: <code>25.12.2025 14:30</code>', { parse_mode: 'HTML' });
      continue;
    }

    const [, day, month, year, hour, minute] = match;
    scheduledAt = new Date(+year, month - 1, +day, +hour, +minute);

    if (scheduledAt < new Date()) {
      await dateMsg.reply('Дата уже прошла! Выберите будущее время.');
      continue;
    }
    break;
  }

  const confirmKb = new InlineKeyboard().text('Отправить', 'confirm_news').row().text('Отмена', 'cancel_news');

  await ctx.reply(
    `Подтвердите рассылку:\n\n` + `Дата: <b>${scheduledAt.toLocaleString('ru-RU')}</b>\n\n` + `Сообщение:`,
    { reply_markup: confirmKb, parse_mode: 'HTML' }
  );

  await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, messageToSend.message_id);

  const confirm = await conversation.waitFor('callback_query:data');
  await confirm.answerCallbackQuery();

  if (confirm.callbackQuery.data === 'cancel_news') {
    return await confirm.editMessageText('Рассылка отменена.');
  }

  const newsId = Date.now().toString();
  const newsData = {
    message: {
      chat_id: messageToSend.chat.id,
      message_id: messageToSend.message_id,
    },
    scheduledAt: scheduledAt.getTime(),
    createdBy: ctx.from.id,
  };

  await redis.set(`news:${newsId}`, JSON.stringify(newsData), 'EX', 60 * 60 * 24 * 30);

  await confirm.editMessageText(`Рассылка запланирована на ${scheduledAt.toLocaleString('ru-RU')}!`);
}

export async function preOrder(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отменить', 'cancel_pre_order');
  const MANAGER_USERNAME = process.env.MANAGER_USERNAME;
  const addOption_kb = new InlineKeyboard()
    .text('Да', 'add_option')
    .row()
    .text('Нет', 'remove_option')
    .row()
    .text('Отменить', 'cancel_pre_order');

  await ctx.reply(
    'Введите название микса которое хотите выбрать, например "Нежная классика". Либо введите "Однотонные тюльпаны" если хотите заказать однотонные тюльпаны',
    {
      reply_markup: cancelKb,
    }
  );

  const mixNameResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (mixNameResult.update.callback_query?.data === 'cancel_pre_order') {
    await mixNameResult.answerCallbackQuery();
    await mixNameResult.editMessageText('Оформление предзаказа отменено.');
    return;
  }

  if (!mixNameResult.message?.text) {
    await ctx.reply('Пришлите именно текст с названием:', { reply_markup: cancelKb });
    return;
  }

  const mixName = mixNameResult.message.text.trim();

  await ctx.reply(
    'Введите количество тюльпанов которое хотите заказать, если заказываете микс введите количество букетов',
    {
      reply_markup: cancelKb,
    }
  );

  const quantityResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (quantityResult.update.callback_query?.data === 'cancel_pre_order') {
    await quantityResult.answerCallbackQuery();
    await quantityResult.editMessageText('Оформление предзаказа отменено.');
    return;
  }

  if (!quantityResult.message?.text) {
    await ctx.reply('Пришлите именно текст с количеством:', { reply_markup: cancelKb });
    return;
  }

  const quantity = quantityResult.message.text.trim();

  await ctx.reply('Отправьте контактные данные для связи (Имя, телефон)', {
    reply_markup: cancelKb,
  });

  const contactResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (contactResult.update.callback_query?.data === 'cancel_pre_order') {
    await contactResult.answerCallbackQuery();
    await contactResult.editMessageText('Оформление предзаказа отменено.');
    return;
  }

  if (!contactResult.message?.text) {
    await ctx.reply('Пришлите именно текст с контактными данными:', { reply_markup: cancelKb });
    return;
  }

  const contactData = contactResult.message.text.trim();
  await ctx.reply(
    'Хотите добавить упаковку?\n*Стоимость упаковки начинается с 50 руб, цена уточняется у менеджера после оформления предзаказа*',
    {
      reply_markup: addOption_kb,
    }
  );

  const addBoxRelult = await conversation.waitFor('callback_query:data');
  let addBox = '';

  if (addBoxRelult.update.callback_query?.data === 'add_option') {
    addBox = 'Да';
    await contactResult.answerCallbackQuery();
  } else if (addBoxRelult.update.callback_query?.data === 'remove_option') {
    addBox = 'Нет';
    await contactResult.answerCallbackQuery();
  } else if (addBoxRelult.update.callback_query?.data === 'cancel_pre_order') {
    await contactResult.answerCallbackQuery();
    await contactResult.editMessageText('Оформление предзаказа отменено.');
    return;
  }

  await ctx.reply('🚚 Хотите ли вы подключить услугу доставки?', {
    reply_markup: addOption_kb,
  });

  const addDeliveryResult = await conversation.waitFor('callback_query:data');

  let addDelivery = '';

  if (addDeliveryResult.update.callback_query?.data === 'add_option') {
    addDelivery = 'Да';
    await contactResult.answerCallbackQuery();
  } else if (addDeliveryResult.update.callback_query?.data === 'remove_option') {
    addDelivery = 'Нет';
    await contactResult.answerCallbackQuery();
  } else if (addDeliveryResult.update.callback_query?.data === 'cancel_pre_order') {
    await contactResult.answerCallbackQuery();
    await contactResult.editMessageText('Оформление предзаказа отменено.');
    return;
  }

  const preOrderMessage =
    `<b>📋 Новый предзаказ</b>\n\n` +
    `<b>Товар:</b> ${mixName}\n` +
    `<b>Количество:</b> ${quantity}\n` +
    `<b>Контактные данные:</b> ${contactData}\n\n` +
    `<b>Упаковка:</b> ${addBox}\n\n` +
    `<b>Доставка:</b> ${addDelivery}\n\n` +
    `<b>От пользователя:</b> @${ctx.from.username || ctx.from.first_name} (ID: ${ctx.from.id})`;

  const confirmKb = new InlineKeyboard().text('Готово', 'confirm_pre_order').row().text('Отменить', 'cancel_pre_order');

  const confirmMessage = await ctx.reply(preOrderMessage, {
    reply_markup: confirmKb,
    parse_mode: 'HTML',
  });

  const confirmResult = await conversation.wait({
    for: ['callback_query:data'],
  });

  if (confirmResult.update.callback_query?.data === 'cancel_pre_order') {
    await confirmResult.answerCallbackQuery();
    await ctx.api.editMessageText(ctx.chat.id, confirmMessage.message_id, 'Оформление предзаказа отменено.');
    return;
  }

  if (confirmResult.update.callback_query?.data === 'confirm_pre_order') {
    await confirmResult.answerCallbackQuery();

    try {
      await ctx.api.sendMessage(MANAGER_USERNAME, preOrderMessage, {
        parse_mode: 'HTML',
      });

      await ctx.api.editMessageText(
        ctx.chat.id,
        confirmMessage.message_id,
        '✅ Ваш предзаказ успешно отправлен менеджеру! С вами свяжутся в ближайшее время.'
      );
    } catch (error) {
      console.error('Ошибка при отправке сообщения менеджеру:', error);
      await ctx.api.editMessageText(
        ctx.chat.id,
        confirmMessage.message_id,
        '❌ Ошибка при отправке предзаказа. Попробуйте позже или свяжитесь с менеджером напрямую: @tulpanski1'
      );
    }
    return;
  }
}

export async function addNewMix(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_add_mix');

  await ctx.reply('Пришлите название микса, пример: "Нежная классика" - 25 шт', {
    reply_markup: cancelKb,
  });

  const titleResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (titleResult.update.callback_query?.data === 'cancel_add_mix') {
    await titleResult.answerCallbackQuery();
    await titleResult.editMessageText('Добавление микса отменено.');
    return;
  }

  if (!titleResult.message?.text) {
    await ctx.reply('Пришлите именно текст с названием:', { reply_markup: cancelKb });
    return;
  }

  const title = titleResult.message.text.trim();

  await ctx.reply(
    'Пришлите описание микса, пример:\n <b>Состав:</b>\n- Красные — 17\n- Белые — 16\n\n<b>Образ:</b> контрастный, выразительный.',
    {
      reply_markup: cancelKb,
      parse_mode: 'HTML',
    }
  );

  const descriptionResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (descriptionResult.update.callback_query?.data === 'cancel_add_mix') {
    await descriptionResult.answerCallbackQuery();
    await descriptionResult.editMessageText('Добавление микса отменено.');
    return;
  }

  if (!descriptionResult.message?.text) {
    await ctx.reply('Пришлите именно текст с описанием:', { reply_markup: cancelKb });
    return;
  }

  const description = descriptionResult.message.text.trim();

  await ctx.reply('Пришлите фото микса, если нет фото, отправьте "нет"', {
    reply_markup: cancelKb,
  });

  const imageResult = await conversation.wait({
    for: ['message', 'callback_query:data'],
  });

  if (imageResult.update.callback_query?.data === 'cancel_add_mix') {
    await imageResult.answerCallbackQuery();
    await imageResult.editMessageText('Добавление микса отменено.');
    return;
  }

  let image = null;

  if (imageResult.message?.text && imageResult.message.text.trim() === 'нет') {
    image = null;
  } else if (imageResult.message?.photo) {
    image = imageResult.message.photo[imageResult.message.photo.length - 1].file_id;
  } else {
    await ctx.reply('Ошибка при добавлении микса. Нужно отправить фото или "нет".', {
      reply_markup: cancelKb,
    });
    return;
  }

  const result = await Services.addNewMix(title, description, image);
  if (!result) {
    return await ctx.editMessageText('Ошибка при добавлении микса.');
  } else {
    return await ctx.editMessageText('Микс добавлен успешно!', {
      reply_markup: new InlineKeyboard()
        .text('Добавить ещё микс', 'add_new_mix')
        .row()
        .text('Перейти к миксам', 'back_to_mix_sorts'),
    });
  }
}

export async function deleteMix(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_delete_mix');

  await ctx.reply('Пришлите номер варианта микса который хотите удалить. (например: 1)', {
    reply_markup: cancelKb,
  });

  const deleteIdResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (deleteIdResult.update.callback_query?.data === 'cancel_delete_mix') {
    await deleteIdResult.answerCallbackQuery();
    await deleteIdResult.editMessageText('Удаление микса отменено.');
    return;
  }

  if (!deleteIdResult.message?.text) {
    await ctx.reply('Пришлите именно текст с номером микса:', { reply_markup: cancelKb });
    return;
  }

  const mixId = deleteIdResult.message.text.trim();

  const mix = await Services.getMixById(mixId);
  if (!mix) {
    await ctx.reply(`Микс с номером ${mixId} не найден в базе данных.`, {
      reply_markup: cancelKb,
    });
    return;
  }

  const confirmKb = new InlineKeyboard()
    .text('Да', `confirm_delete_mix_${mixId}`)
    .row()
    .text('Отмена', 'cancel_delete_mix');

  const confirmMessage = await ctx.reply(`Вы точно хотите удалить микс номер ${mixId}?`, {
    reply_markup: confirmKb,
  });

  const confirmResult = await conversation.wait({
    for: ['callback_query:data'],
  });

  if (confirmResult.update.callback_query?.data === 'cancel_delete_mix') {
    await confirmResult.answerCallbackQuery();
    await ctx.api.editMessageText(ctx.chat.id, confirmMessage.message_id, 'Удаление микса отменено.');
    return;
  }

  if (confirmResult.update.callback_query?.data === `confirm_delete_mix_${mixId}`) {
    await confirmResult.answerCallbackQuery();

    const deleteResult = await Services.deleteMix(mixId);

    if (deleteResult) {
      await ctx.api.editMessageText(ctx.chat.id, confirmMessage.message_id, `Микс номер ${mixId} успешно удален!`);
    } else {
      await ctx.api.editMessageText(ctx.chat.id, confirmMessage.message_id, 'Ошибка при удалении микса.');
    }
    return;
  }
}

export async function editSoloTulpanPrice(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_edit_solo_tulpan_price');

  await ctx.reply('Пришлите новую цену за один тюльпан (только число, например: 10)', {
    reply_markup: cancelKb,
  });

  const priceResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (priceResult.update.callback_query?.data === 'cancel_edit_solo_tulpan_price') {
    await priceResult.answerCallbackQuery();
    await priceResult.editMessageText('Изменение цены отменено.');
    return;
  }

  if (!priceResult.message?.text) {
    await ctx.reply('Пришлите именно текст с ценой:', { reply_markup: cancelKb });
    return;
  }

  const priceText = priceResult.message.text.trim();
  const price = parseFloat(priceText);

  if (isNaN(price) || price <= 0) {
    await ctx.reply('Ошибка: цена должна быть положительным числом. Попробуйте снова:', {
      reply_markup: cancelKb,
    });
    return;
  }

  const result = await Services.updateSoloTulpanPrice(price);
  if (!result) {
    return await ctx.reply('Ошибка при обновлении цены. Убедитесь, что данные однотонных тюльпанов существуют в базе.');
  } else {
    return await ctx.reply(`Цена успешно обновлена! Новая цена: ${price} руб.`);
  }
}

export async function editSoloTulpanDescription(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_edit_solo_tulpan_description');

  await ctx.reply(
    'Пришлите новое описание однотонных тюльпанов. Пример:\n<b>🌷 Однотонные тюльпаны 🌷</b>\n❤️<b>Красные</b>❤️\n💛<b>Жёлтые</b>💛\n🩷<b>Розовые</b>🩷\n\n<b>Цена:</b>\n1 тюльпан - 10 руб\n\n<b>Для уточнения цен или заказа пишите нашему менеджеру – @tulpanski1🌷</b>',
    {
      reply_markup: cancelKb,
      parse_mode: 'HTML',
    }
  );

  const descriptionResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (descriptionResult.update.callback_query?.data === 'cancel_edit_solo_tulpan_description') {
    await descriptionResult.answerCallbackQuery();
    await descriptionResult.editMessageText('Изменение описания отменено.');
    return;
  }

  if (!descriptionResult.message?.text) {
    await ctx.reply('Пришлите именно текст с описанием:', { reply_markup: cancelKb });
    return;
  }

  const description = descriptionResult.message.text.trim();

  const result = await Services.updateSoloTulpanDescription(description);
  if (!result) {
    return await ctx.reply(
      'Ошибка при обновлении описания. Убедитесь, что данные однотонных тюльпанов существуют в базе.'
    );
  } else {
    return await ctx.reply('Описание успешно обновлено!');
  }
}

export async function editSoloTulpanImages(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_edit_solo_tulpan_images');

  await ctx.reply(
    'Пришлите фото однотонных тюльпанов. Можно отправить несколько фото за раз (медиа-группой) или по одному. После отправки всех фото напишите "готово" или нажмите кнопку "Готово".',
    {
      reply_markup: new InlineKeyboard()
        .text('Готово', 'finish_edit_solo_tulpan_images')
        .row()
        .text('Отмена', 'cancel_edit_solo_tulpan_images'),
    }
  );

  const images = [];

  while (true) {
    const imageResult = await conversation.wait({
      for: ['message', 'callback_query:data'],
    });

    if (imageResult.update.callback_query?.data === 'cancel_edit_solo_tulpan_images') {
      await imageResult.answerCallbackQuery();
      await imageResult.editMessageText('Изменение фото отменено.');
      return;
    }

    if (imageResult.update.callback_query?.data === 'finish_edit_solo_tulpan_images') {
      await imageResult.answerCallbackQuery();
      if (images.length === 0) {
        await ctx.reply('Вы не отправили ни одного фото. Попробуйте снова или отмените операцию.', {
          reply_markup: cancelKb,
        });
        continue;
      }
      break;
    }

    if (imageResult.message?.text && imageResult.message.text.trim().toLowerCase() === 'готово') {
      if (images.length === 0) {
        await ctx.reply('Вы не отправили ни одного фото. Попробуйте снова или отмените операцию.', {
          reply_markup: cancelKb,
        });
        continue;
      }
      break;
    }

    if (imageResult.message?.photo) {
      const fileId = imageResult.message.photo[imageResult.message.photo.length - 1].file_id;
      images.push(fileId);
      await ctx.reply(`Фото добавлено! (${images.length} фото). Отправьте ещё фото или напишите "готово".`, {
        reply_markup: new InlineKeyboard()
          .text('Готово', 'finish_edit_solo_tulpan_images')
          .row()
          .text('Отмена', 'cancel_edit_solo_tulpan_images'),
      });
    } else if (imageResult.message?.text) {
      await ctx.reply('Пожалуйста, отправьте фото или напишите "готово" для завершения.', {
        reply_markup: new InlineKeyboard()
          .text('Готово', 'finish_edit_solo_tulpan_images')
          .row()
          .text('Отмена', 'cancel_edit_solo_tulpan_images'),
      });
    }
  }

  const result = await Services.updateSoloTulpanImages(images);
  if (!result) {
    return await ctx.reply('Ошибка при обновлении фото. Убедитесь, что данные однотонных тюльпанов существуют в базе.');
  } else {
    return await ctx.reply(`Фото успешно обновлено! Загружено ${images.length} фото.`);
  }
}

export async function editGrowingProcessImage(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_edit_growing_process_image');

  await ctx.reply('Пришлите новое фото для процесса выращивания тюльпанов:', {
    reply_markup: cancelKb,
  });

  const imageResult = await conversation.wait({
    for: ['message', 'callback_query:data'],
  });

  if (imageResult.update.callback_query?.data === 'cancel_edit_growing_process_image') {
    await imageResult.answerCallbackQuery();
    await imageResult.editMessageText('Изменение фото отменено.');
    return;
  }

  if (!imageResult.message?.photo) {
    await ctx.reply('Пожалуйста, отправьте фото:', { reply_markup: cancelKb });
    return;
  }

  const fileId = imageResult.message.photo[imageResult.message.photo.length - 1].file_id;

  try {
    const result = await Services.updateGrowingProcessImage(fileId);
    if (!result) {
      return await ctx.reply(
        'Ошибка при обновлении фото. Убедитесь, что данные о процессе выращивания существуют в базе.'
      );
    } else {
      return await ctx.reply('Фото успешно обновлено!');
    }
  } catch (error) {
    console.error('Ошибка в editGrowingProcessImage:', error);
    return await ctx.reply(`Ошибка при обновлении фото: ${error.message}`);
  }
}

export async function initSoloTulpan(conversation, ctx) {
  const cancelKb = new InlineKeyboard().text('Отмена', 'cancel_init_solo_tulpan');

  await ctx.reply(
    'Данные об однотонных тюльпанах не найдены в базе данных.\n\nДля инициализации нужно:\n1. Отправить фото (можно несколько)\n2. Указать цену\n3. Указать описание\n\nНачнем с фото. Отправьте фото однотонных тюльпанов (можно несколько фото за раз или по одному). После отправки всех фото напишите "готово" или нажмите кнопку "Готово".',
    {
      reply_markup: new InlineKeyboard()
        .text('Готово', 'finish_init_solo_tulpan_images')
        .row()
        .text('Отмена', 'cancel_init_solo_tulpan'),
    }
  );

  const images = [];

  while (true) {
    const imageResult = await conversation.wait({
      for: ['message', 'callback_query:data'],
    });

    if (imageResult.update.callback_query?.data === 'cancel_init_solo_tulpan') {
      await imageResult.answerCallbackQuery();
      await imageResult.editMessageText('Инициализация отменена.');
      return;
    }

    if (imageResult.update.callback_query?.data === 'finish_init_solo_tulpan_images') {
      await imageResult.answerCallbackQuery();
      if (images.length === 0) {
        await ctx.reply('Вы не отправили ни одного фото. Попробуйте снова или отмените операцию.', {
          reply_markup: cancelKb,
        });
        continue;
      }
      break;
    }

    if (imageResult.message?.text && imageResult.message.text.trim().toLowerCase() === 'готово') {
      if (images.length === 0) {
        await ctx.reply('Вы не отправили ни одного фото. Попробуйте снова или отмените операцию.', {
          reply_markup: cancelKb,
        });
        continue;
      }
      break;
    }

    if (imageResult.message?.photo) {
      const fileId = imageResult.message.photo[imageResult.message.photo.length - 1].file_id;
      images.push(fileId);
      await ctx.reply(`Фото добавлено! (${images.length} фото). Отправьте ещё фото или напишите "готово".`, {
        reply_markup: new InlineKeyboard()
          .text('Готово', 'finish_init_solo_tulpan_images')
          .row()
          .text('Отмена', 'cancel_init_solo_tulpan'),
      });
    } else if (imageResult.message?.text) {
      await ctx.reply('Пожалуйста, отправьте фото или напишите "готово" для завершения.', {
        reply_markup: new InlineKeyboard()
          .text('Готово', 'finish_init_solo_tulpan_images')
          .row()
          .text('Отмена', 'cancel_init_solo_tulpan'),
      });
    }
  }

  await ctx.reply('Отлично! Теперь укажите цену за один тюльпан (только число, например: 10)', {
    reply_markup: cancelKb,
  });

  const priceResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (priceResult.update.callback_query?.data === 'cancel_init_solo_tulpan') {
    await priceResult.answerCallbackQuery();
    await priceResult.editMessageText('Инициализация отменена.');
    return;
  }

  if (!priceResult.message?.text) {
    await ctx.reply('Пришлите именно текст с ценой:', { reply_markup: cancelKb });
    return;
  }

  const priceText = priceResult.message.text.trim();
  const price = parseFloat(priceText);

  if (isNaN(price) || price <= 0) {
    await ctx.reply('Ошибка: цена должна быть положительным числом. Попробуйте снова:', {
      reply_markup: cancelKb,
    });
    return;
  }

  await ctx.reply(
    'Теперь пришлите описание однотонных тюльпанов. Пример:\n<b>🌷 Однотонные тюльпаны 🌷</b>\n❤️<b>Красные</b>❤️\n💛<b>Жёлтые</b>💛\n🩷<b>Розовые</b>🩷\n\n<b>Цена:</b>\n1 тюльпан - 10 руб\n\n<b>Для уточнения цен или заказа пишите нашему менеджеру – @tulpanski1🌷</b>',
    {
      reply_markup: cancelKb,
      parse_mode: 'HTML',
    }
  );

  const descriptionResult = await conversation.wait({
    for: ['message:text', 'callback_query:data'],
  });

  if (descriptionResult.update.callback_query?.data === 'cancel_init_solo_tulpan') {
    await descriptionResult.answerCallbackQuery();
    await descriptionResult.editMessageText('Инициализация отменена.');
    return;
  }

  if (!descriptionResult.message?.text) {
    await ctx.reply('Пришлите именно текст с описанием:', { reply_markup: cancelKb });
    return;
  }

  const description = descriptionResult.message.text.trim();

  const result = await Services.updateSoloTulpan(price, images, description);
  if (!result) {
    return await ctx.reply('Ошибка при создании записи в базе данных.');
  } else {
    return await ctx.reply(
      `✅ Данные об однотонных тюльпанах успешно инициализированы!\n\nЗагружено фото: ${images.length}\nЦена: ${price} руб\n\nТеперь при нажатии на кнопку "Однотонные тюльпаны" информация будет выводиться из базы данных.`
    );
  }
}
