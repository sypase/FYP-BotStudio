import express from "express";
import BotTransaction from "../models/BotTransaction.js";
import Bots from "../models/Bots.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

// Get all bot transactions for a user
router.get("/", validate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all transactions for the user
    const transactions = await BotTransaction.find({ ownerId: userId })
      .populate('botId', 'name')
      .sort({ createdAt: -1 });

    // Format the response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      botId: transaction.botId?._id || null,
      botName: transaction.botId?.name || 'Unknown Bot',
      input: transaction.input,
      response: transaction.response,
      createdAt: transaction.createdAt,
      status: transaction.status,
      processingTime: transaction.processingTime
    }));

    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching bot transactions:", error);
    res.status(500).json({ error: "Failed to fetch bot transactions" });
  }
});

// Get recent bot transactions (last 10)
router.get("/recent", validate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent transactions for the user
    const transactions = await BotTransaction.find({ ownerId: userId })
      .populate('botId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Format the response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      botId: transaction.botId?._id || null,
      botName: transaction.botId?.name || 'Unknown Bot',
      input: transaction.input,
      response: transaction.response,
      createdAt: transaction.createdAt,
      status: transaction.status,
      processingTime: transaction.processingTime
    }));

    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

// Create a new bot transaction
router.post("/", validate, async (req, res) => {
  try {
    const { botId, input, response, metadata = {} } = req.body;
    const userId = req.user._id;

    // Create new transaction
    const transaction = new BotTransaction({
      botId,
      ownerId: userId,
      input,
      response,
      metadata,
      status: 'success',
      processingTime: metadata.processingTime || 0
    });

    await transaction.save();

    res.status(201).json({ transaction });
  } catch (error) {
    console.error("Error creating bot transaction:", error);
    res.status(500).json({ error: "Failed to create bot transaction" });
  }
});

export default router; 