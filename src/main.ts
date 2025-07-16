/**
 * PRE-requisite function.
 *
 * check env files and set module import method.
 */
import dotenv from "dotenv";
const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("Couldn't find .env file...");
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
import { setupGlobalErrorHandlers, handleError } from "@/utils/errorHandler";

// 전역 에러 핸들러 설정
setupGlobalErrorHandlers();

// 텔레그램 봇 생성 함수
function createBot(): TelegramBot {
  return new TelegramBot(config.telegramToken, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });
}

let bot: TelegramBot;
let retryCount = 0;
const maxRetries = 5;

function initializeBot() {
  bot = createBot();

  // 봇 에러 핸들러
  bot.on("error", error => {
    console.error("Telegram Bot Error:", error);
    handleError(error);
  });

  bot.on("polling_error", error => {
    console.error("Telegram Bot Polling Error:", error);
    handleError(error);

    // 재시도 로직
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying bot connection... (${retryCount}/${maxRetries})`);

      setTimeout(() => {
        bot.stopPolling();
        initializeBot();
      }, 5000 * retryCount); // 지수 백오프
    } else {
      console.error("Max retries reached. Bot connection failed.");
      process.exit(1);
    }
  });

  // 연결 성공 시 재시도 카운터 리셋
  bot.on("message", () => {
    if (retryCount > 0) {
      console.log("Bot connection restored!");
      retryCount = 0;
    }
  });
}

async function startServer() {
  try {
    await require("./loaders").default();
    initializeBot();
    await Handler(bot);
    console.log("🚀 FRIDAY Bot is running!");
  } catch (error) {
    console.error("Failed to start server:", error);
    handleError(error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

startServer();
