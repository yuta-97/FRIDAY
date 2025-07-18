import mongoose, { Document, Schema } from "mongoose";

export interface IRSSArticle {
  feedId: string;
  title: string;
  link: string;
  description?: string;
  pubDate: Date;
  guid: string;
  author?: string;
  categories?: string[];
  isProcessed: boolean;
}

export interface IRSSArticleDocument extends Omit<IRSSArticle, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const RSSArticleSchema: Schema = new Schema(
  {
    feedId: { type: Schema.Types.ObjectId, ref: "RSSFeed", required: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    description: { type: String },
    pubDate: { type: Date, required: true },
    guid: { type: String, required: true, unique: true },
    author: { type: String },
    categories: [{ type: String }],
    isProcessed: { type: Boolean, required: true, default: false }
  },
  {
    timestamps: true
  }
);

// 복합 인덱스 설정
RSSArticleSchema.index({ feedId: 1, guid: 1 }, { unique: true });
RSSArticleSchema.index({ pubDate: -1 });
RSSArticleSchema.index({ isProcessed: 1 });

export default mongoose.model<IRSSArticleDocument>(
  "RSSArticle",
  RSSArticleSchema
);
