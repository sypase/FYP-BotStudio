import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Reference to LLM provider instead of storing API key directly
  llmProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LLMProvider",
    required: true,
  },
  botModelId: {
    type: String,
    required: true,
    default: "gpt-4",
  },
  trainingData: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scrape",
    },
  ],
  systemPrompt: {
    type: String,
    default: "You are a helpful assistant.",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Bot", BotSchema);
