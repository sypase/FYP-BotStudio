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
  botModelId: {
    type: String,
    required: true,
    default: "gpt-4",
  },
  trainingStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  fileId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Bot", BotSchema);
