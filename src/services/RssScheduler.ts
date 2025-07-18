import { Service } from "typedi";
import * as cron from "node-cron";
import { RSSService } from "@/services/RssService";
import { RssNotificationService } from "@/services/RssNotificationService";
import Logger from "@/loaders/pinoLoader";

@Service()
export class RssScheduler {
  private rssService: RSSService;
  private notificationService: RssNotificationService;
  private isRunning: boolean = false;

  constructor() {
    this.rssService = new RSSService();
    this.notificationService = new RssNotificationService();
  }

  /**
   * RSS 피드 체크 스케줄러 시작
   * 기본적으로 10분마다 실행
   */
  start(): void {
    if (this.isRunning) {
      Logger.warn("RSS 스케줄러가 이미 실행중입니다.");
      return;
    }

    // 10분마다 실행 (0 */10 * * * *)
    cron.schedule("*/10 * * * *", async () => {
      Logger.info("RSS 피드 체크 시작...");
      await this.checkAllFeeds();
    });

    this.isRunning = true;
    Logger.info("RSS 스케줄러가 시작되었습니다. (10분마다 실행)");
  }

  /**
   * 모든 피드를 체크하고 새로운 아티클 처리
   */
  async checkAllFeeds(): Promise<void> {
    try {
      const newArticles = await this.rssService.fetchAllNewArticles();

      if (newArticles.length > 0) {
        Logger.info(
          `${newArticles.length}개의 새로운 아티클이 발견되었습니다.`
        );

        // 알림 서비스를 통해 사용자들에게 전송
        await this.notificationService.sendArticleNotifications(newArticles);
      } else {
        Logger.info("새로운 아티클이 없습니다.");
      }
    } catch (error) {
      Logger.error({ error: error.message }, "RSS 피드 체크 중 오류 발생");
    }
  }

  /**
   * 수동으로 피드 체크 실행
   */
  async manualCheck(): Promise<void> {
    Logger.info("수동 RSS 피드 체크 실행...");
    await this.checkAllFeeds();
  }

  /**
   * 특정 피드 URL 추가
   */
  async addFeed(url: string): Promise<void> {
    try {
      await this.rssService.addOrUpdateFeed(url);
      Logger.info(`RSS 피드 추가됨: ${url}`);
    } catch (error) {
      Logger.error({ error: error.message }, `RSS 피드 추가 실패: ${url}`);
      throw error;
    }
  }

  /**
   * 스케줄러 상태 확인
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

export default RssScheduler;
