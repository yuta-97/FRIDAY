import mongoose from "mongoose";

interface IUser {
  id: string;
  username: string;
  chatId: string;
  mealId: string;
  mealPW: string;
}

const User = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    username: String,
    chatId: String,
    mealId: String,
    mealPW: String
  },
  { timestamps: true }
);

export default {
  name: "User",
  model: mongoose.model<IUser & mongoose.Document>("User", User, "User")
};
