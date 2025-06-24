import { devices, type Project } from '@playwright/test';
import url from 'node:url';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const config: Project[] = [
  {
    name: 'build-nextjs',
    teardown: 'teardown-nextjs',
    testDir: dirname,
    testMatch: 'setup.ts',
  },
  {
    name: 'teardown-nextjs',
    testDir: dirname,
    testMatch: 'teardown.ts',
  },
  {
    dependencies: ['build-nextjs'],
    name: 'nextjs-desktop',
    testMatch: ['**/*.test.ts', '**/*.test.nextjs.ts'],
    use: {
      ...devices['Desktop Chrome'],
      framework: 'nextjs',
    },
  },
];
