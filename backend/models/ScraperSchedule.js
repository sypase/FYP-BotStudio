import mongoose from 'mongoose';

const scraperScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'custom']
  },
  customSchedule: {
    type: String,
    required: function() {
      return this.schedule === 'custom';
    }
  },
  nextRun: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    enum: ['completed', 'failed', null],
    default: null
  },
  lastError: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
scraperScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ScraperSchedule = mongoose.model('ScraperSchedule', scraperScheduleSchema);
export default ScraperSchedule; 