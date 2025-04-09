import mongoose from "mongoose";

const scrapeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  url: { type: String, required: false }, // URL is optional
  content: [String],
  qaPairs: [{ question: String, answer: String }],
  sourceType: { type: String, enum: ["website", "csv_upload"], required: true }, // Defines the source type
  s3FileUrl: { type: String, required: false }, // Store full S3 URL
  s3FileName: { type: String, required: false }, // Store S3 filename
  createdAt: { type: Date, default: Date.now },
});

const Scrape = mongoose.model("Scrape", scrapeSchema);

export default Scrape;
