import express from "express";
import multer from "multer";
import csv from "csv-parser";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { validate } from "../middlewares/validate.js";
import fs from "fs";

const router = express.Router();

router.get("/", validate, async (req, res) => {
  try {
    const datas = await Scrape.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .select("_id name url createdAt s3FileUrl s3FileName sourceType");

    console.log(datas);

    res.json({
      message: "Data retrieved successfully",
      data: datas,
    });
  } catch (error) {
    console.error("Error fetching scrape history:", error);
    res.status(500).json({
      message: "Error fetching scrape history",
      error: error.message,
    });
  }
});

export default router;
