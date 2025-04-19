import express from 'express';
import { validateAdmin } from "../middlewares/validate.js";
import User from '../models/User.js';
import Bots from '../models/Bots.js';
import BotTransaction from '../models/BotTransaction.js';
import Credit from '../models/Credit.js';

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.send('This is a admin route');
});

// Get admin dashboard analytics
router.get('/analytics', validateAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalBots,
      totalTransactions,
      totalRevenue,
      recentUsers,
      recentTransactions,
      recentPurchases
    ] = await Promise.all([
      User.countDocuments(),
      Bots.countDocuments(),
      BotTransaction.countDocuments(),
      BotTransaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      BotTransaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('ownerId', 'name email')
        .populate('botId', 'name'),
      Credit.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
    ]);

    // Get total interactions for each bot
    const botInteractions = await BotTransaction.aggregate([
      {
        $group: {
          _id: "$botId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Update bot interaction counts
    await Promise.all(
      botInteractions.map(async (interaction) => {
        await Bots.findByIdAndUpdate(interaction._id, {
          totalInteractions: interaction.count
        });
      })
    );

    res.json({
      analytics: {
        totalUsers,
        totalBots,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentUsers,
      recentTransactions: recentTransactions.map(transaction => ({
        _id: transaction._id,
        amount: transaction.amount,
        userId: {
          name: transaction.ownerId?.name || 'Unknown User',
          email: transaction.ownerId?.email || 'No email'
        },
        botId: {
          name: transaction.botId?.name || 'Unknown Bot'
        },
        createdAt: transaction.createdAt
      })),
      recentPurchases: recentPurchases.map(purchase => ({
        _id: purchase._id,
        amount: purchase.amount,
        price: purchase.price,
        userId: {
          name: purchase.userId?.name || 'Unknown User',
          email: purchase.userId?.email || 'No email'
        },
        status: purchase.status,
        createdAt: purchase.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).send('Error fetching analytics');
  }
});

// Users Management
router.get('/users', validateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

router.get('/users/:id', validateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    res.status(500).send('Error fetching user');
  }
});

router.put('/users/:id', validateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

router.delete('/users/:id', validateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send('User not found');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});

// Bots Management
router.get('/bots', validateAdmin, async (req, res) => {
  try {
    const bots = await Bots.find().populate('owner', 'name email');
    res.json(bots);
  } catch (error) {
    res.status(500).send('Error fetching bots');
  }
});

router.get('/bots/:id', validateAdmin, async (req, res) => {
  try {
    const bot = await Bots.findById(req.params.id).populate('owner', 'name email');
    if (!bot) return res.status(404).send('Bot not found');
    res.json(bot);
  } catch (error) {
    res.status(500).send('Error fetching bot');
  }
});

router.put('/bots/:id', validateAdmin, async (req, res) => {
  try {
    const bot = await Bots.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('owner', 'name email');
    if (!bot) return res.status(404).send('Bot not found');
    res.json(bot);
  } catch (error) {
    res.status(500).send('Error updating bot');
  }
});

router.delete('/bots/:id', validateAdmin, async (req, res) => {
  try {
    const bot = await Bots.findByIdAndDelete(req.params.id);
    if (!bot) return res.status(404).send('Bot not found');
    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    res.status(500).send('Error deleting bot');
  }
});

// Transactions Management
router.get('/transactions', validateAdmin, async (req, res) => {
  try {
    const transactions = await BotTransaction.find()
      .populate('ownerId', 'name email')
      .populate('botId', 'name')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).send('Error fetching transactions');
  }
});

router.get('/transactions/:id', validateAdmin, async (req, res) => {
  try {
    const transaction = await BotTransaction.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('botId', 'name');
    if (!transaction) return res.status(404).send('Transaction not found');
    res.json(transaction);
  } catch (error) {
    res.status(500).send('Error fetching transaction');
  }
});

// Credit Purchases Management
router.get('/purchases', validateAdmin, async (req, res) => {
  try {
    const purchases = await Credit.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).send('Error fetching purchases');
  }
});

router.get('/purchases/:id', validateAdmin, async (req, res) => {
  try {
    const purchase = await Credit.findById(req.params.id)
      .populate('userId', 'name email');
    if (!purchase) return res.status(404).send('Purchase not found');
    res.json(purchase);
  } catch (error) {
    res.status(500).send('Error fetching purchase');
  }
});

// Get admin user info
router.get('/info', validateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    res.status(500).send('Error fetching user info');
  }
});

// Bot Interaction Analytics
router.get('/bot-analytics', validateAdmin, async (req, res) => {
  try {
    // Get total interactions per bot
    const botInteractions = await BotTransaction.aggregate([
      {
        $group: {
          _id: "$botId",
          totalInteractions: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          averageRating: { $avg: "$rating" }
        }
      },
      {
        $lookup: {
          from: "bots",
          localField: "_id",
          foreignField: "_id",
          as: "botDetails"
        }
      },
      {
        $unwind: "$botDetails"
      },
      {
        $project: {
          botId: "$_id",
          botName: "$botDetails.name",
          totalInteractions: 1,
          totalRevenue: 1,
          averageRating: 1,
          category: "$botDetails.category",
          isPublic: "$botDetails.isPublic"
        }
      },
      {
        $sort: { totalInteractions: -1 }
      }
    ]);

    // Get daily interactions for the last 30 days
    const dailyInteractions = await BotTransaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            botId: "$botId"
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "bots",
          localField: "_id.botId",
          foreignField: "_id",
          as: "botDetails"
        }
      },
      {
        $unwind: "$botDetails"
      },
      {
        $project: {
          date: "$_id.date",
          botName: "$botDetails.name",
          count: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Get interactions by category
    const categoryStats = await BotTransaction.aggregate([
      {
        $lookup: {
          from: "bots",
          localField: "botId",
          foreignField: "_id",
          as: "botDetails"
        }
      },
      {
        $unwind: "$botDetails"
      },
      {
        $group: {
          _id: "$botDetails.category",
          totalInteractions: { $sum: 1 },
          totalRevenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { totalInteractions: -1 }
      }
    ]);

    res.json({
      botInteractions,
      dailyInteractions,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching bot analytics:', error);
    res.status(500).send('Error fetching bot analytics');
  }
});

export default router;