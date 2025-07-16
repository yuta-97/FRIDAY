import pino from "pino";
import { config } from "@/configs";

const LoggerInstance = pino({
  level: config.logs.level,
  transport: config.isProd ? {
    target: "pino/file",
    options: {
      destination: "logs/test.log",
      mkdir: true
    }
  } : {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname"
    }
  }
});

export default LoggerInstance;
