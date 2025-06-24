import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from '../multistore.config';
import { generateCaddyfile } from './utils/generateCaddyfile';
import { testEtcHosts } from './utils/testEtcHosts';

const frontendPort = process.env.FRONTEND_PORT ?? 3000;
const middlewarePort = process.env.MIDDLEWARE_PORT ?? 4000;
const isDebug = process.env.VSF_DEBUG ?? false;

const listOfStoresDomains = config.getDomains();

const path = resolve(__dirname, '../../../Caddyfile');

try {
  writeFileSync(path, generateCaddyfile(listOfStoresDomains, frontendPort, middlewarePort));
} catch (e) {
  console.error('Error generating Caddyfile');

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  isDebug && console.error(e);
}

testEtcHosts(listOfStoresDomains);
