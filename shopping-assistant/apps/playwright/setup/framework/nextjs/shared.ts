import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getAppDir() {
  const appDir = resolve(fileURLToPath(import.meta.url), '../../../../../storefront-unified-nextjs');

  if (!existsSync(appDir)) {
    console.error(`App not found in ${appDir}`);
    process.exit(1);
  }
  return appDir;
}
