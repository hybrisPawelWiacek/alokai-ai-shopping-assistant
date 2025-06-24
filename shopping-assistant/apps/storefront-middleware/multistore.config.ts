import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from './multistore/utils/defineConfig';
import type { Config } from './integrations/sapcc';

dotenv.config({
  path: resolve(__dirname, '.env')
});

export const config = defineConfig<Config>({
  'dev.client.local': {},
  'dev.vsf.local': {}
});