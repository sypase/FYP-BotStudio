import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

// Initialize AWS S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
  forcePathStyle: true,
});

export async function uploadToS3(data, filename = null) {
  const uniqueId = filename ? filename.split("_")[2].split(".")[0] : uuidv4();
  const newFilename = filename || `qa_pairs_${uniqueId}.json`;
  const jsonContent = JSON.stringify(data, null, 2);

  const params = {
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: newFilename,
    Body: jsonContent,
    ContentType: "application/json",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const fileUrl = `${
      process.env.CLOUDFLARE_S3_PUBLIC_URL || process.env.CLOUDFLARE_S3_ENDPOINT
    }/${process.env.CLOUDFLARE_BUCKET_NAME}/${newFilename}`;
    console.log(`File saved to Cloudflare R2 with filename: ${newFilename}`);
    return { fileUrl, filename: newFilename };
  } catch (error) {
    console.error("Error uploading to Cloudflare R2:", error);
    throw new Error("Error uploading to Cloudflare R2");
  }
}

export async function deleteFromS3(filename) {
  const params = {
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: filename,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    console.log(`File ${filename} deleted from S3`);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Error deleting file from S3");
  }
}

export function getS3FileUrl(filename) {
  return `${
    process.env.CLOUDFLARE_S3_PUBLIC_URL || process.env.CLOUDFLARE_S3_ENDPOINT
  }/${process.env.CLOUDFLARE_BUCKET_NAME}/${filename}`;
} 