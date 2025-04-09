import express from "express";
import { validate } from "../middlewares/validate.js";
import Bot from "../models/Bots.js";
import Scrape from "../models/Scrape.js";
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
      .select("name botModelId trainingStatus isPublic createdAt");

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
  const { scrapeId, name, botModel = "gpt-4o-mini-2024-07-18" } = req.body;

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
  const { isPublic } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Bot ID is required",
    });
  }

  try {
    const bot = await Bot.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { isPublic },
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
// Route to get a bot by ID
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
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot not found",
      });
    }

    res.json({
      success: true,
      message: "Bot retrieved successfully",
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
// Route to get all public bots
router.get("/public", async (req, res) => {
  try {
    const bots = await Bot.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .select("name botModelId trainingStatus isPublic createdAt");

    res.json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error("Get public bots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public bots",
      error: error.message,
    });
  }
});

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
    }).select("name botModelId trainingStatus isPublic owner");

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

    // Interact with the bot using standardized system message
    const response = await interactWithBot(
      bot.botModelId,
      message,
      bot.name // Company name for system message
    );

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

async function createBotRecord({ name, owner, fileId, jobId }) {
  try {
    const bot = new Bot({
      name,
      owner,
      botModelId: jobId,
      trainingStatus: "pending",
      fileId,
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
