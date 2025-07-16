import { config } from "@/configs";
import { Container } from "typedi";
import { Logger } from "pino";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: Error): void {
  try {
    // logger가 등록되어 있는지 확인
    if (Container.has("logger")) {
      const logger: Logger = Container.get("logger");

      if (error instanceof AppError && error.isOperational) {
        logger.error({
          message: error.message,
          statusCode: error.statusCode,
          stack: config.isProd ? undefined : error.stack
        });
      } else {
        logger.error({
          message: error.message,
          stack: config.isProd ? undefined : error.stack
        });
      }
    } else {
      // logger가 없으면 console.error 사용
      console.error("Error (logger not available):", {
        message: error.message,
        stack: config.isProd ? undefined : error.stack
      });
    }
  } catch (logError) {
    // 로깅 중 에러가 발생하면 console.error 사용
    console.error("Logging error:", logError);
    console.error("Original error:", error);
  }
}

export function setupGlobalErrorHandlers(): void {
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);
    handleError(error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error("Unhandled Rejection:", error);
    handleError(error);
    process.exit(1);
  });
}
