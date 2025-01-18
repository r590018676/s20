const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { loadUsers, authenticateUser, requireAuth } = require('./auth');
const { 
  loadAllData,
  events,
  news,
  resources,
  groups,
  saveEvents,
  saveNews,
  saveResources,
  saveCommunity,
  initializeUserPoints,
  awardPoints,
  getLeaderboard,
  getUserProfile
} = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;

// Load all data on startup
loadUsers();
loadAllData();
initializeUserPoints(require('../data/credentials.json'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).redirect('/dashboard');
  }
  next();
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.post('/login', (req, res) => {
  const { loginId, password } = req.body;
  const user = authenticateUser(loginId, password);

  if (user) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.redirect('/login?error=1');
  }
});

// Main pages
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

app.get('/events', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/events.html'));
});

app.get('/leaderboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/leaderboard.html'));
});

// New pages
app.get('/news-discussion', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/news-discussion.html'));
});

app.get('/resources', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/resources.html'));
});

app.get('/community', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/community.html'));
});

app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});

// API Routes
app.get('/api/user', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
  const users = require('../data/credentials.json');
  res.json(users);
});

// Events API
app.get('/api/events', requireAuth, (req, res) => {
  res.json(events);
});

app.post('/api/events', requireAuth, (req, res) => {
  const { title, activityType, dateTime, maxParticipants } = req.body;
  const newEvent = {
    eventId: `evt-${Date.now()}`,
    title,
    activityType,
    dateTime,
    maxParticipants: parseInt(maxParticipants),
    joinedUsers: [],
    createdBy: req.session.user.loginId
  };
  
  events.push(newEvent);
  saveEvents();
  res.json(newEvent);
});

app.post('/api/events/:eventId/join', requireAuth, (req, res) => {
  const { eventId } = req.params;
  const event = events.find(e => e.eventId === eventId);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  if (event.joinedUsers.length >= event.maxParticipants) {
    return res.status(400).json({ error: 'Event is full' });
  }
  
  if (!event.joinedUsers.includes(req.session.user.loginId)) {
    event.joinedUsers.push(req.session.user.loginId);
    awardPoints(req.session.user.loginId, event.activityType);
    saveEvents();
  }
  
  res.json(event);
});

// News Discussion API
app.get('/api/news', requireAuth, (req, res) => {
  res.json(news);
});

app.post('/api/news', requireAuth, (req, res) => {
  const { title, content } = req.body;
  const newDiscussion = {
    id: `news-${Date.now()}`,
    title,
    content,
    postedBy: req.session.user.loginId,
    postedAt: new Date().toISOString(),
    comments: []
  };
  
  news.push(newDiscussion);
  saveNews();
  res.json(newDiscussion);
});

app.post('/api/news/:id/comment', requireAuth, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const discussion = news.find(n => n.id === id);
  
  if (!discussion) {
    return res.status(404).json({ error: 'Discussion not found' });
  }
  
  const comment = {
    id: `comment-${Date.now()}`,
    content,
    postedBy: req.session.user.loginId,
    postedAt: new Date().toISOString()
  };
  
  discussion.comments.push(comment);
  saveNews();
  res.json(comment);
});

// Resources API
app.get('/api/resources', requireAuth, (req, res) => {
  res.json(resources);
});

app.post('/api/resources', requireAuth, requireAdmin, (req, res) => {
  const { title, description, category, url } = req.body;
  const newResource = {
    resourceId: `res-${Date.now()}`,
    title,
    description,
    category,
    url,
    addedBy: req.session.user.loginId,
    addedAt: new Date().toISOString()
  };
  
  resources.push(newResource);
  saveResources();
  res.json(newResource);
});

// Community API
app.get('/api/groups', requireAuth, (req, res) => {
  res.json(groups);
});

app.post('/api/groups', requireAuth, (req, res) => {
  const { name, description } = req.body;
  const newGroup = {
    groupId: `grp-${Date.now()}`,
    name,
    description,
    createdBy: req.session.user.loginId,
    createdAt: new Date().toISOString(),
    members: [req.session.user.loginId],
    messages: []
  };
  
  groups.push(newGroup);
  saveCommunity();
  res.json(newGroup);
});

app.post('/api/groups/:groupId/join', requireAuth, (req, res) => {
  const { groupId } = req.params;
  const group = groups.find(g => g.groupId === groupId);
  
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  if (!group.members.includes(req.session.user.loginId)) {
    group.members.push(req.session.user.loginId);
    saveCommunity();
  }
  
  res.json(group);
});

app.post('/api/groups/:groupId/message', requireAuth, (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const group = groups.find(g => g.groupId === groupId);
  
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  if (!group.members.includes(req.session.user.loginId)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }
  
  const message = {
    id: `msg-${Date.now()}`,
    content,
    postedBy: req.session.user.loginId,
    postedAt: new Date().toISOString()
  };
  
  group.messages.push(message);
  saveCommunity();
  res.json(message);
});

// Profile API
app.get('/api/profile', requireAuth, (req, res) => {
  const profile = getUserProfile(req.session.user.loginId);
  res.json(profile);
});

app.get('/api/leaderboard', requireAuth, (req, res) => {
  res.json(getLeaderboard());
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});