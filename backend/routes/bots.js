// Get bot analytics
router.get("/:id/analytics", validate, async (req, res) => {
  try {
    const botId = req.params.id;
    const userId = req.user._id;

    // Find the bot and check if the user is the owner
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    if (bot.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to view this bot's analytics" });
    }

    // Get all interactions with this bot
    const interactions = await BotInteraction.find({ botId })
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
      .filter(i => i.responseTime)
      .map(i => i.responseTime);
    
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