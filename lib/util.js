import fs from "fs";
import path from "path";
import archiver from "archiver";
import axios from "axios";
import chalk from "chalk";
import mime from "mime-types";

const zipDirectory = async (sourceDir, outPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip");

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};

export async function pushToMeowForge(repoName, passkey, startPath) {
  const zipFilePath = path.join(startPath, `${repoName}.zip`);
  let fileData;
  let contentType;
  let contentLength;

  const isDirectory = fs.statSync(startPath).isDirectory();

  if (isDirectory) {
    if (fs.existsSync(zipFilePath)) {
      console.log(chalk.yellow(`already exists: ${repoName}. Overwriting...`));
    }

    console.log(chalk.blue(`Creating meow package file: ${repoName}`));
    await zipDirectory(startPath, zipFilePath);
    console.log(chalk.green(`Created meow package file: ${repoName}`));

    fileData = fs.createReadStream(zipFilePath);
    contentType = mime.lookup("zip") || "application/octet-stream";
    contentLength = fs.statSync(zipFilePath).size;
  } else {
    fileData = fs.createReadStream(startPath);
    contentType =
      mime.lookup(path.extname(startPath)) || "application/octet-stream";
    contentLength = fs.statSync(startPath).size;
  }

  const response = await axios.post(
    "http://localhost:3000/api/cli/v1/generate-presigned-url",
    { filename: `${repoName}`, filetype: contentType }
  );

  const presignedUrl = response.data.url;

  try {
    const uploadResponse = await axios.put(presignedUrl, fileData, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": contentLength,
      },
    });
    console.log(chalk.green(`Uploaded ${repoName} successfully!`));
  } catch (error) {
    console.error(`Upload failed: ${error.response?.data || error.message}`);
  }

  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
    console.log(chalk.blue(`Deleted the meow package file: ${repoName}`));
  }
}
