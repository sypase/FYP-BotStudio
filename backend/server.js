import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import test from "./routes/test.js";
import users from "./routes/users.js";
import scrape from "./routes/scrape.js";
import datas from "./routes/data.js";
import bot from "./routes/bot.js";
import credits from "./routes/credits.js";
import botTransactions from "./routes/botTransactions.js";
import botAnalytics from "./routes/botAnalytics.js";
import admin from "./routes/admin.js";
import apiKeys from "./routes/apiKeys.js";
import apiKeyInteractions from './routes/apiKeyInteractions.js';
import scraperScheduleRoutes from './routes/scraperSchedule.js';
import scheduler from './services/scheduler.js';

dotenv.config();

const app = express();

// Configure CORS
app.use(cors());

// Regular middleware for JSON parsing
app.use(express.json());

// Special handling for Stripe webhooks
app.use("/credits/webhook", express.raw({ type: "application/json" }));

// Routes
app.use("/test", test);
app.use("/users", users);
app.use("/scrape", scrape);
app.use("/data", datas);
app.use("/bot", bot);
app.use("/credits", credits);
app.use("/bot-transactions", botTransactions);
app.use("/bot-analytics", botAnalytics);
app.use("/admin", admin);
app.use("/api-keys", apiKeys);
app.use("/api-key", apiKeyInteractions);
app.use('/api/scraper-schedules', scraperScheduleRoutes);

app.get("/", (req, res) => {
  res.send("BotSTUDIO API Is running");
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    
    // Initialize the scheduler after database connection
    await scheduler.initialize();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

connectDB();

const port = process.env.PORT || 8080;

// Create an HTTP server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

// 404 error handling middleware
app.use((req, res, next) => {
  res.status(404).send("Not Found");
});
