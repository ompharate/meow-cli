import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

export async function pushToMeowForge(repoName, passkey, startPath) {
  try {
    const formData = new FormData();
    const collectFiles = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          collectFiles(filePath);
        } else {
          formData.append("files", fs.createReadStream(filePath), file);
        }
      });
    };

    collectFiles(startPath);
    const url = "http://localhost:3000/api/upload";

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("Files uploaded successfully:", response.data);
  } catch (error) {
    console.error("Error uploading files:", error);
  }
}
