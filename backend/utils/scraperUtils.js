import axios from "axios";
import * as cheerio from "cheerio";
import { OpenAI } from "openai";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import pkg from "uuid";
const { v4: uuidv4 } = pkg;

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

export async function extractSiteContent(url) {
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

export async function generateQAPairs(content) {
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

export async function saveToS3(qaPairs, filename = null) {
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