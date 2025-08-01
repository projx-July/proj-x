require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const { handleUpdateMessage } = require("./jira");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Optional: Slack event URL verification (can be removed later)
receiver.router.post('/slack/verify', express.json(), (req, res) => {
  if (req.body.type === 'url_verification') {
    res.status(200).send(req.body.challenge);
  } else {
    res.status(400).send('Invalid verification request');
  }
});

// ✅ Combined handler for all messages
app.message(async ({ message, say }) => {
  if (!message.text) return;
   console.log("🔥 Received message:", message.text);
  const text = message.text.toLowerCase();

  if (text.includes("in progress:") || text.includes("in review:") || text.includes("done:") || text.includes("to do:")) {
    await say(`Processing your update <@${message.user}>...`);
    await handleUpdateMessage(message.text);
    await say(`✅ Jira tickets updated based on your input.`);
  } else if (text.includes("standup")) {
    await say(`Hi <@${message.user}>! Please reply with the following:
1. *Current ticket*  
2. *Closed ticket*  
3. *Any blockers?*`);
  }
});

// ✅ Slash command handler for /standup
app.command('/standup', async ({ command, ack, respond }) => {
  await ack();
  await respond({
    text: `👋 Hi <@${command.user_id}>, please reply with the following:
1. *Current ticket*  
2. *Closed ticket*  
3. *Any blockers?*`,
    response_type: 'in_channel'
  });
});

// ✅ Start the app
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slack Bolt app running on port ${port}`);
})();




