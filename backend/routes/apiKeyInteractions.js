import express from 'express';
import { validateApiKey } from '../middlewares/validateApiKey.js';
import Bot from '../models/Bots.js';
import Credit from '../models/Credit.js';
import BotTransaction from '../models/BotTransaction.js';
import { interactWithBot } from '../utils/interactWithBot.js';

const router = express.Router();

// List all bots for the API key user
router.get('/bots', validateApiKey, async (req, res) => {
  console.log("apikey");
  console.log(req.apiKey);
  console.log(req.apiKey.user);
  
  
  try {
    const bots = await Bot.find({ owner: req.apiKey.user })
      .sort({ createdAt: -1 })
      .select('_id name botModelId trainingStatus isPublic isActive category totalInteractions rating createdAt');

    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Get bot details
router.get('/bot/:botId', validateApiKey, async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.botId);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Check if the bot belongs to the API key owner
    if (bot.owner.toString() !== req.apiKey.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to bot' });
    }

    res.json({
      id: bot._id,
      name: bot.name,
      botModelId: bot.botModelId,
      trainingStatus: bot.trainingStatus,
      isPublic: bot.isPublic,
      isActive: bot.isActive,
      category: bot.category,
      totalInteractions: bot.totalInteractions,
      rating: bot.rating,
      createdAt: bot.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bot details' });
  }
});

// Interact with bot
router.post('/bot/:botId/interact', validateApiKey, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const bot = await Bot.findById(req.params.botId);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Check if the bot belongs to the API key owner
    if (bot.owner.toString() !== req.apiKey.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to bot' });
    }

    // Check if bot is active
    if (!bot.isActive) {
      return res.status(400).json({ error: 'Bot is not active' });
    }

    // Check if bot is ready for interaction
    if (bot.trainingStatus !== "completed") {
      return res.status(423).json({
        error: `Bot training in progress. Current status: ${bot.trainingStatus}`,
        status: bot.trainingStatus,
      });
    }

    // Check user credits
    const credit = await Credit.findOne({ userId: req.apiKey.user });
    if (!credit || credit.balance < 1) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Record start time for processing time calculation
    const startTime = Date.now();

    // Interact with the bot
    const response = await interactWithBot(
      bot.botModelId,
      message,
      bot.name
    );

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Deduct credits
    credit.balance -= 1;
    await credit.save();

    // Increment bot interactions
    bot.totalInteractions += 1;
    await bot.save();

    // Create bot transaction
    const botTransaction = new BotTransaction({
      botId: bot._id,
      ownerId: req.apiKey.user,
      input: message,
      response: response.choices[0]?.message?.content || "No response from bot",
      metadata: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
      processingTime,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    await botTransaction.save();

    res.json({
      success: true,
      data: {
        response: response.choices[0]?.message?.content || "No response from bot",
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        processingTime,
        remainingCredits: credit.balance
      }
    });
  } catch (error) {
    console.error("Error interacting with bot:", error);
    const statusCode = error.statusCode || (error.message.includes("rate limit") ? 429 : 500);
    
    res.status(statusCode).json({
      success: false,
      error: error.message.includes("model")
        ? "This bot is currently unavailable. Please try again later."
        : error.message || "Failed to interact with bot"
    });
  }
});

// Get credit balance
router.get('/credits', validateApiKey, async (req, res) => {
  try {
    const credit = await Credit.findOne({ userId: req.apiKey.user });
    console.log(credit);
    
    if (!credit) {
      return res.status(404).json({ error: 'Credit balance not found' });
    }

    res.json({
      balance: credit.balance,
      lastUpdated: credit.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
});

export default router; 