import type { MockFactoryContext } from '@core';
import { db } from '@setup/db';
import { createError, defineEventHandler, readBody } from 'h3';

import { getPage } from '../data';

export default function ({ router }: MockFactoryContext) {
  return router.post(
    `/getPage`,
    defineEventHandler(async (event) => {
      try {
        const body = (await readBody(event))![0];
        return await getPage(db, body['path'], body['locale']);
      } catch (error: unknown) {
        console.error(error);
        throw createError({
          message: error instanceof Error ? error.message : 'Unknown getPage error',
          status: 400,
        });
      }
    }),
  );
}
