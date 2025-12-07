import { User } from '../database/schemes/user-scheme.js';
import { Mix } from '../database/schemes/mix-scheme.js';
import { SoloTulpan } from '../database/schemes/soloTulpan-scheme.js';
import { GrowingProcess } from '../database/schemes/growingProcess-scheme.js';

export class Services {
  static async findOrCreateUser(ctx) {
    const tgId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name || '';

    try {
      let user = await User.findOne({ tgId });

      if (!user) {
        user = new User({
          tgId,
          username,
          firstName,
          lastName,
        });
        await user.save();
        console.log(`✅ Создан новый пользователь: ${firstName} (${tgId})`);
      }
      return user;
    } catch (error) {
      console.error('❌ Ошибка при работе с пользователем:', error);
      throw error;
    }
  }

  static async checkIsAdmin(userId) {
    const id = Number(userId);

    const user = await User.findOne({ tgId: id });

    return user.isAdmin === true;
  }

  static async addAdminRights(userId) {
    const user = await User.findOne({ tgId: userId });

    if (!user) return 'Пользователь не найден.';
    if (user.isAdmin == true) {
      return 'Пользователь уже администратор.';
    } else {
      const updateResult = await User.updateOne({ tgId: userId }, { $set: { isAdmin: true } });
      return updateResult;
    }
  }

  static async getAllUserIds() {
    try {
      const users = await User.find({}, 'tgId');
      return users.map((u) => u.tgId);
    } catch (error) {
      console.error('Ошибка при получении списка пользователей:', error);
      return [];
    }
  }

  static async getAllMixes() {
    try {
      const mixes = await Mix.find({}, 'id title description image');
      return mixes;
    } catch (error) {
      console.error('Ошибка при получении списка миксов:', error);
      return [];
    }
  }

  static async getMixById(id) {
    try {
      const mix = await Mix.findOne({ id });
      return mix;
    } catch (error) {
      console.error('Ошибка при получении микса по id:', error);
      return null;
    }
  }

  static async addNewMix(title, description, image) {
    try {
      const maxMix = await Mix.aggregate([
        { $addFields: { numericId: { $toInt: '$id' } } },
        { $sort: { numericId: -1 } },
        { $limit: 1 },
      ]);

      const nextId = maxMix.length > 0 ? (maxMix[0].numericId + 1).toString() : '1';

      const mix = new Mix({ id: nextId, title, description, image });
      await mix.save();
      return true;
    } catch (error) {
      console.error('Ошибка при добавлении нового микса:', error);
      return false;
    }
  }

  static async deleteMix(id) {
    const mix = await Mix.findOne({ id });
    if (!mix) {
      return null;
    } else {
      await mix.deleteOne();
      return true;
    }
  }

  static async getSoloTulpan() {
    try {
      const soloTulpan = await SoloTulpan.findOne({ id: '1' });
      if (!soloTulpan) {
        return null;
      }
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при получении данных однотонных тюльпанов:', error);
      return null;
    }
  }

  static async updateSoloTulpan(price, images, description) {
    try {
      let soloTulpan = await SoloTulpan.findOne({ id: '1' });
      if (!soloTulpan) {
        // Создаем новую запись, если её нет
        soloTulpan = new SoloTulpan({
          id: '1',
          price,
          images: Array.isArray(images) ? images : [images],
          description,
        });
      } else {
        soloTulpan.price = price;
        soloTulpan.images = Array.isArray(images) ? images : [images];
        soloTulpan.description = description;
      }
      await soloTulpan.save();
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при обновлении данных однотонных тюльпанов:', error);
      return null;
    }
  }

  static async createSoloTulpan(price, images, description) {
    try {
      const soloTulpan = new SoloTulpan({
        id: '1',
        price,
        images: Array.isArray(images) ? images : [images],
        description,
      });
      await soloTulpan.save();
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при создании записи однотонных тюльпанов:', error);
      return null;
    }
  }

  static async updateSoloTulpanPrice(price) {
    try {
      const soloTulpan = await SoloTulpan.findOne({ id: '1' });
      if (!soloTulpan) {
        return null;
      }
      soloTulpan.price = price;
      await soloTulpan.save();
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при обновлении цены однотонных тюльпанов:', error);
      return null;
    }
  }

  static async updateSoloTulpanDescription(description) {
    try {
      const soloTulpan = await SoloTulpan.findOne({ id: '1' });
      if (!soloTulpan) {
        return null;
      }
      soloTulpan.description = description;
      await soloTulpan.save();
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при обновлении описания однотонных тюльпанов:', error);
      return null;
    }
  }

