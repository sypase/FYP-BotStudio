import express from 'express';
import ScraperSchedule from '../models/ScraperSchedule.js';
import { validate } from '../middlewares/validate.js';
import { extractSiteContent, generateQAPairs, saveToS3 } from '../utils/scraperUtils.js';
import Scrape from '../models/Scrape.js';

const router = express.Router();

// Function to execute scraping for a schedule
async function executeScraping(schedule) {
  try {
    console.log(`Starting scraping for schedule: ${schedule.name}`);
    
    // Extract content from the URL
    const content = await extractSiteContent(schedule.url);
    if (content.length === 0) {
      throw new Error('No content found');
    }

    // Generate QA pairs from the content
    const qaPairs = await generateQAPairs(content.join(" "));
    if (qaPairs.length === 0) {
      throw new Error('Failed to generate QA pairs');
    }

    // Save QA pairs to S3
    const { fileUrl, filename } = await saveToS3(qaPairs);

    // Create a new scrape record
    const scrape = new Scrape({
      name: `Auto Scrape - ${schedule.name}`,
      ownerId: schedule.userId,
      url: schedule.url,
      content,
      qaPairs,
      s3FileName: filename,
      s3FileUrl: fileUrl,
      sourceType: "auto_scrape",
      scheduleId: schedule._id,
      status: "completed",
      error: null
    });
    await scrape.save();

    // Update schedule with last run time and status
    schedule.lastRun = new Date();
    schedule.lastStatus = "completed";
    schedule.lastError = null;
    await schedule.save();

    console.log(`Scraping completed successfully for schedule: ${schedule.name}`);
    return scrape;
  } catch (error) {
    console.error('Error executing scraping:', error);
    
    // Update schedule with error status
    schedule.lastRun = new Date();
    schedule.lastStatus = "failed";
    schedule.lastError = error.message;
    await schedule.save();

    // Create a failed scrape record
    const failedScrape = new Scrape({
      name: `Auto Scrape - ${schedule.name}`,
      ownerId: schedule.userId,
      url: schedule.url,
      content: [],
      qaPairs: [],
      sourceType: "auto_scrape",
      scheduleId: schedule._id,
      status: "failed",
      error: error.message
    });
    await failedScrape.save();

    throw error;
  }
}

// Create a new scraper schedule
router.post('/', validate, async (req, res) => {
  try {
    const { name, url, schedule, customSchedule, nextRun } = req.body;
    
    const scraperSchedule = new ScraperSchedule({
      userId: req.user._id,
      name,
      url,
      schedule,
      customSchedule,
      nextRun,
      isActive: true,
      lastRun: null,
      lastStatus: null,
      lastError: null
    });

    await scraperSchedule.save();
    res.status(201).json(scraperSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all scraper schedules for a user
router.get('/', validate, async (req, res) => {
  try {
    const schedules = await ScraperSchedule.find({ userId: req.user._id });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific scraper schedule with its scrape history
router.get('/:id', validate, async (req, res) => {
  try {
    const schedule = await ScraperSchedule.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Get all scrapes associated with this schedule
    const scrapes = await Scrape.find({ 
      scheduleId: schedule._id 
    }).sort({ createdAt: -1 });
    
    res.json({ schedule, scrapes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a scraper schedule
router.put('/:id', validate, async (req, res) => {
  try {
    const schedule = await ScraperSchedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a scraper schedule
router.delete('/:id', validate, async (req, res) => {
  try {
    const schedule = await ScraperSchedule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle schedule active status
router.patch('/:id/toggle', validate, async (req, res) => {
  try {
    const schedule = await ScraperSchedule.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    schedule.isActive = !schedule.isActive;
    await schedule.save();
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Execute scraping for a schedule
router.post('/:id/execute', validate, async (req, res) => {
  try {
    const schedule = await ScraperSchedule.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const scrape = await executeScraping(schedule);
    res.json({ message: 'Scraping completed successfully', scrape });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 