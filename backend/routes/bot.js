import express from "express";
import { validate } from "../middlewares/validate.js";
import Bot from "../models/Bots.js";
import Scrape from "../models/Scrape.js";
import User from "../models/User.js";
import BotTransaction from "../models/BotTransaction.js";
import {
  uploadFile,
  fineTune,
  getFineTuneJob,
  convertToJSONL,
  interactWithBot,
} from "../utils/openai.js";
import { getS3FileContent } from "../utils/s3Helper.js";
import fs from "fs";
import { promisify } from "util";

const router = express.Router();

/**
 * @route GET /api/bot
 * @desc Get all bots for authenticated user
 * @access Private
 */
router.get("/", validate, async (req, res) => {
  try {
    const bots = await Bot.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .select("name botModelId trainingStatus isPublic isActive createdAt");

    res.json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error("Get bots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bots",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/bot/create
 * @desc Create a new bot from a scrape
 * @access Private
 */
router.post("/create", validate, async (req, res) => {
  const { scrapeId, name, botModel = "gpt-4o-mini-2024-07-18", category = "Other" } = req.body;

  if (!scrapeId) {
    return res.status(400).json({
      success: false,
      message: "Scrape ID is required",
    });
  }

  try {
    // Validate and get scrape
    const scrape = await validateAndGetScrape(scrapeId, req.user._id);

    // Check for existing bot
    await checkExistingBot(scrape.s3FileName, req.user._id);

    // Get and process training data
    const qaPairs = await getAndProcessTrainingData(scrape.s3FileName);
    const jsonlData = convertToJSONL(qaPairs, name || "My Bot");

    // Upload to OpenAI and start fine-tuning
    const { fileId, jobId } = await startFineTuningProcess(jsonlData, botModel);

    console.log("Fine-tuning job started with ID:", jobId);
    console.log("File ID for fine-tuning:", fileId);

    // Create bot record
    const bot = await createBotRecord({
      name: name || `Bot from ${scrape.name}`,
      owner: req.user._id,
      fileId: scrape.s3FileName,
      jobId,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Bot creation started",
      data: {
        botId: bot._id,
        fineTuneJobId: jobId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Create bot error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create bot",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/bot/finetunestatus
 * @desc Check fine-tune status and update bot
 * @access Private
 */
router.post("/finetunestatus", validate, async (req, res) => {
  const { botId } = req.body;

  if (!botId) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  try {
    const bot = await Bot.findOne({
      _id: botId,
      owner: req.user._id,
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    if (bot.trainingStatus === "completed") {
      return res.json({
        success: true,
        message: "Training already completed",
        data: bot,
      });
    }

    const updatedBot = await checkAndUpdateTrainingStatus(bot);

    res.json({
      success: true,
      message: "Fine-tune status checked",
      data: {
        botId: updatedBot._id,
        status: updatedBot.trainingStatus,
        botModelId: updatedBot.botModelId,
      },
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to check status",
      error: error.message,
    });
  }
});

// Route to delete a bot
router.delete("/delete/:id", validate, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  try {
    const bot = await Bot.findOneAndDelete({
      _id: id,
      owner: req.user._id,
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.json({
      success: true,
      message: "Bot deleted successfully",
    });
  } catch (error) {
    console.error("Delete bot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete bot",
      error: error.message,
    });
  }
});

// Route to update bot's public status
router.patch("/update/:id", validate, async (req, res) => {
  const { id } = req.params;
  const { name, isPublic, isActive, category } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  try {
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    const bot = await Bot.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      updateData,
      { new: true }
    );

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.json({
      success: true,
      message: "Bot updated successfully",
      data: bot,
    });
  } catch (error) {
    console.error("Update bot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bot",
      error: error.message,
    });
  }
});

// Route to get all public bots
router.get("/public", async (req, res) => {
  try {
    const bots = await Bot.find({ isPublic: true, isActive: true })
      .select("name description category owner totalInteractions rating isActive")
      .populate("owner", "name")
      .sort({ totalInteractions: -1 })

    console.log(bots)

    res.json({
      success: true,
      data: bots,
    })
  } catch (error) {
    console.error("Error fetching public bots:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch public bots",
    })
  }
})

// Get trending bots
router.get("/trending", async (req, res) => {
  try {
    const bots = await Bot.find({ isPublic: true, isActive: true })
      .select("name description category owner totalInteractions rating isActive")
      .populate("owner", "name")
      .sort({ totalInteractions: -1, rating: -1 })
      .limit(6)

    res.json({
      success: true,
      data: bots,
    })
  } catch (error) {
    console.error("Error fetching trending bots:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending bots",
    })
  }
})

// Get public bot details
router.get("/public/:id", async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, isPublic: true })
      .select("name description category owner totalInteractions rating isActive")
      .populate("owner", "username")

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      })
    }

    res.json({
      success: true,
      data: bot,
    })
  } catch (error) {
    console.error("Error fetching public bot:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch bot details",
    })
  }
})

