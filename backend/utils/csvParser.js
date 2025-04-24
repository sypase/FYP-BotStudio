import csv from 'csv-parser';
import { Readable } from 'stream';

export async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const pairs = [];
    let hasRequiredColumns = false;

    const stream = Readable.from(buffer.toString())
      .pipe(csv())
      .on('headers', (headers) => {
        // Convert headers to lowercase for case-insensitive check
        const lowerHeaders = headers.map(h => h.toLowerCase());
        hasRequiredColumns = 
          lowerHeaders.includes('question') && 
          lowerHeaders.includes('answer');

        if (!hasRequiredColumns) {
          stream.destroy(); // Stop processing if headers are invalid
          reject(new Error('CSV must contain "question" and "answer" columns'));
        }
      })
      .on('data', (row) => {
        // Ensure both question and answer exist and are not empty
        if (row.question && row.answer && 
            row.question.trim() !== '' && 
            row.answer.trim() !== '') {
          pairs.push({
            question: row.question.trim(),
            answer: row.answer.trim()
          });
        }
      })
      .on('end', () => {
        if (pairs.length === 0) {
          reject(new Error('No valid Q&A pairs found in CSV'));
        } else {
          resolve(pairs);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
} 