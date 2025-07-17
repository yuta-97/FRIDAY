import { BaseCommand, CommandArgs } from "../base/BaseCommand";
import { userStateManager } from "@/utils/userStateManager";

export class CancelCommand extends BaseCommand {
  get name(): string {
    return "/cancel";
  }

  get description(): string {
    return "현재 진행 중인 명령어 취소";
  }

  async execute({ chatId, userId }: CommandArgs): Promise<string> {
    if (!userId) {
      return "❌ 사용자 정보를 확인할 수 없습니다.";
    }

    const userState = userStateManager.getUserState(userId, chatId);

    if (!userState) {
      return "❌ 취소할 명령어가 없습니다.";
    }

    userStateManager.clearUserState(userId, chatId);
    return `✅ ${userState.currentCommand} 명령어를 취소했습니다.`;
  }
}