// Get bot by ID
router.get("/:id", validate, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  try {
    const bot = await Bot.findOne({
      _id: id,
      owner: req.user._id,
    }).select("name botModelId trainingStatus isPublic isActive createdAt");

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.json({
      success: true,
      data: bot,
    });
  } catch (error) {
    console.error("Get bot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bot",
      error: error.message,
    });
  }
});

// Interact with public bot
router.post("/public/interact/:id", async (req, res) => {
  try {
    const { message } = req.body
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      })
    }

    const bot = await Bot.findOne({ _id: req.params.id, isPublic: true, isActive: true })
    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found or inactive",
      })
    }

    // Check user credits
    const user = await User.findById(req.user.id)
    if (user.credits < 1) {
      return res.status(402).json({
        success: false,
        message: "Insufficient credits",
      })
    }

    // Deduct credits
    user.credits -= 1
    await user.save()

    // Increment bot interactions
    bot.totalInteractions += 1
    await bot.save()

    // Create bot transaction
    const botTransaction = new BotTransaction({
      botId: bot._id,
      userId: req.user.id,
      input: message,
      response: "Bot response here", // Replace with actual bot response
      status: "success",
      processingTime: 0, // Replace with actual processing time
    })
    await botTransaction.save()

    res.json({
      success: true,
      data: {
        response: "Bot response here", // Replace with actual bot response
      },
      userCredits: user.credits,
    })
  } catch (error) {
    console.error("Error interacting with public bot:", error)
    res.status(500).json({
      success: false,
      message: "Failed to interact with bot",
    })
  }
})

/**
 * @route POST /api/bot/interact/:id
 * @desc Interact with a trained bot with system context
 * @access Private (or Public if bot isPublic)
 */
