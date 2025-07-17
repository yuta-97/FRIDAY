import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class StartCommand extends BaseCommand {
  get name(): string {
    return "/start";
  }

  get description(): string {
    return "시작하기";
  }

  async execute({
    userId,
    userName,
    chatId,
    userService
  }: CommandArgs): Promise<string> {
    if (userId) {
      try {
        await userService.createUser({
          userId,
          userName: userName,
          chatId: chatId.toString()
        });
        return `안녕하세요 ${userName}님! 환영합니다! 🎉`;
      } catch (error) {
        return `안녕하세요 ${userName}님! 다시 만나서 반갑습니다! 😊`;
      }
    }
    return "사용자 정보를 가져올 수 없습니다.";
  }
}
