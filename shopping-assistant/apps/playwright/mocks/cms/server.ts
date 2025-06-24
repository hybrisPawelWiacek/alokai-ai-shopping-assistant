import type { MockFactoryContext } from '@core';

import { getPage } from './endpoints';

export const serverFactory = [(ctx: MockFactoryContext) => getPage(ctx)];