router.post("/interact/:id", validate, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Valid message is required",
    });
  }

  try {
    // Find the bot with access control
    const bot = await Bot.findOne({
      _id: id,
      ...(req.user?._id
        ? { $or: [{ owner: req.user._id }, { isPublic: true }] }
        : { isPublic: true }),
    }).select("name botModelId trainingStatus isPublic owner isActive");

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found or you don't have access",
      });
    }

    // Verify bot is ready for interaction
    if (bot.trainingStatus !== "completed") {
      return res.status(423).json({
        // 423 Locked status code
        success: false,
        message: `Bot training in progress. Current status: ${bot.trainingStatus}`,
        status: bot.trainingStatus,
      });
    }

    // Check if bot is active
    if (!bot.isActive) {
      return res.status(423).json({
        success: false,
        message: "This bot is currently inactive",
      });
    }

    // Check if user has enough credits (only for authenticated users)
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.credits < 1) {
        return res.status(403).json({
          success: false,
          message: "Insufficient credits. Please add more credits to continue.",
        });
      }
    }

    // Record start time for processing time calculation
    const startTime = Date.now();

    // Interact with the bot using standardized system message
    const response = await interactWithBot(
      bot.botModelId,
      message,
      bot.name // Company name for system message
    );

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Format response
    const result = {
      botId: bot._id,
      botName: bot.name,
      isPublic: bot.isPublic,
      response: response.choices[0]?.message?.content || "No response from bot",
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };

    // Create transaction record and update user credits if authenticated
    if (req.user) {
      // Create transaction record
      const transaction = new BotTransaction({
        botId: bot._id,
        ownerId: req.user._id,
        input: message,
        response: result.response,
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
      
      await transaction.save();
      
      // Deduct credits from user
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { credits: -1 } },
        { new: true }
      );
      
      // Include updated credit balance in response
      result.userCredits = updatedUser.credits;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(`Bot interaction error [${id}]:`, error);

    // Handle specific OpenAI API errors
    const statusCode =
      error.statusCode || (error.message.includes("rate limit") ? 429 : 500);

    res.status(statusCode).json({
      success: false,
      message: error.message.includes("model")
        ? "This bot is currently unavailable. Please try again later."
        : error.message || "Failed to interact with bot",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Route to duplicate a bot
router.post("/duplicate/:id", validate, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Bot name is required",
    });
  }

  try {
    // Find the original bot
    const originalBot = await Bot.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!originalBot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    // Create a new bot with the same properties but a different name
    const newBot = new Bot({
      name,
      owner: req.user._id,
      botModelId: originalBot.botModelId,
      trainingStatus: originalBot.trainingStatus,
      isPublic: false, // Default to private for duplicated bots
      isActive: true,  // Default to active for duplicated bots
      fileId: originalBot.fileId,
    });

    await newBot.save();

    res.status(201).json({
      success: true,
      message: "Bot duplicated successfully",
      data: newBot,
    });
  } catch (error) {
    console.error("Duplicate bot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to duplicate bot",
      error: error.message,
    });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", validate, async (req, res) => {
  try {
    // Get total bots count
    const totalBots = await Bot.countDocuments({ owner: req.user._id });
    
    // Get active bots count
    const activeBots = await Bot.countDocuments({ 
      owner: req.user._id,
      isActive: true 
    });
    
    // Get public bots count
    const publicBots = await Bot.countDocuments({ 
      owner: req.user._id,
      isPublic: true 
    });
    
    // Get total interactions
    const totalInteractions = await BotTransaction.countDocuments({ 
      userId: req.user._id 
    });
    
    // Get recent bot transactions
    const recentTransactions = await BotTransaction.find({ 
      userId: req.user._id 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('botId', 'name');

    res.json({
      success: true,
      data: {
        totalBots,
        activeBots,
        publicBots,
        totalInteractions,
        recentTransactions
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
});

// Get user conversations
router.get("/conversations", validate, async (req, res) => {
  try {
    const conversations = await BotTransaction.find({ 
      userId: req.user._id 
    })
      .sort({ createdAt: -1 })
      .populate('botId', 'name')
      .select('botId input response status createdAt processingTime');

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
});

// Helper functions
async function validateAndGetScrape(scrapeId, userId) {
  const scrape = await Scrape.findOne({
    _id: scrapeId,
    ownerId: userId,
  });

  if (!scrape) {
    const error = new Error("Scrape not found");
    error.statusCode = 404;
    throw error;
  }

  return scrape;
}

async function checkExistingBot(fileId, userId) {
  const existingBot = await Bot.findOne({
    fileId,
    owner: userId,
  });

  if (existingBot) {
    const error = new Error("A bot already exists for this scrape");
    error.statusCode = 400;
    error.data = existingBot;
    throw error;
  }
}

async function getAndProcessTrainingData(fileName) {
  try {
    const fileContent = await getS3FileContent(fileName);
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Training data processing error:", error);
    throw new Error("Failed to process training data");
  }
}

async function startFineTuningProcess(jsonlData, model) {
  try {
    // Upload the file to OpenAI
    console.log("Uploading file to OpenAI for fine-tuning...");
    console.log(jsonlData);

    const fileResponse = await uploadFile(jsonlData);

    if (!fileResponse?.id) {
      throw new Error("OpenAI file upload failed - no file ID returned");
    }

    console.log("File uploaded successfully with ID:", fileResponse.id);

    // Start fine-tuning job
    const fineTuneResponse = await fineTune(model, fileResponse.id);

    if (!fineTuneResponse?.id) {
      throw new Error("Fine-tuning job creation failed - no job ID returned");
    }

    console.log("Fine-tuning job created with ID:", fineTuneResponse.id);

    return {
      fileId: fileResponse.id,
      jobId: fineTuneResponse.id,
    };
  } catch (error) {
    console.error("Fine-tuning process error:", error);
    throw new Error(`Fine-tuning failed: ${error.message}`);
  }
}

async function createBotRecord({ name, owner, fileId, jobId, category }) {
  try {
    const bot = new Bot({
      name,
      owner,
      botModelId: jobId,
      trainingStatus: "pending",
      fileId,
      category,
    });

    await bot.save();
    return bot;
  } catch (error) {
    console.error("Bot creation error:", error);
    throw new Error("Failed to create bot record");
  }
}

async function checkAndUpdateTrainingStatus(bot) {
  try {
    const job = await getFineTuneJob(bot.botModelId);

    if (!job) {
      throw new Error("Fine-tune job not found");
    }

    const newStatus = mapOpenAIStatus(job.status);

    if (newStatus !== bot.trainingStatus) {
      bot.trainingStatus = newStatus;

      if (newStatus === "completed" && job.fine_tuned_model) {
        bot.botModelId = job.fine_tuned_model;
      }

      await bot.save();
    }

    return bot;
  } catch (error) {
    console.error("Status update error:", error);
    throw new Error("Failed to check and update training status");
  }
}

function mapOpenAIStatus(status) {
  const statusMap = {
    succeeded: "completed",
    failed: "failed",
  };
  return statusMap[status] || "pending";
}

export default router;
