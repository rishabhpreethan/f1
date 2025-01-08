import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const db = new Database('sqlite.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const createUser = async ({ email, username, password }) => {
  try {
    console.log('Creating user:', { email, username }); // Debug log
    
    // Check if user already exists
    const checkUser = db.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = checkUser.get(email);

    if (existingUser) {
      console.log('User already exists:', email);
      return { success: false, error: 'User already exists' };
    }

    const hashedPassword = await hashPassword(password);
    
    // Start a transaction
    const transaction = db.transaction((email, username, hashedPassword) => {
      // Insert user
      const insertUser = db.prepare(
        'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
      );
      const userResult = insertUser.run(email, username, Date.now());
      const userId = userResult.lastInsertRowid;

      // Insert auth record
      const insertAuth = db.prepare(
        'INSERT INTO auth (user_id, password) VALUES (?, ?)'
      );
      insertAuth.run(userId, hashedPassword);

      return userId;
    });

    // Execute transaction
    const userId = transaction(email, username, hashedPassword);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
    
    console.log('User created successfully:', { userId });
    return { success: true, token };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    console.log('Attempting login for:', email);
    
    const stmt = db.prepare(`
      SELECT users.*, auth.password
      FROM users
      JOIN auth ON users.id = auth.user_id
      WHERE users.email = ?
    `);
    
    const user = stmt.get(email);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { success: false, error: 'Invalid password' };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    console.log('Login successful:', { userId: user.id });
    return { success: true, token };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return { success: false, error: error.message || 'Failed to log in' };
  }
};
