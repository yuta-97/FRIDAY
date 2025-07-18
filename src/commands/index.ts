import TelegramBot from "node-telegram-bot-api";
import Container from "typedi";
import { Logger } from "pino";
import { UserService } from "@/services/UserService";
import { handleError } from "@/utils/errorHandler";
import { CommandRegistry } from "./base/CommandRegistry";
import { StartCommand } from "./handlers/Start";
import { HelpCommand } from "./handlers/Help";
import { EchoCommand } from "./handlers/Echo";
import { LoginCommand } from "./handlers/Login";
import { WeatherCommand } from "./handlers/Weather";
import { NotificationCommand } from "./handlers/Notification";
import { RssCommand } from "./handlers/Rss";
import { userStateManager } from "@/utils/userStateManager";
import { DiceCommand } from "./handlers/Dice";
import { CancelCommand } from "./handlers/Cancel";

// 명령어 레지스트리 초기화
const commandRegistry = new CommandRegistry();
const helpCommand = new HelpCommand();

commandRegistry.register(new StartCommand());
commandRegistry.register(helpCommand);
commandRegistry.register(new EchoCommand());
commandRegistry.register(new LoginCommand());
commandRegistry.register(new WeatherCommand());
commandRegistry.register(new NotificationCommand());
commandRegistry.register(new RssCommand());
commandRegistry.register(new DiceCommand());
commandRegistry.register(new CancelCommand());

// HelpCommand에 registry 설정
helpCommand.setRegistry(commandRegistry);

async function handleCommand(
  command: string,
  chatId: number,
  userId: string | undefined,
  userName: string,
  userService: UserService,
  bot: TelegramBot
): Promise<string> {
  const data: string[] = command.split("_");
  const baseCommand = data[0];
  const value = data[1];

  return commandRegistry.execute(baseCommand, {
    value,
    chatId,
    userId,
    userName,
    userService,
    bot
  });
}

export default async function Handler(bot: TelegramBot) {
  const logger: Logger = Container.get("logger");
  const userService: UserService = Container.get("userService");

  // 봇 명령어 설정 (동적으로 생성)
  bot.setMyCommands(commandRegistry.getCommandsForBot());

  // 챗 멤버 변경 리스너
  bot.addListener("chat_member", (member: TelegramBot.ChatMemberUpdated) => {
    logger.debug({ member }, "Chat member updated");
  });

  // 메시지 처리
  bot.on("message", async msg => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id?.toString();
    const userName = msg.from?.username || msg.from?.first_name || "Unknown";

    logger.info(
      {
        chatId,
        userId,
        userName,
        messageText: msg.text.substring(0, 100) // 로그에서 메시지 길이 제한
      },
      "Message received"
    );

    try {
      if (msg.text.startsWith("/")) {
        // 명령어 처리
        const response = await handleCommand(
          msg.text,
          chatId,
          userId,
          userName,
          userService,
          bot
        );
        await bot.sendMessage(chatId, response);
      } else {
        // 일반 텍스트 메시지 처리 (사용자 상태 확인)
        const userState = userStateManager.getUserState(userId || "", chatId);

        if (userState) {
          // 현재 진행 중인 명령어가 있는 경우
          const commandWithValue = `${userState.currentCommand}_${msg.text}`;
          const response = await handleCommand(
            commandWithValue,
            chatId,
            userId,
            userName,
            userService,
            bot
          );
          if (response) {
            await bot.sendMessage(chatId, response);
          }
        }
        // 상태가 없는 일반 메시지는 무시
      }
    } catch (error) {
      logger.error(
        { error: error.message, chatId },
        "Error processing message"
      );
      await bot.sendMessage(
        chatId,
        "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요."
      );
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  });

  // 인라인 키보드 버튼 클릭 처리
  bot.on("callback_query", async callbackQuery => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;

    if (!msg || !data) return;

    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id.toString();
    const userName =
      callbackQuery.from.username || callbackQuery.from.first_name || "Unknown";

    try {
      // 콜백 쿼리에 응답 (로딩 상태 해제)
      await bot.answerCallbackQuery(callbackQuery.id);

      // 날씨 도시 선택 콜백 처리
      if (data.startsWith("weather_select_")) {
        const selectedIndex = parseInt(data.replace("weather_select_", ""));

        // 사용자 상태 확인
        const userState = userStateManager.getUserState(userId, chatId);
        if (
          userState &&
          userState.currentCommand === "/weather" &&
          userState.step === 2
        ) {
          // 도시 선택 처리
          const commandWithValue = `/weather_${selectedIndex + 1}`;
          const response = await handleCommand(
            commandWithValue,
            chatId,
            userId,
            userName,
            userService,
            bot
          );

          // 기존 메시지 수정
          await bot.editMessageText(response, {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: "HTML"
          });
        } else {
          // 상태가 없거나 잘못된 경우
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "세션이 만료되었습니다. 다시 /weather 명령어를 사용해주세요.",
            show_alert: true
          });
        }
      }
    } catch (error) {
      logger.error(
        { error: error.message, chatId },
        "Error processing callback query"
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "오류가 발생했습니다. 다시 시도해주세요.",
        show_alert: true
      });
    }
  });

  // 특정 패턴 처리 (예: 's' 문자)
  bot.onText(/^s$/, async msg => {
    const chatId = msg.chat.id;
    try {
      await bot.sendMessage(chatId, "테스트 메시지입니다!");
    } catch (error) {
      logger.error(
        { error: error.message, chatId },
        "Error sending test message"
      );
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
