import { BaseCommand, CommandArgs } from "../base/BaseCommand";

export class NotificationCommand extends BaseCommand {
  get name(): string {
    return "/noti";
  }

  get description(): string {
    return "알림 설정";
  }

  async execute({ value, userId, userService }: CommandArgs): Promise<string> {
    if (!userId) {
      return "❌ 사용자 정보를 확인할 수 없습니다.";
    }

    try {
      if (!value) {
        // 현재 알림 상태 확인
        const user = await userService.getUserById(userId);
        if (!user) {
          return "❌ 사용자 정보를 찾을 수 없습니다.";
        }

        const status = user.noti ? "🔔 켜짐" : "🔕 꺼짐";
        return `📱 현재 알림 상태: ${status}

💡 사용법:
/noti_on - 알림 켜기
/noti_off - 알림 끄기
/noti_status - 현재 상태 확인`;
      }

      const action = value.toLowerCase();
      let newNotiStatus: boolean;
      let message: string;

      switch (action) {
        case "on":
          newNotiStatus = true;
          message = "🔔 알림이 켜졌습니다!";
          break;
        case "off":
          newNotiStatus = false;
          message = "🔕 알림이 꺼졌습니다.";
          break;
        case "status": {
          const user = await userService.getUserById(userId);
          if (!user) {
            return "❌ 사용자 정보를 찾을 수 없습니다.";
          }
          const status = user.noti ? "🔔 켜짐" : "🔕 꺼짐";
          return `📱 현재 알림 상태: ${status}`;
        }
        default:
          return `❌ 잘못된 명령어입니다.

💡 사용법:
/noti_on - 알림 켜기
/noti_off - 알림 끄기
/noti_status - 현재 상태 확인`;
      }

      await userService.updateUser(userId, { noti: newNotiStatus });
      return message;
    } catch (error) {
      console.error("Notification command error:", error);
      return "❌ 알림 설정 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.";
    }
  }
}
