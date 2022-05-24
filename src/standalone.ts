/**
 * PRE-requisite function.
 *
 * check env files and set module import method.
 */
import dotenv from "dotenv";
const envFound = dotenv.config();

if (envFound.error) {
  throw new Error(" Could't find .env file... ");
}

import moduleAlias from "module-alias";
moduleAlias.addAlias("@", __dirname);

/**
 * Main Loop here.
 */
import "reflect-metadata"; // We need this in order to use @Decorators
import BotGenerator from "@/singleton/bot";
import filterCommand from "@/commands";

const bot = BotGenerator.getInstance();

bot.on("message", async msg => {
  const chatId = msg.chat.id;
  if (msg.text.startsWith("/")) {
    const filteredMsg: string = await filterCommand(msg.text);
    bot.sendMessage(chatId, filteredMsg);
  }
});
