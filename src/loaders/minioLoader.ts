import { Client } from "minio";
import { config } from "@/configs";

const MinioInstance = new Client({
  endPoint: config.minioUrl,
  port: config.minioPort,
  useSSL: true,
  accessKey: config.minioAccessKey,
  secretKey: config.minioSecretKey
});

export default MinioInstance;
