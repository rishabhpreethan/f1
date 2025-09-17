import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env when running script directly
dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  try {
    const schemaPath = path.join(__dirname, '..', 'db', 'postgres_schema.sql');
    const ddl = await fs.readFile(schemaPath, 'utf8');

    // Split by semicolon while preserving statements; filter out empty
    const statements = ddl
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      // Add back the semicolon for clarity in logs
      const text = stmt.endsWith(';') ? stmt : `${stmt};`;
      console.log(`Executing: ${text.substring(0, 120)}...`);
      await sql.query(text);
    }

    console.log('✅ Database schema created/verified successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exitCode = 1;
  }
}

main();
