import { readdirSync } from "node:fs";
import { join } from "node:path";
import main from "./scripts/init-script.mjs";
import * as url from "node:url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const rootDirPath = __dirname;
const appsDirPath = join(rootDirPath, "apps");

/**
 * @type {import("./scripts/types").EnvFile[]}
 */
const envFiles = [
  {
    sourceFileName: ".env.example",
    targetFileName: ".env",
    symlink: false,
  },
  {
    sourceFileName: join(__dirname, ".env"),
    targetFileName: ".env",
    symlink: true,
  },
  {
    sourceFileName: "env-example.ts",
    targetFileName: "env.ts",
    symlink: false,
  },
];

function getAppPaths() {
  return [
    rootDirPath,
    ...readdirSync(appsDirPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => join(appsDirPath, dirent.name)),
  ];
}

const appsPaths = getAppPaths();

const args = process.argv.slice(2);
const forceOverride = args.includes("--force");

main(appsPaths, envFiles, forceOverride);
