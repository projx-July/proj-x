require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const { supabase } = require('./supabaseClient');

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Slack message handler
app.message(async ({ message, say }) => {
  if (!message.text) return;

  const lower = message.text.toLowerCase();

  if (lower.includes("standup")) {
    await say(`Hi <@${message.user}>! Please reply with the following:
1. *Current ticket*  
2. *Closed ticket*  
3. *Any blockers?*`);
  }
});

// Start the app (important!)
(async () => {
  const port = process.env.PORT || 3000;

  await app.start(port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}`);
})();
