import mongoose from "mongoose";
import { config } from "@/configs";
import Logger from "./pinoLoader";

export default async (): Promise<void> => {
  if (!config.mongodbConfig) {
    Logger.info("MongoDB config not found, skipping database connection");
    return;
  }

  const {
    mongoUsername,
    mongoPassword,
    mongoHostname,
    mongoPort,
    mongoDBname
  } = config.mongodbConfig;

  const connString =
    "mongodb://" +
    encodeURIComponent(mongoUsername) +
    ":" +
    encodeURIComponent(mongoPassword) +
    "@" +
    mongoHostname +
    ":" +
    mongoPort +
    "/" +
    mongoDBname;

  Logger.debug(`[DatabaseLoader] Attempting to connect to MongoDB...`);

  try {
    await mongoose.connect(connString, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    Logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    Logger.error({ error: error.message }, "❌ MongoDB connection failed");
    throw error;
  }
};
