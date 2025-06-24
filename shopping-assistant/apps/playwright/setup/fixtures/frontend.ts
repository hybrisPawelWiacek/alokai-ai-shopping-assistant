import type { FrontendServer, InternalFixtureContext } from '@setup/types';

export async function frontendFixture(use: (frontendUrl: string) => Promise<void>, ctx: InternalFixtureContext) {
  const { debug, dev, framework } = ctx;
  let frontendServer: FrontendServer;
  try {
    const serverFactory = await resolveFrameworkConfig(framework, dev);
    frontendServer = await serverFactory(ctx);
  } catch (e: unknown) {
    debug && console.error('[Error] Can not resolve framework: ', e);
    throw new Error(`Unsupported framework: ${framework}`);
  }

  await use(frontendServer.baseUrl);

  frontendServer.close();
}

async function resolveFrameworkConfig(framework: null | string, dev: boolean) {
  if (!framework) {
    throw new Error('Framework is not specified');
  }
  return await import(`@setup/framework/${framework}/server${dev ? '-dev' : ''}`).then((module) => module.default);
}
