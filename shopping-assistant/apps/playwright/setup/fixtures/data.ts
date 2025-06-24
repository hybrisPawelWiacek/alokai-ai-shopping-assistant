import * as cms from '@mocks/cms/data/index';
import * as unified from '@mocks/unified/data/index';

export type DataFactory = {
  cms: typeof cms;
  unified: typeof unified;
};

export const dataFactory: DataFactory = {
  cms,
  unified,
};

export async function dataFactoryFixture(use: (df: DataFactory) => Promise<void>): Promise<void> {
  await use({
    cms,
    unified,
  });
}
