import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function scrapeWebsite(url) {
  try {
    // Fetch the website content
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Extract text content
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    // Generate Q&A pairs using OpenAI
    const qaPairs = await generateQAPairs(textContent);
    
    return qaPairs;
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error('Error scraping website');
  }
}

async function generateQAPairs(content) {
  try {
    const prompt = `Based on the following content, generate 10 relevant question and answer pairs. 
    Format each pair as a JSON object with "question" and "answer" fields.
    Content: ${content.substring(0, 4000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates Q&A pairs from content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse the response to extract Q&A pairs
    const qaText = response.choices[0].message.content;
    const qaPairs = parseQAPairs(qaText);
    
    return qaPairs;
  } catch (error) {
    console.error('Error generating Q&A pairs:', error);
    throw new Error('Error generating Q&A pairs');
  }
}

function parseQAPairs(text) {
  try {
    // Extract JSON objects from the text
    const jsonMatches = text.match(/\{[\s\S]*?\}/g) || [];
    const qaPairs = [];
    
    for (const match of jsonMatches) {
      try {
        const pair = JSON.parse(match);
        if (pair.question && pair.answer) {
          qaPairs.push({
            question: pair.question.trim(),
            answer: pair.answer.trim()
          });
        }
      } catch (e) {
        console.error('Error parsing Q&A pair:', e);
      }
    }
    
    return qaPairs;
  } catch (error) {
    console.error('Error parsing Q&A pairs:', error);
    return [];
  }
} 