/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@setup/db';
import { dataFactory } from '@setup/fixtures/data';
import type { Router } from 'h3';

// @NOTE: direct core db access may be removed in the future;
// core db will be accessed via dataFactory layer only;
export function pipe(endpoints: any[], router: Router) {
  return endpoints.reduce((acc, endpoint) => endpoint({ dataFactory, db, router: acc }), router);
}
