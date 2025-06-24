import { db, type TestDatabase } from '../db';

export async function dbFixture(use: (db: TestDatabase) => Promise<void>) {
  await use(db);
  db.cms.clear();
  db.unified.clear();
}
