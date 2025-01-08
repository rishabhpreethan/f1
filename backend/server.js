import express from 'express';
import cors from 'cors';
import { createUser, loginUser } from '../src/utils/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.post('/api/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      console.log('Missing fields:', { email: !!email, username: !!username, password: !!password });
      return res.status(400).json({ 
        success: false, 
        error: `Please provide all required fields: ${[
          !email && 'email',
          !username && 'username',
          !password && 'password'
        ].filter(Boolean).join(', ')}` 
      });
    }

    const result = await createUser({ email, username, password });
    console.log('Create user result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Server error in /api/register:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing fields:', { email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false, 
        error: `Please provide ${!email ? 'email' : ''} ${!password ? 'password' : ''}`.trim()
      });
    }

    const result = await loginUser({ email, password });
    console.log('Login result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Server error in /api/login:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
