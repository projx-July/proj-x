require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');

console.log('Starting Slack Bot...');
console.log('Environment variables check:');
console.log('SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
console.log('SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
console.log('PORT:', process.env.PORT || 3000);

// Create ExpressReceiver with manual challenge handling
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events'
});

// IMPORTANT: Add manual challenge handler BEFORE creating the App
receiver.router.post('/slack/events', (req, res, next) => {
  console.log('=== POST REQUEST RECEIVED ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', req.body?.type);
  console.log('Challenge:', req.body?.challenge);
  
  // Handle URL verification challenge manually
  if (req.body && req.body.type === 'url_verification') {
    console.log('URL verification challenge detected!');
    console.log('Challenge value:', req.body.challenge);
    
    // Respond with just the challenge value (not wrapped in an object)
    res.status(200).send(req.body.challenge);
    return; // Don't call next() - we're done
  }
  
  // For all other requests, pass to Slack Bolt
  next();
});

// Health check endpoint
receiver.router.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running!', 
    timestamp: new Date().toISOString(),
    endpoint: '/slack/events',
    env_check: {
      bot_token: !!process.env.SLACK_BOT_TOKEN,
      signing_secret: !!process.env.SLACK_SIGNING_SECRET
    }
  });
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Simple message handler
app.message(async ({ message, say }) => {
  console.log('Message received:', message);
  
  if (!message.text) return;
  
  const lower = message.text.toLowerCase();
  if (lower.includes("standup")) {
    console.log('Standup message detected, responding...');
    await say(`Hi <@${message.user}>! Please reply with the following:
1. *Current ticket*
2. *Closed ticket*
3. *Any blockers?*`);
  }
});

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

// Start the server
(async () => {
  try {
    console.log('Attempting to start server...');
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Slack Bolt app is running on port', process.env.PORT || 3000);
    console.log('URL for Slack: https://proj-x-vixf.onrender.com/slack/events');
    console.log('Health check: https://proj-x-vixf.onrender.com/');
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
})();

