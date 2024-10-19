#!/usr/bin/env node
import { program } from "commander";
import { pushToMeowForge, pullFromMeowForge } from "../lib/util.js";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

program
  .command("push <repoName> <passkey> <startPath> [visibility]")
  .description("Push data to the repository with the provided repo name, passkey, and start path")
  .action(async (repoName, passkey, startPath,visibility) => {
    try {
      if (!repoName || !passkey || !startPath) {
        console.log(chalk.red("Please provide all three arguments for push."));
        return;
      }

      if (!visibility)  {
        visibility = "public"; 
      }

      await pushToMeowForge(repoName, passkey, startPath,visibility);
    } catch (error) {
      console.error(chalk.red(`Error pushing to ${repoName}: ${error.message}`));
    }
  });

program
  .command("pull <repoName> <passkey>")
  .description("Pull data from the repository with the provided repo name and passkey")
  .action(async (repoName, passkey) => {
    try {
      if (!repoName || !passkey) {
        console.log(chalk.red("Please provide both repo name and passkey for pull."));
        return;
      }

      await pullFromMeowForge(repoName, passkey);
      console.log(chalk.green(`Successfully pulled from ${repoName}.`));
    } catch (error) {
      console.error(chalk.red(`Error pulling from ${repoName}: ${error.message}`));
    }
  });

program.parse(process.argv);