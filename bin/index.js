import { program } from "commander";
import { pushToMeowForge } from "../lib/util.js";
program.option(
  "-p, --push <values...>",
  "Push data to the repository with the provided repo name, passkey, and start path"
);

program.parse(process.argv);
const options = program.opts();
 
if (options.push && options.push.length === 3) {
  const [repoName, passkey, startPath] = options.push;

  if (!repoName || !passkey || !startPath) {
    console.log("Please provide all three arguments for --push.");
    process.exit(1);
  }

  pushToMeowForge(repoName, passkey, startPath);
} else {
  console.log("Please provide all three arguments for --push.");
}