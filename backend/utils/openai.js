import OpenAI from "openai";
import { Blob } from "node:buffer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Uploads a file to OpenAI for fine-tuning
 * @param {Blob} file - The file to upload
 * @returns {Promise<Object>} OpenAI file response
 * @throws {Error} If file upload fails
 */
export async function uploadFile(file) {
  try {
    const response = await openai.files.create({
      file,
      purpose: "fine-tune",
    });
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
      model,
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
