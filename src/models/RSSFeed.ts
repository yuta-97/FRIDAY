import mongoose, { Document, Schema } from "mongoose";

export interface IRSSFeed {
  url: string;
  title: string;
  description?: string;
  lastBuildDate?: Date;
  isActive: boolean;
}

export interface IRSSFeedDocument extends Omit<IRSSFeed, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const RSSFeedSchema: Schema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    lastBuildDate: { type: Date },
    isActive: { type: Boolean, required: true, default: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IRSSFeedDocument>("RSSFeed", RSSFeedSchema);
