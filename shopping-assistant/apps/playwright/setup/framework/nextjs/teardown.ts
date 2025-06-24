import { test as teardown } from '@playwright/test';
import { execSync } from 'node:child_process';

import { getAppDir } from './shared.js';

teardown('Teardown a Next.js app', async () => {
  const nextAppDir = getAppDir();

  execSync(`rm -rf .next`, { cwd: nextAppDir });

  console.info(`Teardown finished`);
});
