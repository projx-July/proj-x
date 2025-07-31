require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const { supabase } = require('./supabaseClient');

// Create a custom ExpressReceiver
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Remove this conflicting route - Bolt handles it automatically
// receiver.router.post('/slack/events', (req, res) => {
//   if (req.body.type === 'url_verification') {
//     return res.send({ challenge: req.body.challenge });
//   }
// });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Your message handler
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

// Start the server
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app is running on port 3000');
})();

