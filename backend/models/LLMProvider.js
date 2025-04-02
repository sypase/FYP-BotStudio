import mongoose from "mongoose";

const LLMProviderSchema = new mongoose.Schema({
  modelName: { type: String, required: true, unique: true },
  pricePerToken: { type: Number, required: true },
  apiKey: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("LLMProvider", LLMProviderSchema);
