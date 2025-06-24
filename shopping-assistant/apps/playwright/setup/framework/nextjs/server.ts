import type { FrontendServer, InternalFixtureContext } from '@setup/types';
import { getRandomPort } from 'get-port-please';
import { exec } from 'node:child_process';
import waitOn from 'wait-on';

import { getAppDir } from './shared';

export default async function nextServerFactory(ctx: InternalFixtureContext): Promise<FrontendServer> {
  const { debug, middlewarePort, workerInfo } = ctx;

  const nextRootDir = getAppDir();

  const port = await getRandomPort();
  const host = 'localhost';
  const baseUrl = `http://${host}:${port}`;

  const server = exec(`yarn start`, {
    cwd: nextRootDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL: `http://localhost:${middlewarePort}`,
      NEXT_PUBLIC_ALOKAI_MIDDLEWARE_SSR_API_URL: `http://localhost:${middlewarePort}`,
      PORT: String(port),
    },
  });
  debug && console.log(`[WORKER ${workerInfo.workerIndex}] Next.js server started on ${baseUrl}`);

  await waitOn({
    delay: 100,
    interval: 100,
    resources: [baseUrl],
    simultaneous: 1,
  }).catch(
    (error: unknown) =>
      debug && console.error(`[WORKER ${workerInfo.workerIndex}] Can not connect to Next.js server: ${error}`),
  );

  return {
    baseUrl,
    close: async () => {
      server.kill();
      debug && console.log(`[WORKER ${workerInfo.workerIndex}] Next.js server closed`);
    },
    port: String(port),
  };
}
