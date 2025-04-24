import express from "express";
import BotTransaction from "../models/BotTransaction.js";
import Bots from "../models/Bots.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// Get analytics for a specific bot
router.get("/:id", validate, async (req, res) => {
  try {
    const botId = req.params.id;
    const userId = req.user._id;

    // Find the bot and check if the user is the owner
    const bot = await Bots.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    if (bot.owner.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to view this bot's analytics" });
    }

    // Get all interactions with this bot
    const interactions = await BotTransaction.find({ botId })
      .sort({ createdAt: -1 });

    // Calculate analytics
    const totalInteractions = interactions.length;
    
    // Group by date for daily usage
    const dailyUsage = {};
    interactions.forEach(interaction => {
      const date = new Date(interaction.createdAt).toISOString().split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = 0;
      }
      dailyUsage[date]++;
    });

    // Convert to array format for frontend
    const dailyUsageArray = Object.entries(dailyUsage).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get recent interactions (last 10)
    const recentInteractions = interactions.slice(0, 10);

    // Calculate average response time
    const responseTimes = interactions
      .filter(i => i.processingTime)
      .map(i => i.processingTime);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    res.json({
      totalInteractions,
      dailyUsage: dailyUsageArray,
      recentInteractions,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100, // Round to 2 decimal places
      successRate: interactions.length > 0
        ? (interactions.filter(i => i.status === 'success').length / interactions.length) * 100
        : 0
    });
  } catch (error) {
    console.error("Error fetching bot analytics:", error);
    res.status(500).json({ error: "Failed to fetch bot analytics" });
  }
});

// Get bot interaction stats for all bots
router.get("/stats", validate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all bot transactions for the user
    const transactions = await BotTransaction.find({ ownerId: userId })
      .populate('botId', 'name')
      .sort({ createdAt: -1 });

    // Group interactions by bot
    const botInteractions = {};
    transactions.forEach(transaction => {
      const botId = transaction.botId._id.toString();
      if (!botInteractions[botId]) {
        botInteractions[botId] = {
          botId,
          botName: transaction.botId.name,
          count: 0
        };
      }
      botInteractions[botId].count++;
    });

    // Convert to array and sort by count
    const interactions = Object.values(botInteractions).sort((a, b) => b.count - a.count);

    res.json({ interactions });
  } catch (error) {
    console.error("Error fetching bot interaction stats:", error);
    res.status(500).json({ error: "Failed to fetch bot interaction stats" });
  }
});

export default router; 