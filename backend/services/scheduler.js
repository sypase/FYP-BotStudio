import cron from 'node-cron';
import ScraperSchedule from '../models/ScraperSchedule.js';
import axios from 'axios';

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  async initialize() {
    // Load all active schedules
    const schedules = await ScraperSchedule.find({ isActive: true });
    schedules.forEach(schedule => this.scheduleJob(schedule));
  }

  scheduleJob(schedule) {
    // Cancel existing job if any
    if (this.jobs.has(schedule._id)) {
      this.jobs.get(schedule._id).stop();
    }

    // Create cron expression based on schedule type
    let cronExpression;
    switch (schedule.schedule) {
      case 'daily':
        cronExpression = '0 0 * * *'; // Run at midnight every day
        break;
      case 'weekly':
        cronExpression = '0 0 * * 0'; // Run at midnight on Sunday
        break;
      case 'monthly':
        cronExpression = '0 0 1 * *'; // Run at midnight on the first day of the month
        break;
      case 'custom':
        cronExpression = schedule.customSchedule;
        break;
      default:
        console.error(`Invalid schedule type: ${schedule.schedule}`);
        return;
    }

    // Schedule the job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scraper for schedule: ${schedule.name}`);
        
        // Call your scraping endpoint
        await axios.post(`${process.env.SERVER_URL}/api/scrape`, {
          url: schedule.url,
          scheduleId: schedule._id
        });

        // Update last run time
        await ScraperSchedule.findByIdAndUpdate(schedule._id, {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule)
        });

      } catch (error) {
        console.error(`Error running scraper for schedule ${schedule.name}:`, error);
      }
    });

    this.jobs.set(schedule._id, job);
  }

  calculateNextRun(schedule) {
    const now = new Date();
    switch (schedule.schedule) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'custom':
        // For custom schedules, we'll just set it to now + 1 day
        // You might want to implement a more sophisticated calculation
        return new Date(now.setDate(now.getDate() + 1));
      default:
        return new Date();
    }
  }

  async addSchedule(schedule) {
    if (schedule.isActive) {
      this.scheduleJob(schedule);
    }
  }

  async updateSchedule(schedule) {
    if (schedule.isActive) {
      this.scheduleJob(schedule);
    } else {
      this.removeSchedule(schedule._id);
    }
  }

  removeSchedule(scheduleId) {
    if (this.jobs.has(scheduleId)) {
      this.jobs.get(scheduleId).stop();
      this.jobs.delete(scheduleId);
    }
  }
}

export default new Scheduler(); 