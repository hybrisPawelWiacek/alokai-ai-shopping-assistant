import { defineConfig } from '@core';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  name: 'checkout',
  testDir: resolve(dirname, 'tests'),
});
