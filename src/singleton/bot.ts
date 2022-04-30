import TelegramBot from "node-telegram-bot-api";
import { config } from "@/configs";

export default class BotGenerator {
  private static instance: TelegramBot;

  private constructor() {
    //
  }

  public static getInstance() {
    if (!BotGenerator.instance) {
      BotGenerator.instance = new TelegramBot(config.token, { polling: true });
    }
    return BotGenerator.instance;
  }
}
