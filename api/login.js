import { sql } from './_db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const userResult = await sql`
      SELECT u.id, a.password
      FROM users u
      JOIN auth a ON u.id = a.user_id
      WHERE u.email = ${email}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '24h' });
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Error in /api/login:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
