import mongoose, { Document, Schema } from "mongoose";

export interface IUser {
  userId: string;
  userName: string;
  chatId: string;
  noti: boolean;
}

export interface IUserDocument extends Omit<IUser, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    chatId: { type: String, required: true },
    noti: { type: Boolean, required: false, default: false }
  },
  {
    timestamps: true,
    collection: "users"
  }
);

// 인덱스 추가
UserSchema.index({ userId: 1 });
UserSchema.index({ userName: 1 });

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);

// 이전 형식 호환성을 위해 유지
export default {
  name: "UserModel",
  model: UserModel
};
