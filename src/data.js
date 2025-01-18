const fs = require('fs');
const path = require('path');

let events = [];
let news = [];
let resources = [];
let groups = [];
const userPoints = new Map();

// Initialize user points
function initializeUserPoints(users) {
  users.forEach(user => {
    userPoints.set(user.loginId, {
      mockInterview: 0,
      caseDiscussion: 0,
      newsDiscussion: 0,
      debatePresentation: 0,
      total: 0
    });
  });
}

// Load all data
function loadAllData() {
  loadEvents();
  loadNews();
  loadResources();
  loadCommunity();
}

// Load events from file
function loadEvents() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/events.json'), 'utf8');
    events = JSON.parse(data).events;
    console.log('Events loaded successfully');
  } catch (error) {
    console.error('Error loading events:', error);
    events = [];
  }
}

// Load news from file
function loadNews() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/news.json'), 'utf8');
    news = JSON.parse(data).discussions;
    console.log('News discussions loaded successfully');
  } catch (error) {
    console.error('Error loading news:', error);
    news = [];
  }
}

// Load resources from file
function loadResources() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/resources.json'), 'utf8');
    resources = JSON.parse(data).resources;
    console.log('Resources loaded successfully');
  } catch (error) {
    console.error('Error loading resources:', error);
    resources = [];
  }
}

// Load community data from file
function loadCommunity() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/community.json'), 'utf8');
    groups = JSON.parse(data).groups;
    console.log('Community groups loaded successfully');
  } catch (error) {
    console.error('Error loading community groups:', error);
    groups = [];
  }
}

// Save functions for each data type
function saveEvents() {
  try {
    fs.writeFileSync(
      path.join(__dirname, '../data/events.json'),
      JSON.stringify({ events }, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving events:', error);
  }
}

function saveNews() {
  try {
    fs.writeFileSync(
      path.join(__dirname, '../data/news.json'),
      JSON.stringify({ discussions: news }, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving news:', error);
  }
}

function saveResources() {
  try {
    fs.writeFileSync(
      path.join(__dirname, '../data/resources.json'),
      JSON.stringify({ resources }, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving resources:', error);
  }
}

function saveCommunity() {
  try {
    fs.writeFileSync(
      path.join(__dirname, '../data/community.json'),
      JSON.stringify({ groups }, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving community data:', error);
  }
}

// Get points for activity type
function getPointsForActivity(activityType) {
  const pointsMap = {
    'Mock Interview': 10,
    'Case Study': 8,
    'News Discussion': 6,
    'Debate': 12
  };
  return pointsMap[activityType] || 5;
}

// Award points to user
function awardPoints(loginId, activityType) {
  const points = getPointsForActivity(activityType);
  const userPoint = userPoints.get(loginId);
  
  if (userPoint) {
    const category = activityType.toLowerCase().replace(/\s+/g, '');
    if (userPoint[category] !== undefined) {
      userPoint[category] += points;
    }
    userPoint.total += points;
  }
}

// Get leaderboard
function getLeaderboard() {
  return Array.from(userPoints.entries())
    .map(([loginId, points]) => ({ loginId, ...points }))
    .sort((a, b) => b.total - a.total);
}

// Get user profile data
function getUserProfile(loginId) {
  const points = userPoints.get(loginId) || {
    mockInterview: 0,
    caseDiscussion: 0,
    newsDiscussion: 0,
    debatePresentation: 0,
    total: 0
  };

  const userEvents = events.filter(event => 
    event.createdBy === loginId || event.joinedUsers.includes(loginId)
  );

  const userGroups = groups.filter(group => 
    group.members.includes(loginId)
  );

  return {
    points,
    events: userEvents,
    groups: userGroups
  };
}

module.exports = {
  events,
  news,
  resources,
  groups,
  loadAllData,
  saveEvents,
  saveNews,
  saveResources,
  saveCommunity,
  initializeUserPoints,
  awardPoints,
  getLeaderboard,
  getUserProfile,
  userPoints
};