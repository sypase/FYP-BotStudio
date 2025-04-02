import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Scrape from '../models/Scrape.js';
import { validate } from '../middlewares/validate.js';
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

const router = express.Router();

// Initialize OpenAI clients
const standardOpenai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// GitHub Inference AI client configuration
const githubOpenai = new OpenAI({
    baseURL: process.env.GITHUB_INFERENCE_ENDPOINT || "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
});

// Initialize AWS S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto', 
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
        $('p, h1, h2, h3, h4, h5, h6').each((i, el) => {
            content.push($(el).text().trim());
        });
        console.log('Extracted content:', content);
        
        return content;
    } catch (error) {
        console.error('Error fetching site content:', error);
        return [];
    }
}

async function generateQAPairs(content) {
    try {
        const questionPrompt = `Generate simple questions based on the following content. Return only the questions without numbering, each on a new line:\n\n${content}`;
        
        // Use GitHub's inference endpoint for question generation
        const questionResponse = await githubOpenai.chat.completions.create({
            model: process.env.GITHUB_MODEL_NAME || 'gpt-4o',
            messages: [{ role: 'user', content: questionPrompt }],
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
        });
        
        // Clean up the response to remove numbering and empty lines
        let questions = questionResponse.choices[0].message.content.split('\n')
            .map(q => q.replace(/^\d+\.\s*/, '').trim())
            .filter(q => q.length > 0);
        
        let qaPairs = [];
        
        for (const question of questions) {
            const answerPrompt = `Generate a simple answer for the question: '${question}' based on the following content:\n\n${content}`;
            
            // Use standard OpenAI for answer generation
            const answerResponse = await standardOpenai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: answerPrompt }],
            });
            
            const answer = answerResponse.choices[0].message.content.trim();
            qaPairs.push({ 
                question: question, 
                answer: answer 
            });
        }
        return qaPairs;
    } catch (error) {
        console.error('Error generating QA pairs:', error);
        return [];
    }
}

async function saveToS3(qaPairs) {
    const uniqueId = uuidv4();
    const filename = `qa_pairs_${uniqueId}.json`;
    const jsonContent = JSON.stringify(qaPairs, null, 2);
    
    const params = {
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME, 
        Key: filename,
        Body: jsonContent,
        ContentType: 'application/json',
    };
    
    try {
        await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `${process.env.CLOUDFLARE_S3_PUBLIC_URL || process.env.CLOUDFLARE_S3_ENDPOINT}/${process.env.CLOUDFLARE_BUCKET_NAME}/${filename}`;
        console.log(`QA pairs saved to Cloudflare R2 with filename: ${filename}`);
        return { fileUrl, filename };
    } catch (error) {
        console.error('Error uploading to Cloudflare R2:', error);
        throw new Error('Error uploading to Cloudflare R2');
    }
}

// GET Route to fetch all scrapes (history)
router.get('/history', validate, async (req, res) => {
    try {
        const scrapes = await Scrape.find()
            .sort({ createdAt: -1 })
            .select('_id url createdAt s3FileUrl');
        
        res.json({
            message: 'Scrape history retrieved successfully',
            data: scrapes
        });
    } catch (error) {
        console.error('Error fetching scrape history:', error);
        res.status(500).json({ 
            message: 'Error fetching scrape history', 
            error: error.message 
        });
    }
});

// GET Route to fetch a specific scrape by ID with all Q&A pairs
router.get('/:id', validate, async (req, res) => {
    try {
        const scrape = await Scrape.findById(req.params.id);
        
        if (!scrape) {
            return res.status(404).json({ 
                message: 'Scrape not found' 
            });
        }
        
        res.json({
            message: 'Scrape retrieved successfully',
            data: {
                _id: scrape._id,
                url: scrape.url,
                createdAt: scrape.createdAt,
                s3FileUrl: scrape.s3FileUrl,
                qaPairs: scrape.qaPairs
            }
        });
    } catch (error) {
        console.error('Error fetching scrape:', error);
        res.status(500).json({ 
            message: 'Error fetching scrape', 
            error: error.message 
        });
    }
});

// GET Route to fetch all scrapes (original route)
router.get('/', validate, async (req, res) => {
    try {
        const scrapes = await Scrape.find();
        res.json({
            message: 'All scrapes retrieved successfully',
            data: scrapes
        });
    } catch (error) {
        console.error('Error fetching scrapes:', error);
        res.status(500).json({ 
            message: 'Error fetching scrapes', 
            error: error.message 
        });
    }
});

// POST Route to scrape a website and store data
router.post('/', validate, async (req, res) => {
    console.log('Scraping website:', req.body.url);
    
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });
    
    try {
        const content = await extractSiteContent(url);
        if (content.length === 0) return res.status(400).json({ message: 'No content found' });
        
        const qaPairs = await generateQAPairs(content.join(' '));
        console.log('Generated QA Pairs:', qaPairs);
        
        // Save to S3 and get the URL
        const { fileUrl, filename } = await saveToS3(qaPairs);

        console.log(fileUrl, filename);
        
        
        // Create and save the scrape record with S3 URL
        const scrape = new Scrape({ 
            url, 
            content, 
            qaPairs,
            s3FileUrl: fileUrl,
            s3FileName: filename
        });
        await scrape.save();
        
        res.status(201).json({ 
            message: 'Scrape completed successfully',
            data: {
                scrape: {
                    _id: scrape._id,
                    url: scrape.url,
                    createdAt: scrape.createdAt,
                    s3FileUrl: scrape.s3FileUrl,
                    qaPairs: scrape.qaPairs
                },
                fileUrl 
            }
        });
    } catch (error) {
        console.error('Error in POST /:', error);
        res.status(500).json({ 
            message: 'Error processing request', 
            error: error.message,
            details: error.response?.data?.message || error.stack 
        });
    }
});

export default router;