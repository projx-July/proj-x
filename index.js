require('dotenv').config();
const { App } = require('@slack/bolt');

console.log('Starting Slack Bot...');
console.log('Environment variables check:');
console.log('SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
console.log('SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
console.log('PORT:', process.env.PORT || 3000);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  port: process.env.PORT || 3000
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
    await app.start();
    console.log('⚡️ Slack Bolt app is running on port', process.env.PORT || 3000);
    console.log('URL for Slack: https://proj-x-vixf.onrender.com/slack/events');
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
})();

