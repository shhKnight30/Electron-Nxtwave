const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../config/database');

// Generate JWT that matches your middleware + controller format
function generateToken(userId) {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// REGISTER USER (Used by authController)
async function registerUser({ username, email, password }) {
  // Check if user already exists
  const existingUser = await getQuery(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (existingUser) {
    throw new Error(existingUser.email === email ? 'Email already registered' : 'Username already taken');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create preferences object
  const defaultPreferences = JSON.stringify({
    theme: 'dark',
    useOnlineAI: false
  });

  // Insert into DB
  const result = await runQuery(
    'INSERT INTO users (username, email, password_hash, preferences) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, defaultPreferences]
  );

  // Generate JWT
  const token = generateToken(result.id);

  // Return consistent shape
  return {
    id: result.id,
    username,
    email,
    token
  };
}

// LOGIN USER (Used by authController)
async function loginUser({ email, password }) {
  const user = await getQuery(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid credentials');

  // Update last login timestamp
  await runQuery(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
    [user.id]
  );

  // Generate JWT
  const token = generateToken(user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    preferences: user.preferences ? JSON.parse(user.preferences) : {},
    token
  };
}

module.exports = {
  generateToken,
  registerUser,
  loginUser
};
