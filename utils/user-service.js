import { User } from '../database/schemes/user-scheme.js';

export class UserService {
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
}
