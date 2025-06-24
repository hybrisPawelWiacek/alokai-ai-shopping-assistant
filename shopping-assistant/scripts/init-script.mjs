import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import * as url from "node:url";
import "@colors/colors";
import { diffLines } from "diff";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * @type {import("./types").EnvFilePredicate}
 */
function envFileExists(appPath, envFile) {
  if (envFile.symlink) {
    return fs.existsSync(path.join(appPath, envFile.targetFileName));
  }

  return fs.existsSync(path.join(appPath, envFile.targetFileName));
}

/**
 * @type {import("./types").EnvFilePredicate}
 */
function sourceFileValid(appPath, envFile) {
  let sourceFilePath = envFile.sourceFileName;
  if (!path.isAbsolute(envFile.sourceFileName)) {
    sourceFilePath = path.join(appPath, envFile.sourceFileName);
  }

  return fs.existsSync(sourceFilePath);
}

/**
 * @type {import("./types").EnvFilePredicate}
 */
function sourceEqualsTarget(appPath, envFile) {
  if (envFile.symlink) return true;

  const target = fs.readFileSync(path.join(appPath, envFile.targetFileName));
  const source = fs.readFileSync(path.join(appPath, envFile.sourceFileName));

  return target.equals(source);
}

/**
 * @type {import("./types").EnvFilePredicate}
 */
async function shouldOverridePrompt(appPath, envFile) {
  const target = fs.readFileSync(path.join(appPath, envFile.targetFileName));
  const source = fs.readFileSync(path.join(appPath, envFile.sourceFileName));
  const diffResult = diffLines(target.toString(), source.toString());

  console.log("\n", path.relative(__dirname, appPath));
  diffResult.forEach((part) => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? "green" : part.removed ? "red" : "grey";
    process.stderr.write(part.value[color]);
  });
  console.log("\n");

  const answer =
    (await rl.question(
      `File ${path.join(
        path.relative(__dirname, appPath),
        envFile.targetFileName
      )} does not match ${
        envFile.sourceFileName
      }, do you want to overwrite it? (Y/n)`
    )) || "y";
  return answer.toLowerCase() === "y";
}

/**
 * @param {string} appPath - path to the app/package
 * @param {import("./types").EnvFile[]} envFiles - env files array
 * @param {boolean} forceOverride - an option to override all existing env files without prompting
 * @returns {Promise<void>}
 */
async function copyEnvExampleFile(appPath, envFiles, forceOverride) {
  for (const envFile of envFiles) {
    if (!sourceFileValid(appPath, envFile)) {
      continue;
    }
    if (envFileExists(appPath, envFile)) {
      if (
        sourceEqualsTarget(appPath, envFile) ||
        (!forceOverride && !(await shouldOverridePrompt(appPath, envFile)))
      ) {
        continue;
      }
    }

    if (envFile.symlink) {
      fs.symlinkSync(
        envFile.sourceFileName,
        path.join(appPath, envFile.targetFileName)
      );
    } else {
      fs.copyFileSync(
        path.join(appPath, envFile.sourceFileName),
        path.join(appPath, envFile.targetFileName),
        fs.constants.COPYFILE_FICLONE
      );
    }
    console.log(
      `Copied ${envFile.sourceFileName} to ${
        envFile.targetFileName
      } for "${path.basename(appPath)}" app\n`
    );
  }
}

/**
 * @param {string[]} appsPaths - path to the apps/packages
 * @param {import("./types").EnvFile[]} envFiles - env files array
 * @param {boolean} forceOverride - an option to override all existing env files without prompting
 * @returns {void}
 */
export default async function main(appsPaths, envFiles, forceOverride) {
  for (const appPath of appsPaths) {
    await copyEnvExampleFile(appPath, envFiles, forceOverride);
  }

  rl.close();
}
