import axios from 'axios';
import * as cheerio from 'cheerio'; // Corrected import statement
import fs from 'fs';
import { OpenAI } from 'openai'; // Updated import statement
import csvWriter from 'csv-writer';

const openai = new OpenAI({
    apiKey: '', // Use your actual API key here
});

async function extractSiteContent(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let content = [];
        
        $('p, h1, h2, h3, h4, h5, h6').each((i, el) => {
            content.push($(el).text().trim());
        });
        return content;
    } catch (error) {
        console.error('Error fetching site content:', error);
        return [];
    }
}

async function generateQAPairs(content) {
    try {
        const questionPrompt = `Generate at least 50 simple questions based on the following content:\n\n${content}`;
        const questionResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: questionPrompt }],
        });
        
        const questions = questionResponse.choices[0].message.content.split('\n');
        let qaPairs = [];
        
        for (const question of questions) {
            const answerPrompt = `Generate a simple answer for the question: '${question}' based on the following content:\n\n${content}`;
            const answerResponse = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: answerPrompt }],
            });
            const answer = answerResponse.choices[0].message.content.trim();
            qaPairs.push({ question, answer });
        }
        console.log('Generated QA Pairs:', qaPairs);
        return qaPairs;
    } catch (error) {
        console.error('Error generating QA pairs:', error);
        return [];
    }
}

async function saveToCSV(qaPairs, filename = 'qa_pairs.csv') {
    const createCsvWriter = csvWriter.createObjectCsvWriter;
    const csv = createCsvWriter({
        path: filename,
        header: [
            { id: 'question', title: 'Question' },
            { id: 'answer', title: 'Answer' },
        ],
    });
    await csv.writeRecords(qaPairs);
    console.log(`QA pairs saved to ${filename}`);
}

async function scrapeWebsite(url) {
    console.log(`Scraping content from: ${url}`);
    
    const content = await extractSiteContent(url);
    if (content.length === 0) {
        console.log('No content found.');
        return;
    }
    
    const qaPairs = await generateQAPairs(content.join(' '));
    
    await saveToCSV(qaPairs);
    
    console.log('QA Pairs:', qaPairs);
}

// Call the function for the given URL
scrapeWebsite('https://islington.edu.np/');
