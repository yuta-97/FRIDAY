import { Container } from "typedi";
import LoggerInstance from "./pinoLoader";
import MinioInstance from "./minioLoader";
import { Loader } from "@/interfaces";
import { config } from "@/configs";
import { UserService } from "@/services/UserService";

export default async ({ models }: Loader.models): Promise<void> => {
  try {
    Container.set("logger", LoggerInstance);

    if (config.minioConfig) {
      Container.set("minio", MinioInstance);
    }

    // 서비스 등록
    Container.set("userService", new UserService());

    models.forEach(m => {
      Container.set(m.name, m.model);
    });
  } catch (e) {
    LoggerInstance.error(
      `🔥 Error on dependency injector loader: ${JSON.stringify(e)}`
    );
    throw e;
  }
};
