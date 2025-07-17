process.env.NODE_ENV = process.env.NODE_ENV || "development";

interface Config {
  telegramToken: string;
  openAiToken?: string;
  openWeatherApiKey?: string;
  mongodbConfig: {
    mongoHostname: string;
    mongoDBname: string;
    mongoPassword: string;
    mongoPort: string;
    mongoUsername: string;
  } | null;
  minioConfig: {
    minioUrl: string;
    minioPort: number;
    minioAccessKey: string;
    minioSecretKey: string;
  } | null;
  isProd: boolean;
  logs: {
    level: string;
  };
}

function validateConfig(): Config {
  const telegramToken = process.env.TELEGRAM_TOKEN;
  if (!telegramToken) {
    throw new Error("TELEGRAM_TOKEN is required");
  }

  const mongodbConfig = process.env.MONGODB_HOSTNAME
    ? {
        mongoHostname: process.env.MONGODB_HOSTNAME,
        mongoDBname: process.env.MONGODB_DATABASE || "friday",
        mongoPassword: process.env.MONGODB_PASSWORD || "",
        mongoPort: process.env.MONGODB_PORT || "27017",
        mongoUsername: process.env.MONGODB_USERNAME || ""
      }
    : null;

  const minioConfig = process.env.MINIO_URL
    ? {
        minioUrl: process.env.MINIO_URL,
        minioPort: parseInt(process.env.MINIO_PORT || "9000", 10),
        minioAccessKey: process.env.MINIO_ACCESS_KEY || "",
        minioSecretKey: process.env.MINIO_SECRET_KEY || ""
      }
    : null;

  return {
    telegramToken,
    openAiToken: process.env.OPEN_AI_TOKEN,
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
    mongodbConfig,
    minioConfig,
    isProd: process.env.NODE_ENV === "production",
    logs: {
      level: process.env.LOG_LEVEL || "info"
    }
  };
}

export default validateConfig();
