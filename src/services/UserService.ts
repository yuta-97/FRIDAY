import { Container } from "typedi";
import { Logger } from "pino";
import { UserModel, IUserDocument } from "@/models/User";
import { AppError } from "@/utils/errorHandler";

export class UserService {
  private logger: Logger;

  constructor() {
    this.logger = Container.get("logger");
  }

  async createUser(userData: {
    userId: string;
    userName: string;
    chatId: string;
    noti?: boolean;
  }): Promise<IUserDocument> {
    try {
      const existingUser = await UserModel.findOne({
        $or: [{ userId: userData.userId }, { chatId: userData.chatId }]
      });

      if (existingUser) {
        throw new AppError("User already exists", 409);
      }

      const user = new UserModel(userData);
      await user.save();

      this.logger.info(
        { userId: userData.userId },
        "User created successfully"
      );
      return user;
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to create user");
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUserDocument | null> {
    try {
      return await UserModel.findOne({ userId });
    } catch (error) {
      this.logger.error(
        { error: error.message, userId },
        "Failed to get user by ID"
      );
      throw new AppError("Failed to retrieve user", 500);
    }
  }

  async getUserByChatId(chatId: string): Promise<IUserDocument | null> {
    try {
      return await UserModel.findOne({ chatId });
    } catch (error) {
      this.logger.error(
        { error: error.message, chatId },
        "Failed to get user by chat ID"
      );
      throw new AppError("Failed to retrieve user", 500);
    }
  }

  async updateUser(
    userId: string,
    updateData: Partial<IUserDocument>
  ): Promise<IUserDocument | null> {
    try {
      const user = await UserModel.findOneAndUpdate({ userId }, updateData, {
        new: true,
        runValidators: true
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      this.logger.info({ userId }, "User updated successfully");
      return user;
    } catch (error) {
      this.logger.error(
        { error: error.message, userId },
        "Failed to update user"
      );
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.deleteOne({ userId });

      if (result.deletedCount === 0) {
        throw new AppError("User not found", 404);
      }

      this.logger.info({ userId }, "User deleted successfully");
      return true;
    } catch (error) {
      this.logger.error(
        { error: error.message, userId },
        "Failed to delete user"
      );
      throw error;
    }
  }
}
