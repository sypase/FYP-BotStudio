import express from "express";
import BotTransaction from "../models/BotTransaction.js";
import Bots from "../models/Bots.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// Get bot interaction stats for all bots
router.get("/stats", validate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all bots owned by the user
    const bots = await Bots.find({ owner: userId }).select('name');

    // Get all transactions for these bots
    const transactions = await BotTransaction.find({ 
      ownerId: userId 
    }).populate('botId', 'name');

    // Group interactions by bot
    const botInteractions = bots.map(bot => {
      const botTransactions = transactions.filter(t => t.botId && t.botId._id && t.botId._id.toString() === bot._id.toString());
      return {
        botId: bot._id,
        botName: bot.name,
        count: botTransactions.length
      };
    });

    // Sort by count in descending order
    botInteractions.sort((a, b) => b.count - a.count);

    res.json({ 
      success: true,
      interactions: botInteractions 
    });
  } catch (error) {
    console.error("Error fetching bot interaction stats:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch bot interaction stats",
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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

// Get analytics for all bots owned by the user
router.get("/user/analytics", validate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all bots owned by the user
    const bots = await Bots.find({ owner: userId })
      .select('name isPublic isActive category createdAt');

    // Get all transactions for these bots
    const transactions = await BotTransaction.find({ 
      ownerId: userId 
    }).populate('botId', 'name');

    // Calculate total interactions
    const totalInteractions = transactions.length;

    // Calculate interactions per bot
    const botAnalytics = bots.map(bot => {
      const botTransactions = transactions.filter(t => t.botId && t.botId._id && t.botId._id.toString() === bot._id.toString());
      const successCount = botTransactions.filter(t => t.status === 'success').length;
      const errorCount = botTransactions.filter(t => t.status === 'error').length;
      const totalBotInteractions = botTransactions.length;
      
      return {
        botId: bot._id,
        botName: bot.name,
        isPublic: bot.isPublic,
        isActive: bot.isActive,
        category: bot.category,
        totalInteractions: totalBotInteractions,
        successRate: totalBotInteractions > 0 
          ? (successCount / totalBotInteractions) * 100 
          : 0,
        errorRate: totalBotInteractions > 0 
          ? (errorCount / totalBotInteractions) * 100 
          : 0,
        avgProcessingTime: totalBotInteractions > 0
          ? botTransactions.reduce((sum, t) => sum + (t.processingTime || 0), 0) / totalBotInteractions
          : 0,
        lastInteraction: botTransactions.length > 0
          ? botTransactions[0].createdAt
          : null
      };
    });

    // Calculate daily usage across all bots
    const dailyUsage = {};
    transactions.forEach(transaction => {
      if (transaction.createdAt) {
        const date = new Date(transaction.createdAt).toISOString().split('T')[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = 0;
        }
        dailyUsage[date]++;
      }
    });

    // Convert to array format for frontend
    const dailyUsageArray = Object.entries(dailyUsage)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        totalInteractions,
        botAnalytics,
        dailyUsage: dailyUsageArray,
        summary: {
          totalBots: bots.length,
          activeBots: bots.filter(b => b.isActive).length,
          publicBots: bots.filter(b => b.isPublic).length,
          averageSuccessRate: botAnalytics.length > 0
            ? botAnalytics.reduce((sum, b) => sum + b.successRate, 0) / botAnalytics.length
            : 0
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user bot analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bot analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 