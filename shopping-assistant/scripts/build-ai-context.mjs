import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AI_ROOT_DIR = join(__dirname, "..", "ai");

/**
 * This file is being removed from the project while running the `create` command
 *
 * You can use this internally by running this with node `node scripts/build-ai-context.mjs`, it accepts no arguments.
 */

const aiContextFiles = readdirSync(AI_ROOT_DIR, { recursive: true })
  .filter((file) => {
    try {
      return statSync(join(AI_ROOT_DIR, file)).isFile();
    } catch (err) {
      return false;
    }
  })
  .map((file) => readFileSync(join(AI_ROOT_DIR, file), "utf-8"));

const aiContextFilesChapters = aiContextFiles.flatMap((file) => {
  const lines = file.split("\n");
  const chapters = [];
  let currentChapter = { title: "", content: [] };

  lines.forEach((line) => {
    const headerMatch = line.match(/^#{1,6}\s+\S/);
    if (headerMatch) {
      if (currentChapter.title) {
        chapters.push({ ...currentChapter });
      }
      currentChapter = {
        title: line.trim(),
        content: [],
      };
    } else if (currentChapter.title) {
      currentChapter.content.push(line);
    }
  });

  if (currentChapter.title) {
    chapters.push(currentChapter);
  }

  return chapters;
});

const chaptersGroupedByTitle = groupBy(
  aiContextFilesChapters,
  (chapter) => chapter.title
);
const aiContext = Object.entries(chaptersGroupedByTitle).flatMap(
  ([chapter, entries]) => {
    const doesHaveContent = entries.some((entry) => {
      return entry.content.some((line) => {
        return line.replaceAll(/\s+/g, "").trim() !== "";
      });
    });

    if (!doesHaveContent) {
      return [];
    }

    const content = entries
      .map((entry) => entry.content.filter((line) => line !== "").join("\n"))
      .join("\n");
    return [[chapter, content]];
  }
);

const output = aiContext
  .map(([chapter, content]) => `\n${chapter}\n${content}`)
  .join("\n");

console.log("Creating AI context files in: ", resolve("./"));
writeFileSync(".cursorrules", output);
writeFileSync(".windsurfrules", output);
writeFileSync(".github/copilot-instructions.md", output);

// We do not have lodash installed in bootstrapper while running this code
function groupBy(collection, iteratee) {
  const result = {};
  collection.forEach((item) => {
    const key = iteratee(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  });
  return result;
}
