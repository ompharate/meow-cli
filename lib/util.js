import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function pushToMeowForge(repoName, passkey, startPath) {
  try {
    const collectFiles = async (dir, repoName) => {
      const files = fs.readdirSync(dir);
      const uploadedFiles = [];

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (
          file === "node_modules" ||
          file === ".gitignore" ||
          file === "Dockerfile"
        ) {
          continue;
        }

        if (stat.isDirectory()) {
          const subDirFiles = await collectFiles(filePath, repoName);
          uploadedFiles.push(...subDirFiles);
        } else {
          const relativePath = path.relative(startPath, filePath);
          const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${repoName}/${relativePath}`,
            Body: fs.createReadStream(filePath),
            ContentType: getContentType(filePath),
          };

          // Debug: Check upload parameters
          console.log("Uploading:", uploadParams.Key);

          const command = new PutObjectCommand(uploadParams);
          await s3.send(command);
          console.log(`File uploaded successfully: ${uploadParams.Key}`);
          uploadedFiles.push(uploadParams.Key);
        }
      }

      return uploadedFiles;
    };

    const uploadedFiles = await collectFiles(startPath, repoName);
    console.log("All files processed:", uploadedFiles);
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    // Programming languages
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".py": "text/x-python",
    ".java": "text/x-java-source",
    ".c": "text/x-csrc",
    ".cpp": "text/x-c++src",
    ".go": "text/x-go",
    ".rb": "text/x-ruby",
    ".php": "application/x-httpd-php",
    ".swift": "application/x-swift",
    ".html": "text/html",
    ".css": "text/css",
    ".json": "application/json",
    ".xml": "application/xml",
    ".yaml": "application/x-yaml",

    // Markup and Documentation
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".rtf": "application/rtf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Styles and Scripts
    ".scss": "text/x-scss",
    ".less": "text/css",

    // Images
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",

    // Audio and Video
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",

    // Archives
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".rar": "application/x-rar-compressed",

    // Miscellaneous
    ".iso": "application/octet-stream",
    ".bin": "application/octet-stream",
  };
  return types[ext] || "application/octet-stream";
};
