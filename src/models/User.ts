import mongoose, { Document, Schema } from "mongoose";

export interface IUser {
  userId: string;
  username: string;
  chatId: string;
  mealId: string;
  mealPW: string;
}

export interface IUserDocument extends Omit<IUser, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    username: { type: String, required: true },
    chatId: { type: String, required: true },
    mealId: { type: String, required: false },
    mealPW: { type: String, required: false }
  },
  {
    timestamps: true,
    collection: "users"
  }
);

// 인덱스 추가
UserSchema.index({ chatId: 1 });
UserSchema.index({ username: 1 });

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);

// 이전 형식 호환성을 위해 유지
export default {
  name: "UserModel",
  model: UserModel
};
