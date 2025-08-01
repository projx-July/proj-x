require('dotenv').config();
const { App } = require('@slack/bolt');
const { handleUpdateMessage } = require("./jira");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Add middleware to log ALL incoming events
app.use(async ({ payload, next }) => {
  console.log("🌍 Received Slack event:", payload.type || 'unknown');
  if (payload.event) {
    console.log("📝 Event details:", {
      type: payload.event.type,
      subtype: payload.event.subtype,
      user: payload.event.user,
      text: payload.event.text,
      channel: payload.event.channel
    });
  }
  await next();
});

// Add error handling
app.error((error) => {
  console.error('❌ Slack app error:', error);
});

// Test command to verify bot is responding
app.message(/^test bot$/i, async ({ message, say }) => {
  await say(`🤖 Bot is working! User: <@${message.user}>, Channel: ${message.channel}`);
});

// ✅ Combined handler for all messages with better debugging
app.message(async ({ message, say, client }) => {
  try {
    console.log("📨 Full message object:", JSON.stringify(message, null, 2));
    
    // Skip bot messages and messages without text
    if (message.subtype === 'bot_message' || !message.text) {
      console.log("⚠️ Skipping bot message or message without text");
      return;
    }

    console.log("🔥 Received message:", message.text);
    console.log("👤 From user:", message.user);
    console.log("📍 Channel:", message.channel);
    
    const text = message.text.toLowerCase();
    
    // Check for Jira update patterns
    if (text.includes("in progress:") || text.includes("in review:") || text.includes("done:") || text.includes("to do:")) {
      console.log("🎯 Detected Jira update message");
      
      try {
        await say(`Processing your update <@${message.user}>...`);
        console.log("✅ Sent processing message");
        
        await handleUpdateMessage(message.text);
        console.log("✅ Handled Jira update");
        
        await say(`✅ Jira tickets updated based on your input.`);
        console.log("✅ Sent completion message");
        
      } catch (error) {
        console.error("❌ Error processing Jira update:", error);
        await say(`❌ Error processing your update: ${error.message}`);
      }
      
    } else if (text.includes("standup")) {
      console.log("🎯 Detected standup message");
      
      await say(`Hi <@${message.user}>! Please reply with the following:
1. *Current ticket*
2. *Closed ticket*
3. *Any blockers?*`);
      console.log("✅ Sent standup response");
    } else {
      console.log("ℹ️ Message doesn't match any patterns");
    }
    
  } catch (error) {
    console.error("❌ Error in message handler:", error);
  }
});

// ✅ Slash command handler for /standup
app.command('/standup', async ({ command, ack, respond }) => {
  try {
    console.log("🎯 Received /standup command from:", command.user_id);
    
    await ack();
    console.log("✅ Acknowledged slash command");
    
    await respond({
      text: `👋 Hi <@${command.user_id}>, please reply with the following:
1. *Current ticket*
2. *Closed ticket*
3. *Any blockers?*`,
      response_type: 'in_channel'
    });
    console.log("✅ Sent standup response");
    
  } catch (error) {
    console.error("❌ Error in slash command handler:", error);
  }
});

// ✅ Start the app with better error handling
(async () => {
  try {
    const port = process.env.PORT || 3000;
    
    // Verify environment variables
    console.log("🔧 Environment check:");
    console.log("- SLACK_BOT_TOKEN:", process.env.SLACK_BOT_TOKEN ? "✅ Set" : "❌ Missing");
    console.log("- SLACK_SIGNING_SECRET:", process.env.SLACK_SIGNING_SECRET ? "✅ Set" : "❌ Missing");
    console.log("- JIRA_EMAIL:", process.env.JIRA_EMAIL ? "✅ Set" : "❌ Missing");
    console.log("- JIRA_API_TOKEN:", process.env.JIRA_API_TOKEN ? "✅ Set" : "❌ Missing");
    
    await app.start(port);
    console.log(`⚡️ Slack Bolt app running on port ${port}`);
    
  } catch (error) {
    console.error("❌ Failed to start app:", error);
    process.exit(1);
  }
})();



