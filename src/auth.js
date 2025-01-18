const fs = require('fs');
const path = require('path');

let users = [];

function loadUsers() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/credentials.json'), 'utf8');
    users = JSON.parse(data);
    console.log('Users loaded successfully');
  } catch (error) {
    console.error('Error loading users:', error);
    process.exit(1);
  }
}

function authenticateUser(loginId, password) {
  const user = users.find(u => u.loginId === loginId && u.password === password);
  if (user) {
    return {
      ...user,
      isAdmin: user.type === 'admin'
    };
  }
  return null;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

module.exports = {
  loadUsers,
  authenticateUser,
  requireAuth
};