import { Service } from "typedi";
import TelegramBot from "node-telegram-bot-api";
import { UserService } from "@/services/UserService";
import { IRSSArticleDocument } from "@/models/RSSArticle";
import { config } from "@/configs";
import Logger from "@/loaders/pinoLoader";

@Service()
export class RssNotificationService {
  private bot: TelegramBot;
  private userService: UserService;

  constructor() {
    this.bot = new TelegramBot(config.telegramToken);
    this.userService = new UserService();
  }

  /**
   * 새로운 RSS 아티클을 noti 옵션이 활성화된 사용자들에게 전송
   */
  async sendArticleNotifications(
    articles: IRSSArticleDocument[]
  ): Promise<void> {
    try {
      // noti 옵션이 true인 사용자들 조회
      const notificationUsers =
        await this.userService.getUsersWithNotification();

      if (notificationUsers.length === 0) {
        Logger.info("알림을 받을 사용자가 없습니다.");
        return;
      }

      Logger.info(`${notificationUsers.length}명의 사용자에게 알림 전송 시작`);

      // 각 아티클을 모든 알림 사용자에게 전송
      for (const article of articles) {
        const message = this.formatArticleMessage(article);

        for (const user of notificationUsers) {
          try {
            await this.bot.sendMessage(user.chatId, message, {
              parse_mode: "Markdown",
              disable_web_page_preview: false
            });

            Logger.info(`알림 전송 완료: ${user.userName} (${user.chatId})`);
          } catch (error) {
            Logger.error(
              { error: error.message },
              `알림 전송 실패: ${user.userName} (${user.chatId})`
            );
          }
        }

        // 아티클을 처리됨으로 마킹
        await this.markArticleAsProcessed(article.id);
      }

      Logger.info(`${articles.length}개의 아티클 알림 전송 완료`);
    } catch (error) {
      Logger.error({ error: error.message }, "RSS 알림 전송 중 오류 발생");
      throw error;
    }
  }

  private getFeedTitle(article: IRSSArticleDocument): string {
    if (typeof article === "object") {
      if (article.title) {
        return article.title;
      }
    }
    return "RSS Feed";
  }
  /**
   * 아티클 메시지 포맷팅
   */
  private formatArticleMessage(article: IRSSArticleDocument): string {
    const feedTitle = this.getFeedTitle(article);

    let message = `🔔 *새로운 개발 소식*\n\n`;
    message += `📰 *${this.escapeMarkdown(article.title)}*\n\n`;

    if (article.description) {
      const shortDescription =
        article.description.length > 200
          ? article.description.substring(0, 200) + "..."
          : article.description;
      message += `📝 ${this.escapeMarkdown(shortDescription)}\n\n`;
    }

    message += `🔗 [링크 보기](${article.link})\n`;
    message += `📅 ${this.formatDate(article.pubDate)}\n`;
    message += `📡 출처: ${this.escapeMarkdown(feedTitle)}`;

    if (article.author) {
      message += `\n✍️ 작성자: ${this.escapeMarkdown(article.author)}`;
    }

    return message;
  }

  /**
   * 마크다운 특수문자 이스케이프
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/[*_`[\]()~>#+=|{}.!-]/g, "\\$&");
  }

  /**
   * 날짜 포맷팅
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  /**
   * 아티클을 처리됨으로 마킹 (RSSService에서 가져옴)
   */
  private async markArticleAsProcessed(articleId: string): Promise<void> {
    try {
      const { RSSService } = await import("@/services/RssService");
      const rssService = new RSSService();
      await rssService.markArticleAsProcessed(articleId);
    } catch (error) {
      Logger.error(
        { error: error.message },
        `아티클 처리 마킹 실패: ${articleId}`
      );
    }
  }

  /**
   * 특정 사용자에게 테스트 메시지 전송
   */
  async sendTestNotification(chatId: string): Promise<void> {
    try {
      const message = `🧪 *RSS 알림 테스트*\n\n이 메시지는 RSS 알림 기능이 정상적으로 작동하는지 확인하는 테스트 메시지입니다.`;

      await this.bot.sendMessage(chatId, message, {
        parse_mode: "Markdown"
      });

      Logger.info(`테스트 알림 전송 완료: ${chatId}`);
    } catch (error) {
      Logger.error(
        { error: error.message },
        `테스트 알림 전송 실패: ${chatId}`
      );
      throw error;
    }
  }
}
