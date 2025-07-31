// index.js
require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const { supabase } = require('./supabaseClient');

// Setup ExpressReceiver to customize route handling
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Sample message handler
app.message(async ({ message, say }) => {
  if (!message.text) return;

  const lower = message.text.toLowerCase();

  if (lower.includes("standup")) {
    await say(`Hi <@${message.user}>! Please reply with the following:
1. *Current ticket*  
2. *Closed ticket*  
3. *Any blockers?*`);

    // You could optionally track that you're expecting a response from this user
  }
});
