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
  isActive: {
    type: Boolean,
    default: true,
  },
  fileId: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ["Customer Service", "Sales", "Support", "Education", "Entertainment", "Business", "Other"],
    default: "Other",
  },
  totalInteractions: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Bot", BotSchema);
