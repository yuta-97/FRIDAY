import { Container } from "typedi";
import RssScheduler from "../services/RssScheduler";
import Logger from "./pinoLoader";

export default async function (): Promise<void> {
  try {
    // RssScheduler 인스턴스 생성 및 시작
    const rssScheduler = Container.get(RssScheduler);

    // 기본 피드들 추가 (dev.to와 몇 가지 인기 개발 블로그)
    const defaultFeeds = ["https://dev.to/feed"];

    // 기본 피드들 추가
    for (const feedUrl of defaultFeeds) {
      try {
        await rssScheduler.addFeed(feedUrl);
      } catch (error) {
        Logger.warn(
          { error: error.message },
          `기본 피드 추가 실패: ${feedUrl}`
        );
      }
    }

    // 스케줄러 시작
    rssScheduler.start();

    Logger.info("✅ RSS 스케줄러 로드 완료");
  } catch (error) {
    Logger.error({ error: error.message }, "❌ RSS 스케줄러 로드 실패");
    throw error;
  }
}
