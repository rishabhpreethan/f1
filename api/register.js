import { sql } from './_db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, username, password } = req.body || {};

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: 'email, username and password are required' });
    }

    // Check existing user
    const existing = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Use a transaction
    const userInsert = await sql`INSERT INTO users (email, username) VALUES (${email}, ${username}) RETURNING id`;
    const userId = userInsert.rows[0].id;
    await sql`INSERT INTO auth (user_id, password) VALUES (${userId}, ${hashed})`;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '24h' });
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Error in /api/register:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
