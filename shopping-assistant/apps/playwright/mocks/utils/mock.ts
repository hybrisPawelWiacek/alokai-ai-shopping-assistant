/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Route } from '@playwright/test';

export const mock = <TUrl extends string, TMock extends (route: Route, request: Request) => any | Promise<any>>(
  url: TUrl,
  response: TMock,
): [url: TUrl, response: TMock] => [url, response];
