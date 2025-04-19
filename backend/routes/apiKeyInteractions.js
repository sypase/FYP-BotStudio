import express from 'express';
import { validateApiKey } from '../middlewares/validateApiKey.js';
import Bot from '../models/Bots.js';
import Credit from '../models/Credit.js';

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

    // TODO: Implement actual bot interaction logic here
    // For now, return a mock response
    res.json({
      response: `Bot received your message: "${message}"`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to interact with bot' });
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