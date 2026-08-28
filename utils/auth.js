const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const expiration = '2h';

const authMiddleware = (req, res, next) => {

  let token = req.body.token || req.query.token || req.headers.authorization;
  console.log('token: ' + token);

  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    res.status(400).json({ message: 'Bearer Token not supplied or invalid' });
    return;
  }

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    req.user = data;
    next();
  } catch (err) {
    console.log('Invalid token');
    res.status(400).json({ message: 'Invalid token: ' + err.message });
  }

  return req;
}

const signToken = (user) => {

  const payload = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}

// Like authMiddleware, but never blocks the request — just attaches
// req.user if a valid token is present, otherwise leaves it undefined.
// Used on public routes that behave slightly differently for a logged-in
// viewer (e.g. showing your own pending posts) without requiring login.
const optionalAuth = (req, res, next) => {
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return next();
  }

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    req.user = data;
  } catch (err) {
    // Invalid/expired token on an optional route — just proceed as anonymous
  }

  next();
}

// Requires a valid token AND that the user is flagged as an admin.
// Must run after authMiddleware (relies on req.user.id being set).
const adminMiddleware = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
}

module.exports = { authMiddleware, optionalAuth, adminMiddleware, signToken };