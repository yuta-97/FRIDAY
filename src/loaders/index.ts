import { config } from "@/configs";
import databaseLoader from "./databaseLoader";
import dependencyInjectorLoader from "./dependencyInjector";
import rssLoader from "./rssLoader";
import Logger from "./pinoLoader";

export default async function () {
  try {
    if (config.mongodbConfig) {
      await databaseLoader();
      Logger.info("✅ DB loaded and connected!");
      await dependencyInjectorLoader({
        models: [
          require("../models/User").default,
          require("../models/RSSFeed").default,
          require("../models/RSSArticle").default
        ]
      });

      // RSS 로더 시작
      await rssLoader();
    } else {
      Logger.info("⚠️  MongoDB not configured, running without database");
      await dependencyInjectorLoader({
        models: []
      });
    }

    Logger.info("✅ Dependency Injector loaded");
  } catch (error) {
    Logger.error({ error: error.message }, "❌ Loader initialization failed");
    throw error;
  }
}
