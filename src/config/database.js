import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// When running under Docker Compose with Neon Local, the serverless driver
// must use HTTP (not WebSockets) because Neon Local only exposes an HTTP endpoint.
// These settings are only applied in development to keep production unchanged.
if (process.env.NODE_ENV === 'development') {
  const dbHost = process.env.NEON_LOCAL_HOST || 'db';
  neonConfig.fetchEndpoint = `http://${dbHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };