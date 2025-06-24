import type { FrontendServer, InternalFixtureContext } from '@setup/types';
import { getRandomPort } from 'get-port-please';
import { exec } from 'node:child_process';
import { join } from 'node:path';
import waitOn from 'wait-on';

import { getAppDir } from './shared';

export default async function nextServerFactory(ctx: InternalFixtureContext): Promise<FrontendServer> {
  const { debug, middlewarePort, workerInfo } = ctx;

  const nextRootDir = getAppDir();

  const port = await getRandomPort();
  const host = 'localhost';
  const baseUrl = `http://${host}:${port}`;

  const server = exec('yarn dev', {
    cwd: nextRootDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL: `http://localhost:${middlewarePort}`,
      NEXT_PUBLIC_ALOKAI_MIDDLEWARE_SSR_API_URL: `http://localhost:${middlewarePort}`,
      PORT: String(port),
      TEST_BUILD_DIR: join('.next', 'test', `${workerInfo.workerIndex}`),
    },
  });

  await waitOn({
    delay: 1000,
    interval: 1000,
    resources: [baseUrl],
    simultaneous: 1,
  }).catch(
    (error) => debug && console.error(`[WORKER ${workerInfo.workerIndex}] Can not connect to Next.js server: ${error}`),
  );

  debug && console.log(`[WORKER ${workerInfo.workerIndex}] Next.js server started on ${baseUrl}`);

  return {
    baseUrl: baseUrl,
    close: async () => {
      server.kill();
      debug && console.log(`[WORKER ${workerInfo.workerIndex}] Next.js server closed`);
    },
    port: String(port),
  };
}
