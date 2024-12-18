import fs from "fs";
import path from "path";
import archiver from "archiver";
import axios from "axios";
import chalk from "chalk";
import mime from "mime-types";
import ora from "ora";
import { fileURLToPath } from 'url';
import { getMeowPackage, sendAuditRecord } from "./api.js";

const readIgnoreFile = (dir) => {
  const ignoreFilePath = path.join(dir, ".mignore");
  if (fs.existsSync(ignoreFilePath)) {
    return fs
      .readFileSync(ignoreFilePath, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
  }
  return [];
};

const zipDirectory = async (sourceDir, outPath, ignorePatterns) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip");

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    fs.readdir(sourceDir, (err, files) => {
      if (err) reject(err);

      files.forEach((file) => {
        const filePath = path.join(sourceDir, file);
        const shouldIgnore = ignorePatterns.some((pattern) =>
          file.includes(pattern)
        );

        if (!shouldIgnore) {
          archive.file(filePath, { name: file });
        }
      });

      archive.finalize();
    });
  });
};

export async function pushToMeowForge(repoName, passkey, startPath,visibility) {
  const zipFilePath = path.join(startPath, `${repoName}.zip`);
  let fileData;
  let contentType;
  let contentLength;

  const isDirectory = fs.statSync(startPath).isDirectory();
  const ignorePatterns = isDirectory ? readIgnoreFile(startPath) : [];

  let uploadSpinner = ora(`Creating meow package file: ${repoName}`).start();

  try {
    if (isDirectory) {
      if (fs.existsSync(zipFilePath)) {
        console.log(
          chalk.yellow(`Already exists: ${repoName}. Overwriting...`)
        );
      }

      await zipDirectory(startPath, zipFilePath, ignorePatterns);
      uploadSpinner.succeed(
        chalk.green(`Created meow package file: ${repoName}`)
      );

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
      "https://meowhub.ompharate.tech/api/cli/v1/generate-presigned-url",
      { filename: repoName, contentType }
    );

    const presignedUrl = response.data.url;
    uploadSpinner = ora(`Write Object: ${repoName}`).start();
    await axios.put(presignedUrl, fileData, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": contentLength,
      },
    });
    const res = await sendAuditRecord(repoName, passkey,visibility);
    if (res) {
      uploadSpinner.succeed(chalk.green(`Uploaded ${repoName} successfully!`));
    }
  } catch (error) {
    uploadSpinner.fail(`Error: while uploading ${repoName}, ${error.message}`);
  } finally {
    const cleanupSpinner = ora(
      `Cleaning meow packages: ${repoName}...`
    ).start();
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
      cleanupSpinner.succeed(chalk.green(`Done!!: ${repoName}`));
    }
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function pullFromMeowForge(repoName, passkey) {
  try {
    const downloadUrl = await getMeowPackage(repoName, passkey);

    const response = await axios.get(downloadUrl, { responseType: "stream" });

    const filePath = path.resolve(__dirname, `${repoName}.zip`);

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading the file:", error);
  }
}