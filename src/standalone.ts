import * as dotenv from "dotenv";
dotenv.config();

// TODO: build 시에 import error 해결하기
import BotGenerator from "src/singleton/bot";
import filterCommand from "src/commands";

const bot = BotGenerator.getInstance();

bot.on("message", async msg => {
  const chatId = msg.chat.id;

  if (msg.text.startsWith("/")) {
    const filteredMsg: string = await filterCommand(msg.text);
    bot.sendMessage(chatId, filteredMsg);
  }
});
