import { config } from "@/configs";
import databaseLoader from "./databaseLoader";
import dependencyInjectorLoader from "./dependencyInjector";
import Logger from "./pinoLoader";

export default async function () {
  try {
    if (config.mongodbConfig) {
      await databaseLoader();
      Logger.info("✅ DB loaded and connected!");
      await dependencyInjectorLoader({
        // TODO: 필요한 스키마 추가할 것.
        models: [require("../models/User").default]
      });
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
