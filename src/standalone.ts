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
import Handler from "@/commands";
import TelegramBot from "node-telegram-bot-api";
import { config } from "@/configs";

const bot: TelegramBot = new TelegramBot(config.token, { polling: true });

async function startServer() {
  await require("./loaders").default();
  await Handler(bot);
  //
}

startServer();