  static async updateSoloTulpanImages(images) {
    try {
      const soloTulpan = await SoloTulpan.findOne({ id: '1' });
      if (!soloTulpan) {
        return null;
      }
      soloTulpan.images = Array.isArray(images) ? images : [images];
      await soloTulpan.save();
      return soloTulpan;
    } catch (error) {
      console.error('Ошибка при обновлении фото однотонных тюльпанов:', error);
      return null;
    }
  }

  static async getGrowingProcess() {
    try {
      const growingProcess = await GrowingProcess.findOne({ id: '1' });
      if (!growingProcess) {
        return null;
      }
      return growingProcess;
    } catch (error) {
      console.error('Ошибка при получении данных о процессе выращивания:', error);
      return null;
    }
  }

  static async updateGrowingProcess(image, title, text) {
    try {
      // Валидация: если image передан, он должен быть строкой (file_id)
      if (image !== undefined && typeof image !== 'string') {
        console.error('Ошибка: image должен быть строкой (file_id), получен:', typeof image);
        return null;
      }

      let growingProcess = await GrowingProcess.findOne({ id: '1' });
      if (!growingProcess) {
        growingProcess = new GrowingProcess({
          id: '1',
          image: image || '', // file_id (строка) или пустая строка
          title: title || '',
          text: text || '',
        });
      } else {
        if (image !== undefined) growingProcess.image = image; // file_id (строка)
        if (title !== undefined) growingProcess.title = title;
        if (text !== undefined) growingProcess.text = text;
      }
      await growingProcess.save();
      return growingProcess;
    } catch (error) {
      console.error('Ошибка при обновлении данных о процессе выращивания:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      return null;
    }
  }

  static async updateGrowingProcessImage(image) {
    try {
      // Валидация: image должен быть строкой (file_id), а не функцией
      if (typeof image !== 'string') {
        console.error('Ошибка: image должен быть строкой (file_id), получен:', typeof image);
        return null;
      }

      let growingProcess = await GrowingProcess.findOne({ id: '1' });
      if (!growingProcess) {
        // Создаем новую запись с дефолтными значениями, если её нет
        // Используем значения из textInfo как fallback
        growingProcess = new GrowingProcess({
          id: '1',
          image: image, // file_id (строка)
          title: '<b>Основные этапы выращивания тюльпанов 🌷.</b>',
          text: `<b>Этап 1. 🧅 Подготовка луковиц:</b>\n
  ● Отбираете самые здоровые и плотные луковицы без повреждений.
  ● Перед посадкой очищаете от лишних сухих чешуек.
  ● Для достижения лучшего результата перед посадкой замочить луковицы в слабом растворе марганцовки, на 10-15 минут.\n\n<b>Этап 2. 🪏 Посадка и уход:</b>\n
  ● Сажать тюльпаны нужно осенью в прохладную, рыхлую почву на глубину 2-3 высоты луковицы.
  ● Выбираете солнечное место с хорошим дренажем.
  ● Поливаете сразу после посадки и при необходимости — в период роста.
  ● Весной проводить рыхление, удаление сорняков, лёгкие подкормки.\n\n<b>Этап 3. 🌷 Формирование бутонов:</b>\n
  ● В период роста следить за влажностью — почва должна быть умеренно влажной, не нужно поливать слишком обильно.
  ● Следить за температурой. Температура должна быть около +12 - +16 °C. Такая температура обеспечивает формирование крепкого стебля и плотного бутона.
  ● Можно также вносить калийно-фосфорные удобрения для крепких бутонов.\n\n<b>Этап 4. 💐 Сбор и упаковка:</b>\n
  ● Срезать тюльпаны нужно в фазе полуокрашенного бутона (когда он ещё не полностью раскрыт).
  ● Срез делать рано утром или вечером, когда растения максимально упругие.
  ● После срезки поставить цветы в холодную воду или упаковывать сухим способом в холодильное хранение.
  ● Для транспортировки использовать плотную упаковку и поддерживать прохладную температуру.\n\n\n<b>Дополнительную информацию и ещё больше полезных советов можно узнать в нашем канале – @tulpanski🌷.</b>`,
        });
      } else {
        growingProcess.image = image; // file_id (строка)
      }
      await growingProcess.save();
      return growingProcess;
    } catch (error) {
      console.error('Ошибка при обновлении фото процесса выращивания:', error);
      console.error('Детали ошибки:', error.message, error.stack);
      return null;
    }
  }
}
