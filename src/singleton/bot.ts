import * as TelegramBot from "node-telegram-bot-api";

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.token;

export default class BotGenerator {
  private static instance: TelegramBot;

  private constructor() {
    //
  }

  public static getInstance() {
    if (!BotGenerator.instance) {
      BotGenerator.instance = new TelegramBot(token, { polling: true });
    }
    return BotGenerator.instance;
  }
}
