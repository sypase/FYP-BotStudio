import mongoose from 'mongoose';

const scrapeSchema = new mongoose.Schema({
    url: { type: String, required: true },
    content: [String],
    qaPairs: [{ question: String, answer: String }],
    s3Url: { type: String, required: false }, // New field to store S3 URL
    createdAt: { type: Date, default: Date.now }
});

const Scrape = mongoose.model('Scrape', scrapeSchema);

export default Scrape;
