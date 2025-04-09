import {
    S3Client,
    GetObjectCommand,
  } from "@aws-sdk/client-s3";
  
  const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
    },
    forcePathStyle: true,
  });
  
  /**
   * Gets file content from S3
   * @param {string} fileName - The file name/key in S3
   * @returns {Promise<string>} The file content as string
   * @throws {Error} If file retrieval fails
   */
  export async function getS3FileContent(fileName) {
    try {
      const params = {
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: fileName,
      };
  
      const response = await s3Client.send(new GetObjectCommand(params));
      return await streamToString(response.Body);
    } catch (error) {
      console.error("S3 file retrieval error:", error);
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }
  
  /**
   * Converts stream to string
   * @param {Stream} stream - The stream to convert
   * @returns {Promise<string>} The stream content as string
   */
  function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }