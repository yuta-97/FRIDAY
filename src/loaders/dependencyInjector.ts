import { Container } from "typedi";
import LoggerInstance from "./winstonLoader";
import MinioInstance from "./minioLoader";
import { Loader } from "@/interfaces";

export default async ({ models }: Loader.models): Promise<void> => {
  try {
    Container.set("logger", LoggerInstance);
    Container.set("minio", MinioInstance);

    models.forEach(m => {
      Container.set(m.name, m.model);
    });
  } catch (e) {
    console.log("dependency error >>> ", e);
    throw e;
  }
};
