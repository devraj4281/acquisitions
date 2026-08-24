import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '#models/user.model.js';

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
