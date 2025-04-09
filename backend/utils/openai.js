import OpenAI from "openai";
import fs from 'fs';
import { Blob } from 'buffer';
import { Readable } from 'stream';
import { promisify } from 'util';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Uploads a file to OpenAI for fine-tuning
 * @param {string|Blob} fileContent - The file content as string or Blob
 * @returns {Promise<Object>} OpenAI file response
 * @throws {Error} If file upload fails
 */
export async function uploadFile(fileContent) {
  try {
    // Create a temporary file
    const tempFilePath = `./temp_${Date.now()}.jsonl`;
    
    if (typeof fileContent === 'string') {
      fs.writeFileSync(tempFilePath, fileContent);
    } else if (fileContent instanceof Blob) {
      const arrayBuffer = await fileContent.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
    } else {
      throw new Error('Invalid file format - must be string or Blob');
    }

    // Upload using fs.createReadStream
    const response = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "fine-tune",
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    return response;
  } catch (error) {
    console.error("OpenAI file upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Starts a fine-tuning job
 * @param {string} model - The base model to fine-tune
 * @param {string} trainingFileId - The uploaded file ID
 * @returns {Promise<Object>} OpenAI fine-tuning job response
 * @throws {Error} If fine-tuning fails to start
 */
export async function fineTune(model, trainingFileId) {
  try {
    const response = await openai.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: model,
      hyperparameters: {
        n_epochs: 1,
        batch_size: 1
      }
    });
    return response;
  } catch (error) {
    console.error("OpenAI fine-tuning error:", error);
    throw new Error(`Failed to start fine-tuning: ${error.message}`);
  }
}

/**
 * Retrieves a fine-tuning job status
 * @param {string} jobId - The fine-tuning job ID
 * @returns {Promise<Object>} OpenAI job status response
 * @throws {Error} If job retrieval fails
 */
export async function getFineTuneJob(jobId) {
  try {
    const response = await openai.fineTuning.jobs.retrieve(jobId);
    return response;
  } catch (error) {
    console.error("OpenAI job retrieval error:", error);
    throw new Error(`Failed to retrieve job status: ${error.message}`);
  }
}

/**
 * Converts Q&A pairs to JSONL format for fine-tuning
 * @param {Array<Object>} data - Array of Q&A pairs
 * @param {string} companyName - Name for system message
 * @returns {string} JSONL formatted string
 * @throws {Error} If conversion fails
 */
export function convertToJSONL(data, companyName = "Your Company") {
  try {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array");
    }

    const systemMessage = `You are an AI assistant representing ${companyName}. Provide accurate, professional responses.`;

    return data
      .map((entry) => {
        if (!entry.question || !entry.answer) {
          throw new Error("Each entry must have question and answer fields");
        }
        return JSON.stringify({
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: entry.question.trim() },
            { role: "assistant", content: entry.answer.trim() },
          ],
        });
      })
      .join("\n");
  } catch (error) {
    console.error("JSONL conversion error:", error);
    throw new Error(`Failed to convert to JSONL: ${error.message}`);
  }
}