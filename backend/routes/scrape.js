import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { OpenAI } from "openai";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import Scrape from "../models/Scrape.js";
import { validate } from "../middlewares/validate.js";
import pkg from "uuid";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
const { v4: uuidv4 } = pkg;

const router = express.Router();

// Initialize multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI clients
const standardOpenai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GitHub Inference AI client configuration
const githubOpenai = new OpenAI({
  baseURL:
    process.env.GITHUB_INFERENCE_ENDPOINT ||
    "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

// Initialize AWS S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function extractSiteContent(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let content = [];

    // Extract text from various HTML tags
    $("p, h1, h2, h3, h4, h5, h6").each((i, el) => {
      content.push($(el).text().trim());
    });
    console.log("Extracted content:", content);

    return content;
  } catch (error) {
    console.error("Error fetching site content:", error);
    return [];
  }
}

async function generateQAPairs(content) {
  try {
    // Create a more detailed prompt for question generation
    const questionPrompt = `Generate at least 50 diverse and comprehensive questions for a QA bot based on the following content. 
        Include factual questions, conceptual questions, and application questions to ensure thorough coverage.
        Return only the questions without numbering, each on a new line:\n\n${content}`;

    // Use GitHub's inference endpoint for question generation
    const questionResponse = await githubOpenai.chat.completions.create({
      model: process.env.GITHUB_MODEL_NAME || "gpt-4o",
      messages: [{ role: "user", content: questionPrompt }],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 1000,
    });

    // Clean up the response to remove numbering and empty lines
    let questions = questionResponse.choices[0].message.content
      .split("\n")
      .map((q) => q.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0);

    let qaPairs = [];

    for (const question of questions) {
      const answerPrompt = `Generate a customer support style answer for the question: '${question}' based on the following content. Be helpful, professional, and concise. Use a friendly tone and offer complete information:\n\n${content}`;

      // Use standard OpenAI for answer generation
      const answerResponse = await standardOpenai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: answerPrompt }],
      });

      const answer = answerResponse.choices[0].message.content.trim();
      qaPairs.push({
        question: question,
        answer: answer,
      });
    }
    return qaPairs;
  } catch (error) {
    console.error("Error generating QA pairs:", error);
    return [];
  }
}

