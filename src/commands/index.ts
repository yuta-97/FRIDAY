import TelegramBot from "node-telegram-bot-api";
import Container from "typedi";
import { Logger } from "pino";
import { UserService } from "@/services/UserService";
import { handleError } from "@/utils/errorHandler";

async function handleCommand(
  command: string,
  chatId: number,
  userId: string | undefined,
  username: string,
  userService: UserService
): Promise<string> {
  const data: string[] = command.split("_");
  const baseCommand = data[0];
  const value = data[1];

  switch (baseCommand) {
    case "/start":
      if (userId) {
        try {
          await userService.createUser({
            userId,
            username,
            chatId: chatId.toString()
          });
          return `안녕하세요 ${username}님! 환영합니다! 🎉`;
        } catch (error) {
          return `안녕하세요 ${username}님! 다시 만나서 반갑습니다! 😊`;
        }
      }
      return "사용자 정보를 가져올 수 없습니다.";

    case "/help":
      return `
📖 도움말
/start - 시작하기
/help - 도움말 보기
/echo - 메시지 반복
/login - 로그인
      `.trim();

    case "/echo":
      return value
        ? `Echo: ${value}`
        : "메시지를 입력해주세요. 예: /echo_안녕하세요";

    case "/login":
      return "로그인 기능을 준비 중입니다... 🔧";

    default:
      return `알 수 없는 명령어입니다: ${baseCommand}\n/help 명령어로 도움말을 확인해주세요.`;
  }
}

export default async function Handler(bot: TelegramBot) {
  const logger: Logger = Container.get("logger");
  const userService: UserService = Container.get("userService");

  // 봇 명령어 설정
  bot.setMyCommands([
    { command: "start", description: "시작하기" },
    { command: "help", description: "도움말" },
    { command: "echo", description: "메시지 반복" },
    { command: "login", description: "로그인" }
  ]);

  // 챗 멤버 변경 리스너
  bot.addListener("chat_member", (member: TelegramBot.ChatMemberUpdated) => {
    logger.debug({ member }, "Chat member updated");
  });

  // 메시지 처리
  bot.on("message", async msg => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id?.toString();
    const username = msg.from?.username || msg.from?.first_name || "Unknown";

    logger.info(
      {
        chatId,
        userId,
        username,
        messageText: msg.text.substring(0, 100) // 로그에서 메시지 길이 제한
      },
      "Message received"
    );

    try {
      if (msg.text.startsWith("/")) {
        const response = await handleCommand(
          msg.text,
          chatId,
          userId,
          username,
          userService
        );
        await bot.sendMessage(chatId, response);
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
