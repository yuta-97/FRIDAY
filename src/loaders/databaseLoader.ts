import mongoose from "mongoose";
import { config } from "@/configs";

export default async (): Promise<void> => {
  const connString =
    "mongodb://" +
    config.mongoUsername +
    ":" +
    config.mongoPassword +
    "@" +
    config.mongoHostname +
    ":" +
    config.mongoPort +
    "/" +
    config.mongoDBname;
  // console.log("check conn string >>> ", connString);
  await mongoose.connect(connString);
};
