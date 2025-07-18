import { BaseCommand, CommandArgs } from "@/commands/base/BaseCommand";
import { RssNotificationService } from "@/services/RssNotificationService";
import { RSSService } from "@/services/RssService";
import { UserService } from "@/services/UserService";
import TelegramBot from "node-telegram-bot-api";

export class RssCommand extends BaseCommand {
  private rssService: RSSService;
  private notificationService: RssNotificationService;

  constructor() {
    super();
    this.rssService = new RSSService();
    this.notificationService = new RssNotificationService();
  }

  get name(): string {
    return "/rss";
  }

  get description(): string {
    return "RSS 피드 관리 및 알림 설정";
  }

  async execute(args: CommandArgs): Promise<string> {
    const { value, chatId, userId, userService, bot } = args;

    if (!value) {
      await this.showHelp(bot, chatId);
      return "RSS 도움말을 표시했습니다.";
    }

    const commandArgs = value.split("_");
    const command = commandArgs[0];

    switch (command) {
      case "check":
        await this.checkFeeds(bot, chatId);
        return "RSS 피드 체크를 실행했습니다.";
      case "feeds":
        await this.listFeeds(bot, chatId);
        return "RSS 피드 목록을 표시했습니다.";
      case "test":
        await this.testNotification(bot, chatId);
        return "테스트 알림을 전송했습니다.";
      case "noti":
        await this.toggleNotification(
          bot,
          chatId,
          userId || "",
          commandArgs[1],
          userService
        );
        return "알림 설정을 변경했습니다.";
      case "unread":
        await this.getUnreadArticles(bot, chatId);
        return "읽지 않은 아티클 목록을 표시했습니다.";
      default:
        await this.showHelp(bot, chatId);
        return "RSS 도움말을 표시했습니다.";
    }
  }

  private async showHelp(bot: TelegramBot, chatId: number): Promise<void> {
    const helpText = `
🔔 *RSS 명령어*

• \`/rss_check\` - 수동으로 RSS 피드 체크
• \`/rss_feeds\` - 활성화된 피드 목록 보기
• \`/rss_test\` - 알림 테스트
• \`/rss_noti on\` 또는 \`/rss_noti off\` - 알림 설정/해제
• \`/rss_unread\` - 읽지 않은 아티클 보기

RSS 피드는 10분마다 자동으로 체크됩니다.
    `;

    await bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
  }

  private async checkFeeds(bot: TelegramBot, chatId: number): Promise<void> {
    try {
      await bot.sendMessage(chatId, "🔄 RSS 피드를 체크하는 중...");

      const newArticles = await this.rssService.fetchAllNewArticles();

      if (newArticles.length > 0) {
        await bot.sendMessage(
          chatId,
          `✅ ${newArticles.length}개의 새로운 아티클을 발견했습니다!`
        );

        // 알림 설정이 켜져있는 사용자들에게 전송
        await this.notificationService.sendArticleNotifications(newArticles);
      } else {
        await bot.sendMessage(chatId, "📰 새로운 아티클이 없습니다.");
      }
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ RSS 피드 체크 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  private async listFeeds(bot: TelegramBot, chatId: number): Promise<void> {
    try {
      const feeds = await this.rssService.getActiveFeeds();

      if (feeds.length === 0) {
        await bot.sendMessage(chatId, "📰 활성화된 RSS 피드가 없습니다.");
        return;
      }

      let feedList = "📰 *활성화된 RSS 피드*\\n\\n";
      feeds.forEach((feed, index) => {
        feedList += `${index + 1}\\. *${feed.title}*\\n`;
        feedList += `   🔗 ${feed.url}\\n\\n`;
      });

      await bot.sendMessage(chatId, feedList, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ 피드 목록 조회 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  private async testNotification(
    bot: TelegramBot,
    chatId: number
  ): Promise<void> {
    try {
      await this.notificationService.sendTestNotification(chatId.toString());
      await bot.sendMessage(chatId, "✅ 테스트 알림이 전송되었습니다!");
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ 테스트 알림 전송 실패: ${error.message}`
      );
    }
  }

  private async toggleNotification(
    bot: TelegramBot,
    chatId: number,
    userId: string,
    setting: string,
    userService: UserService
  ): Promise<void> {
    try {
      if (!setting || (setting !== "on" && setting !== "off")) {
        await bot.sendMessage(
          chatId,
          "❌ 사용법: `/rss_noti on` 또는 `/rss_noti off`"
        );
        return;
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ 사용자 정보를 찾을 수 없습니다. 먼저 `/start` 명령어를 사용해주세요."
        );
        return;
      }

      const notiValue = setting === "on";
      await userService.updateUser(userId, { noti: notiValue });

      const statusText = notiValue ? "켜짐" : "꺼짐";
      await bot.sendMessage(chatId, `✅ RSS 알림이 ${statusText}되었습니다.`);
    } catch (error) {
      await bot.sendMessage(chatId, `❌ 알림 설정 변경 실패: ${error.message}`);
    }
  }

  private async getUnreadArticles(
    bot: TelegramBot,
    chatId: number
  ): Promise<void> {
    try {
      const unreadArticles = await this.rssService.getUnprocessedArticles();

      if (unreadArticles.length === 0) {
        await bot.sendMessage(chatId, "📰 읽지 않은 아티클이 없습니다.");
        return;
      }

      const limit = 5; // 최대 5개만 보여주기
      const articles = unreadArticles.slice(0, limit);

      let messageText = `📰 *읽지 않은 아티클 (${articles.length}/${unreadArticles.length})*\\n\\n`;

      articles.forEach((article, index) => {
        messageText += `${index + 1}\\. *${article.title}*\\n`;
        messageText += `   🔗 [링크](${article.link})\\n`;
        messageText += `   📅 ${article.pubDate.toLocaleDateString(
          "ko-KR"
        )}\\n\\n`;
      });

      if (unreadArticles.length > limit) {
        messageText += `\\.\\.\\. 그리고 ${
          unreadArticles.length - limit
        }개 더\\n`;
      }

      await bot.sendMessage(chatId, messageText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ 읽지 않은 아티클 조회 실패: ${error.message}`
      );
    }
  }
}
