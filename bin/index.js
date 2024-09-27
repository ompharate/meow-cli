#!/usr/bin/env node
import { program } from "commander";
import { pushToMeowForge } from "../lib/util.js";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

program
  .command("push <repoName> <passkey> <startPath>")
  .description(
    "Push data to the repository with the provided repo name, passkey, and start path"
  )
  .action(async (repoName, passkey, startPath) => {
    if (!repoName || !passkey || !startPath) {
      console.log(chalk.red("Please provide all three arguments for push."));
      process.exit(1);
    }

    await pushToMeowForge(repoName, passkey, startPath);
  });

program.parse(process.argv);
