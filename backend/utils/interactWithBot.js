import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interact with a bot using OpenAI's API
 * @param {string} modelId - The OpenAI model ID to use
 * @param {string} message - The user's message
 * @param {string} botName - The name of the bot for context
 * @returns {Promise<Object>} The OpenAI API response
 */
export async function interactWithBot(modelId, message, botName) {
  try {
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: `You are ${botName}, a helpful and knowledgeable assistant. Respond to the user's message in a friendly and professional manner.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
} 