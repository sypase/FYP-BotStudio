import express from "express";
import BotTransaction from "../models/BotTransaction.js";
import Bots from "../models/Bots.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// Get bot interaction analytics
router.get("/analytics", validate, async (req, res) => {
  try {
    // Get all bots owned by the user
    const userBots = await Bots.find({ owner: req.user._id });
    const botIds = userBots.map(bot => bot._id);
    
    // Get interaction counts for each bot
    const interactions = await BotTransaction.aggregate([
      {
        $match: {
          botId: { $in: botIds },
          ownerId: req.user._id
        }
      },
      {
        $group: {
          _id: "$botId",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Map bot IDs to names
    const botMap = {};
    userBots.forEach(bot => {
      botMap[bot._id.toString()] = bot.name;
    });
    
    // Format the response
    const formattedInteractions = interactions.map(item => ({
      botId: item._id,
      botName: botMap[item._id.toString()] || "Unknown Bot",
      count: item.count
    }));
    
    res.json({ interactions: formattedInteractions });
  } catch (error) {
    console.error("Error fetching bot analytics:", error);
    res.status(500).json({ message: "Failed to fetch bot analytics" });
  }
});

// Get recent bot transactions
router.get("/recent", validate, async (req, res) => {
  try {
    // Get all bots owned by the user
    const userBots = await Bots.find({ owner: req.user._id });
    const botIds = userBots.map(bot => bot._id);
    
    // Get recent transactions
    const transactions = await BotTransaction.find({
      botId: { $in: botIds },
      ownerId: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Map bot IDs to names
    const botMap = {};
    userBots.forEach(bot => {
      botMap[bot._id.toString()] = bot.name;
    });
    
    // Format the response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      botId: transaction.botId,
      botName: botMap[transaction.botId.toString()] || "Unknown Bot",
      input: transaction.input,
      response: transaction.response,
      createdAt: transaction.createdAt,
      status: transaction.status
    }));
    
    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ message: "Failed to fetch recent transactions" });
  }
});

// Create a new bot transaction
router.post("/", validate, async (req, res) => {
  try {
    const { botId, input, response, metadata = {} } = req.body;
    
    // Check if the bot exists and belongs to the user
    const bot = await Bots.findOne({ _id: botId, owner: req.user._id });
    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }
    
    // Check if user has enough credits
    if (req.user.credits < 1) {
      return res.status(403).json({ message: "Insufficient credits" });
    }
    
    // Create the transaction
    const transaction = new BotTransaction({
      botId,
      ownerId: req.user._id,
      input,
      response,
      metadata,
      status: "success",
      processingTime: metadata.processingTime || 0,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    
    await transaction.save();
    
    // Deduct credits from user
    await req.user.updateOne({ $inc: { credits: -1 } });
    
    res.status(201).json({ transaction });
  } catch (error) {
    console.error("Error creating bot transaction:", error);
    res.status(500).json({ message: "Failed to create bot transaction" });
  }
});

export default router; 