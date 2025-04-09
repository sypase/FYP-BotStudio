import express from "express";
import { validate } from "../middlewares/validate.js";
import Bot from "../models/Bots.js";
import Scrape from "../models/Scrape.js";
import {
  uploadFile,
  fineTune,
  getFineTuneJob,
  convertToJSONL,
} from "../utils/openai.js";
import { getS3FileContent } from "../utils/s3Helper.js";

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
  const { scrapeId, name, botModel = "gpt-3.5-turbo" } = req.body;

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
  console.log("Starting fine-tuning process...");
  console.log("Model:", model);
  console.log("JSONL Data:", jsonlData);

  try {
    const fileResponse = await uploadFile(
      new Blob([jsonlData], { type: "application/jsonl" })
    );

    if (!fileResponse?.id) {
      throw new Error("OpenAI file upload failed");
    }
    console.log("File uploaded successfully:", fileResponse.id);

    const fineTuneResponse = "hello";

    // const fineTuneResponse = await fineTune(model, fileResponse.id);

    // if (!fineTuneResponse?.id) {
    //   throw new Error("Fine-tuning job creation failed");
    // }

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