async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const qaPairs = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on("data", (row) => {
        // Handle different CSV formats (question/answer or Q/A)
        const question = row.question || row.Question || row.Q;
        const answer = row.answer || row.Answer || row.A;

        if (question && answer) {
          qaPairs.push({
            question: question.trim(),
            answer: answer.trim(),
          });
        }
      })
      .on("end", () => {
        if (qaPairs.length === 0) {
          reject(new Error("No valid Q&A pairs found in CSV"));
        } else {
          resolve(qaPairs);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function saveToS3(qaPairs, filename = null) {
  const uniqueId = filename ? filename.split("_")[2].split(".")[0] : uuidv4();
  const newFilename = filename || `qa_pairs_${uniqueId}.json`;
  const jsonContent = JSON.stringify(qaPairs, null, 2);

  const params = {
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: newFilename,
    Body: jsonContent,
    ContentType: "application/json",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const fileUrl = `${
      process.env.CLOUDFLARE_S3_PUBLIC_URL || process.env.CLOUDFLARE_S3_ENDPOINT
    }/${process.env.CLOUDFLARE_BUCKET_NAME}/${newFilename}`;
    console.log(
      `QA pairs saved to Cloudflare R2 with filename: ${newFilename}`
    );
    return { fileUrl, filename: newFilename };
  } catch (error) {
    console.error("Error uploading to Cloudflare R2:", error);
    throw new Error("Error uploading to Cloudflare R2");
  }
}

async function deleteFromS3(filename) {
  const params = {
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: filename,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    console.log(`File ${filename} deleted from S3`);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Error deleting file from S3");
  }
}

// GET Route to fetch all scrapes (history)
router.get("/history", validate, async (req, res) => {
  try {
    const scrapes = await Scrape.find()
      .sort({ createdAt: -1 })
      .select("_id url createdAt s3FileUrl s3FileName sourceType");

    res.json({
      message: "Scrape history retrieved successfully",
      data: scrapes,
    });
  } catch (error) {
    console.error("Error fetching scrape history:", error);
    res.status(500).json({
      message: "Error fetching scrape history",
      error: error.message,
    });
  }
});

// GET Route to fetch a specific scrape by ID with all Q&A pairs
router.get("/:id", validate, async (req, res) => {
  try {
    const scrape = await Scrape.findById(req.params.id);

    if (!scrape) {
      return res.status(404).json({
        message: "Scrape not found",
      });
    }

    res.json({
      message: "Scrape retrieved successfully",
      data: {
        _id: scrape._id,
        url: scrape.url,
        createdAt: scrape.createdAt,
        s3FileUrl: scrape.s3FileUrl,
        s3FileName: scrape.s3FileName,
        sourceType: scrape.sourceType,
        qaPairs: scrape.qaPairs,
      },
    });
  } catch (error) {
    console.error("Error fetching scrape:", error);
    res.status(500).json({
      message: "Error fetching scrape",
      error: error.message,
    });
  }
});

// PUT Route to update a scrape's Q&A pairs
router.put("/:id", validate, async (req, res) => {
  try {
    const { qaPairs } = req.body;

    if (!qaPairs || !Array.isArray(qaPairs)) {
      return res.status(400).json({
        message: "QA pairs array is required",
      });
    }

    const scrape = await Scrape.findById(req.params.id);
    if (!scrape) {
      return res.status(404).json({
        message: "Scrape not found",
      });
    }

    // Update the S3 file
    const { fileUrl } = await saveToS3(qaPairs, scrape.s3FileName);

    // Update the database record
    scrape.qaPairs = qaPairs;
    scrape.s3FileUrl = fileUrl;
    await scrape.save();

    res.json({
      message: "Scrape updated successfully",
      data: {
        _id: scrape._id,
        url: scrape.url,
        createdAt: scrape.createdAt,
        updatedAt: scrape.updatedAt,
        s3FileUrl: scrape.s3FileUrl,
        sourceType: scrape.sourceType,
        qaPairs: scrape.qaPairs,
      },
    });
  } catch (error) {
    console.error("Error updating scrape:", error);
    res.status(500).json({
      message: "Error updating scrape",
      error: error.message,
    });
  }
});

// PATCH Route to add new Q&A pairs to an existing scrape
router.patch("/:id", validate, async (req, res) => {
  try {
    const { qaPairs } = req.body;

    if (!qaPairs || !Array.isArray(qaPairs)) {
      return res.status(400).json({
        message: "QA pairs array is required",
      });
    }

    const scrape = await Scrape.findById(req.params.id);
    if (!scrape) {
      return res.status(404).json({
        message: "Scrape not found",
      });
    }

    // Merge new Q&A pairs with existing ones
    const updatedQAPairs = [...scrape.qaPairs, ...qaPairs];

    // Update the S3 file
    const { fileUrl } = await saveToS3(updatedQAPairs, scrape.s3FileName);

    // Update the database record
    scrape.qaPairs = updatedQAPairs;
    scrape.s3FileUrl = fileUrl;
    await scrape.save();

    res.json({
      message: "Q&A pairs added successfully",
      data: {
        _id: scrape._id,
        url: scrape.url,
        createdAt: scrape.createdAt,
        updatedAt: scrape.updatedAt,
        s3FileUrl: scrape.s3FileUrl,
        sourceType: scrape.sourceType,
        qaPairs: scrape.qaPairs,
      },
    });
  } catch (error) {
    console.error("Error adding Q&A pairs:", error);
    res.status(500).json({
      message: "Error adding Q&A pairs",
      error: error.message,
    });
  }
});

// DELETE Route to delete a scrape
router.delete("/:id", validate, async (req, res) => {
  try {
    const scrape = await Scrape.findById(req.params.id);
    if (!scrape) {
      return res.status(404).json({
        message: "Scrape not found",
      });
    }

    // Delete from S3
    await deleteFromS3(scrape.s3FileName);

    // Delete from database
    await Scrape.findByIdAndDelete(req.params.id);

    res.json({
      message: "Scrape deleted successfully",
      data: {
        _id: scrape._id,
        url: scrape.url,
        sourceType: scrape.sourceType,
      },
    });
  } catch (error) {
    console.error("Error deleting scrape:", error);
    res.status(500).json({
      message: "Error deleting scrape",
      error: error.message,
    });
  }
});

// POST Route to scrape a website and store data
router.post("/", validate, async (req, res) => {
  console.log("Scraping website:", req.body.url);

  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "URL is required" });

  try {
    const content = await extractSiteContent(url);
    if (content.length === 0)
      return res.status(400).json({ message: "No content found" });

    const qaPairs = await generateQAPairs(content.join(" "));
    console.log("Generated QA Pairs:", qaPairs);

    // Save to S3 and get the URL
    const { fileUrl, filename } = await saveToS3(qaPairs);

    // Create and save the scrape record with S3 URL
    const scrape = new Scrape({
      url,
      content,
      qaPairs,
      s3FileName: filename,
      s3FileUrl: fileUrl,
      sourceType: "website",
    });
    await scrape.save();

    console.log("Scrape saved to database:", scrape);

    res.status(201).json({
      message: "Scrape completed successfully",
      data: {
        scrape: {
          _id: scrape._id,
          url: scrape.url,
          createdAt: scrape.createdAt,
          s3FileUrl: scrape.s3FileUrl,
          sourceType: scrape.sourceType,
          qaPairs: scrape.qaPairs,
        },
        fileUrl,
      },
    });
  } catch (error) {
    console.error("Error in POST /:", error);
    res.status(500).json({
      message: "Error processing request",
      error: error.message,
      details: error.response?.data?.message || error.stack,
    });
  }
});

// POST Route to upload CSV file with Q&A pairs
// POST Route to upload CSV file with Q&A pairs
router.post(
  "/upload-csv",
  validate,
  upload.single("qaFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      console.log("Received CSV file:", req.file.originalname);
      

      // Check file extension is .csv
      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();
      if (fileExtension !== "csv") {
        return res.status(400).json({ message: "Only CSV files are allowed" });
      }

      // Parse the CSV file with strict validation
      const qaPairs = await new Promise((resolve, reject) => {
        const pairs = [];
        let hasRequiredColumns = false;

        const stream = Readable.from(req.file.buffer.toString())
          .pipe(csv())
          .on("headers", (headers) => {
            // Convert headers to lowercase for case-insensitive check
            const lowerHeaders = headers.map((h) => h.toLowerCase());
            hasRequiredColumns =
              lowerHeaders.includes("question") &&
              lowerHeaders.includes("answer");

            if (!hasRequiredColumns) {
              stream.destroy(); // Stop processing if headers are invalid
              reject(
                new Error('CSV must contain "question" and "answer" columns')
              );
            }
          })
          .on("data", (row) => {
            // Ensure both question and answer exist and are not empty
            if (
              row.question &&
              row.answer &&
              row.question.trim() !== "" &&
              row.answer.trim() !== ""
            ) {
              pairs.push({
                question: row.question.trim(),
                answer: row.answer.trim(),
              });
            }
          })
          .on("end", () => {
            if (pairs.length === 0) {
              reject(new Error("No valid Q&A pairs found in CSV"));
            } else {
              resolve(pairs);
            }
          })
          .on("error", (error) => {
            reject(error);
          });
      });

      console.log("Parsed QA pairs from CSV:", qaPairs);

      // Save to S3 and get the URL
      const { fileUrl, filename } = await saveToS3(qaPairs);

      console.log("Uploaded to S3:", fileUrl);
      console.log("S3 filename:", filename);
      // Check if the file was uploaded successfully
      if (!fileUrl) {
        return res.status(500).json({
          message: "Error uploading file to S3",
        });
      }
      

      // Create and save the scrape record with S3 URL
      const scrape = new Scrape({
        qaPairs,
        s3FileName: filename,
        s3FileUrl: fileUrl,
        sourceType: "csv_upload",
      });
      await scrape.save();

      console.log("Scrape saved to database:", scrape);
      

      res.status(201).json({
        message: "CSV uploaded and processed successfully",
        data: {
          scrape: {
            _id: scrape._id,
            createdAt: scrape.createdAt,
            s3FileUrl: scrape.s3FileUrl,
            sourceType: scrape.sourceType,
            qaPairs: scrape.qaPairs,
          },
          fileUrl,
        },
      });
    } catch (error) {
      console.error("Error processing CSV upload:", error);

      let errorMessage = "Error processing CSV file";
      if (
        error.message.includes('must contain "question" and "answer" columns')
      ) {
        errorMessage =
          'CSV file must contain columns named "question" and "answer"';
      } else if (error.message.includes("No valid Q&A pairs found")) {
        errorMessage =
          "CSV file must contain at least one valid question and answer pair";
      }

      res.status(400).json({
        message: errorMessage,
        error: error.message,
      });
    }
  }
);

export default router;
