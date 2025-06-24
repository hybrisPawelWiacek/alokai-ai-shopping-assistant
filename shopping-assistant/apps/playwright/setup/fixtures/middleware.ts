import type { RouterFactory } from '@core';
import { mainRouterFactory } from '@mocks/init';
import type { WorkerInfo } from '@playwright/test';
import { getRandomPort } from 'get-port-please';
import { type App, createApp, getRequestHeader, handleCors, toNodeListener } from 'h3';
import { createServer } from 'node:http';

export type MiddlewareServer = {
  app: App;
  port: string;
};

type Context = {
  debug: boolean;
  workerInfo: WorkerInfo;
};

export function middlewareFixtureFactory(routers: RouterFactory[]) {
  const mainRouter = mainRouterFactory();
  const router = routers.reduce((acc, routerFactory) => routerFactory(acc), mainRouter);

  return async function middlewareFixture(
    use: (middlewareServer: MiddlewareServer) => Promise<void>,
    { debug, workerInfo }: Context,
  ) {
    const app = createApp({
      onError(error) {
        debug && console.log(`[WORKER ${workerInfo.workerIndex}] >>> MIDDLEWARE Error:`, error);
      },
      onRequest(event) {
        debug &&
          console.log(`[WORKER ${workerInfo.workerIndex}] >>> MIDDLEWARE Request: [${event.method}] - ${event.path}`);

        const origin = getRequestHeader(event, 'origin') || '*';
        handleCors(event, { credentials: true, methods: '*', origin: [origin] });
      },
    });

    app.use(router);

    const port = await getRandomPort();
    const server = createServer(toNodeListener(app)).listen(port);
    debug && console.info(`[WORKER ${workerInfo.workerIndex}] Middleware server started on http://localhost:${port}`);

    const middlewareServer: MiddlewareServer = {
      app: app,
      port: String(port),
    };

    await use(middlewareServer);

    server.close();
    debug && console.info(`[WORKER ${workerInfo.workerIndex}] Middleware server closed`);
  };
}
