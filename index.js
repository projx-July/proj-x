// index.js
require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');

// Setup ExpressReceiver to customize route handling
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// ✅ Temporary route for Slack URL verification
receiver.router.post('/slack/verify', express.json(), (req, res) => {
  if (req.body.type === 'url_verification') {
    console.log('Received Slack URL verification');
    res.status(200).send(req.body.challenge);
  } else {
    res.status(400).send('Invalid verification request');
  }
});

// ✅ Real event handler (like app_mention or message)
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

// 🚀 Start server
(async () => {
  const port = process.env.PORT || 3000;

  await app.start(port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}`);
})();


