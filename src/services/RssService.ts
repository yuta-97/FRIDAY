import { Service } from "typedi";
import Parser from "rss-parser";
import RSSFeed, { IRSSFeedDocument } from "@/models/RSSFeed";
import RSSArticle, { IRSSArticleDocument } from "@/models/RSSArticle";
import Logger from "@/loaders/pinoLoader";

@Service()
export class RSSService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ["dc:creator", "author"],
          ["content:encoded", "content"],
          ["guid", "guid"]
        ]
      }
    });
  }

  /**
   * RSS 피드를 추가하거나 업데이트
   */
  async addOrUpdateFeed(url: string): Promise<IRSSFeedDocument> {
    try {
      // RSS 피드 파싱
      const feed = await this.parser.parseURL(url);

      // 기존 피드 찾기 또는 새로 생성
      let rssFeed = await RSSFeed.findOne({ url });

      if (rssFeed) {
        // 기존 피드 업데이트
        rssFeed.title = feed.title || rssFeed.title;
        rssFeed.description = feed.description || rssFeed.description;
        rssFeed.lastBuildDate = feed.lastBuildDate
          ? new Date(feed.lastBuildDate)
          : rssFeed.lastBuildDate;
        await rssFeed.save();
        Logger.info(`RSS 피드 업데이트됨: ${feed.title}`);
      } else {
        // 새로운 피드 생성
        rssFeed = new RSSFeed({
          url,
          title: feed.title || "Unknown Feed",
          description: feed.description,
          lastBuildDate: feed.lastBuildDate
            ? new Date(feed.lastBuildDate)
            : new Date(),
          isActive: true
        });
        await rssFeed.save();
        Logger.info(`새로운 RSS 피드 추가됨: ${feed.title}`);
      }

      return rssFeed;
    } catch (error) {
      Logger.error(
        { error: error.message },
        `RSS 피드 추가/업데이트 실패: ${url}`
      );
      throw error;
    }
  }

  /**
   * 특정 피드의 새로운 아티클들을 가져와서 저장
   */
  async fetchNewArticles(feedId: string): Promise<IRSSArticleDocument[]> {
    try {
      const rssFeed = await RSSFeed.findById(feedId);
      if (!rssFeed || !rssFeed.isActive) {
        Logger.warn(`비활성 또는 존재하지 않는 피드: ${feedId}`);
        return [];
      }

      const feed = await this.parser.parseURL(rssFeed.url);
      const newArticles: IRSSArticleDocument[] = [];

      for (const item of feed.items) {
        if (!item.guid && !item.link) {
          Logger.warn(`GUID와 링크가 모두 없는 아티클 스킵: ${item.title}`);
          continue;
        }

        const guid = item.guid || item.link;

        // 이미 존재하는 아티클인지 확인
        const existingArticle = await RSSArticle.findOne({ guid });
        if (existingArticle) {
          continue;
        }

        const article = new RSSArticle({
          feedId: rssFeed._id,
          title: item.title || "Untitled",
          link: item.link || "",
          description: item.contentSnippet || item.content || "",
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          guid,
          author: item.author || item.creator,
          categories: item.categories || [],
          isProcessed: false
        });

        await article.save();
        newArticles.push(article);
        Logger.info(`새로운 아티클 저장됨: ${item.title}`);
      }

      Logger.info(
        `피드 ${rssFeed.title}에서 ${newArticles.length}개의 새로운 아티클 발견`
      );
      return newArticles;
    } catch (error) {
      Logger.error({ error: error.message }, `아티클 가져오기 실패: ${feedId}`);
      throw error;
    }
  }

  /**
   * 모든 활성 피드의 새로운 아티클들을 가져옴
   */
  async fetchAllNewArticles(): Promise<IRSSArticleDocument[]> {
    try {
      const activeFeeds = await RSSFeed.find({ isActive: true });
      const allNewArticles: IRSSArticleDocument[] = [];

      for (const feed of activeFeeds) {
        try {
          const newArticles = await this.fetchNewArticles(feed._id.toString());
          allNewArticles.push(...newArticles);
        } catch (error) {
          Logger.error(
            { error: error.message },
            `피드 처리 실패: ${feed.title}`
          );
          // 개별 피드 에러는 전체 프로세스를 중단시키지 않음
        }
      }

      Logger.info(`총 ${allNewArticles.length}개의 새로운 아티클 발견`);
      return allNewArticles;
    } catch (error) {
      Logger.error({ error: error.message }, "모든 피드 처리 실패");
      throw error;
    }
  }

  /**
   * 아티클을 처리됨으로 마킹
   */
  async markArticleAsProcessed(articleId: string): Promise<void> {
    try {
      await RSSArticle.findByIdAndUpdate(articleId, { isProcessed: true });
      Logger.info(`아티클 처리 완료: ${articleId}`);
    } catch (error) {
      Logger.error(
        { error: error.message },
        `아티클 처리 마킹 실패: ${articleId}`
      );
      throw error;
    }
  }

  /**
   * 처리되지 않은 아티클들을 가져옴
   */
  async getUnprocessedArticles(): Promise<IRSSArticleDocument[]> {
    try {
      const articles = await RSSArticle.find({ isProcessed: false })
        .populate("feedId")
        .sort({ pubDate: -1 });

      return articles;
    } catch (error) {
      Logger.error({ error: error.message }, "미처리 아티클 조회 실패");
      throw error;
    }
  }

  /**
   * 피드 비활성화
   */
  async deactivateFeed(feedId: string): Promise<void> {
    try {
      await RSSFeed.findByIdAndUpdate(feedId, { isActive: false });
      Logger.info(`피드 비활성화됨: ${feedId}`);
    } catch (error) {
      Logger.error({ error: error.message }, `피드 비활성화 실패: ${feedId}`);
      throw error;
    }
  }

  /**
   * 모든 활성 피드 조회
   */
  async getActiveFeeds(): Promise<IRSSFeedDocument[]> {
    try {
      return await RSSFeed.find({ isActive: true });
    } catch (error) {
      Logger.error({ error: error.message }, "활성 피드 조회 실패");
      throw error;
    }
  }
}
