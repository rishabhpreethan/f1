import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize database connection
const getDb = async () => {
  return open({
    filename: process.env.DB_PATH,
    driver: sqlite3.Database
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Basic SQL injection prevention
    if (query.toLowerCase().includes('drop') || 
        query.toLowerCase().includes('delete') || 
        query.toLowerCase().includes('update') || 
        query.toLowerCase().includes('insert')) {
      return res.status(403).json({ error: 'Only SELECT queries are allowed' });
    }

    const db = await getDb();
    try {
      const results = await db.all(query);
      return res.status(200).json(results);
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ 
      error: 'Failed to execute query',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
