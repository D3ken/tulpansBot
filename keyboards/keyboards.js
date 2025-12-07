import { Keyboard, InlineKeyboard } from 'grammy';
import { Services } from '../utils/services.js';

export const start_kb = new Keyboard()
  .text('📖 Узнать о процессе выращивания')
  .row()
  .text('🔍 Ознакомиться с ассортиментом и ценами')
  .row()
  .text('💳 Сделать предзаказ')
  .row()
  .text('👤 Связаться с менеджером')
  .resized();

export const assort_inlineKb = new InlineKeyboard()
  .text('🌷 Однотонные тюльпаны', 'one_color_tulpans')
  .row()
  .text('💐 Миксы сортов', 'mix_sorts');

export const cancelButton_inlineKb = new InlineKeyboard().text('❌ Отмена', 'cancel');

export async function select_mix_inlineKb() {
  const keyboard = new InlineKeyboard();
  const mixes = await Services.getAllMixes();

  for (const mix of mixes) {
    keyboard.text(`Вариант ${mix.id}. ${mix.title}`, `option${mix.id}`).row();
  }

  keyboard.url('Составить индивидуальный микс 🎨', 'https://t.me/tulpanski1');

  return keyboard;
}

export const back_or_buy_inlineKb = new InlineKeyboard()
  .text('⬅️ Вернуться к миксам', 'back_to_mix_sorts')
  .row()
  .url('💳 Оформить заказ', 'https://t.me/tulpanski1');

export const back_to_menu = new InlineKeyboard()
  .text('⬅️ Вернуться к меню', 'back_to_menu')
  .row()
  .url('💳 Оформить заказ', 'https://t.me/tulpanski1');

export const admin_panel_inlineKb = new InlineKeyboard()
  .text('Добавить новую акцию/новость', 'add_new_event')
  .row()
  .text('Добавить нового админа', 'add_new_admin')
  .row()
  .text('Добавить новый микс', 'add_new_mix')
  .row()
  .text('Удалить микс', 'delete_mix')
  .row()
  .text('Изменить информацию однотонных тюльпанов', 'edit_solo_tulpan')
  .row()
  .text('Изменить фото процесса выращивания', 'edit_growing_process_image');

export const edit_solo_tulpan_inlineKb = new InlineKeyboard()
  .text('Изменить цену', 'edit_solo_tulpan_price')
  .row()
  .text('Изменить описание', 'edit_solo_tulpan_description')
  .row()
  .text('Изменить фото', 'edit_solo_tulpan_images')
  .row()
  .text('⬅️ Назад к админ панели', 'back_to_admin_panel');

export const contact_manager = new InlineKeyboard().url('👩‍💼 Связаться с менеджером', 'https://t.me/tulpanski1');
