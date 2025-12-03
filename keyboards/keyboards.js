import { Keyboard, InlineKeyboard } from 'grammy';

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
  .text('💐 Миксы сортов', 'mix_sorts')
  .row()
  .text('🎁 Подарочная упаковка', 'gift_wrap')
  .row()
  .text('🚚 Опции доставки и самовывоза', 'delivery_pickup');

export const cancelButton_inlineKb = new InlineKeyboard().text('❌ Отмена', 'cancel');

export const select_mix_inlineKb = new InlineKeyboard()
  .text('Вариант 1. «Нежная классика» — 25 шт', 'option1')
  .row()
  .text('Вариант 2. «Солнечный микс» — 35 шт', 'option2')
  .row()
  .text('Вариант 3. «Радуга весны» — 51 шт', 'option3')
  .row()
  .text('Вариант 4. «Пионовидная роскошь» — 31 шт', 'option4')
  .row()
  .text('Вариант 5. «Сканди-микс» — 29 шт', 'option5')
  .row()
  .text('Вариант 6. «Попугайный акцент» — 19 шт', 'option6')
  .row()
  .text('Вариант 7. «Два сердца» — 33 шт', 'option7')
  .row()
  .text('Вариант 8. «Белоснежный шик» — 25 шт', 'option8')
  .row()
  .url('Составить индивидуальный микс 🎨', 'https://t.me/tulpanski1');

export const back_or_buy_inlineKb = new InlineKeyboard()
  .text('⬅️ Вернуться к миксам', 'back_to_mix_sorts')
  .row()
  .url('💳 Оформить заказ', 'https://t.me/tulpanski1');

export const admin_panel_inlineKb = new InlineKeyboard()
  .text('Добавить новую акцию/новость', 'add_new_event')
  .row()
  .text('Добавить нового админа', 'add_new_admin');
