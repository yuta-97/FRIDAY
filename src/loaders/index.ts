import databaseLoader from "./databaseLoader";
import dependencyInjectorLoader from "./dependencyInjector";
import Logger from "./winstonLoader";

export default async function () {
  await databaseLoader();
  Logger.info("DB loaded and connected!");

  await dependencyInjectorLoader({
    // TODO: 필요한 스키마 추가할 것.
    models: [require("../models/User").default]
  });

  Logger.info("Dependency Injector loaded");
}
