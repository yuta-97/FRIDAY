import { Client } from "minio";
import { config } from "@/configs";

const { minioAccessKey, minioPort, minioSecretKey, minioUrl } =
  config.minioConfig;

const MinioInstance = new Client({
  endPoint: minioUrl,
  port: minioPort,
  useSSL: true,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey
});

export default MinioInstance;
