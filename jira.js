const axios = require("axios");

const jiraBaseURL = "https://projectxjul.atlassian.net";
const authHeader = {
  Authorization:
    "Basic " +
    Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64"),
  Accept: "application/json",
  "Content-Type": "application/json"
};

// Allowed statuses (Jira workflow names must match these exactly)
const allowedStatuses = ["to do", "in progress", "in review", "done"];

// Parse messages like: In Progress: SCRUM-1, SCRUM-2, Done: SCRUM-3
function parseUpdateMessage(text) {
  console.log("🔍 Parsing message:", text);
  
  const updates = {};
  const normalizedText = text.replace(/\n/g, " ").replace(/;/g, ",");
  console.log("📝 Normalized text:", normalizedText);
  
  const regex = /([A-Za-z ]+):\s*([^:]+)/gi;
  let match;
  
  while ((match = regex.exec(normalizedText)) !== null) {
    const status = match[1].trim().toLowerCase();
    const ticketsString = match[2];
    
    console.log(`🎯 Found match - Status: "${status}", Tickets string: "${ticketsString}"`);
    
    const tickets = ticketsString
      .split(",")
      .map((ticket) => ticket.trim().toUpperCase())
      .filter((t) => {
        const isValid = /^[A-Z]+-\d+$/.test(t);
        console.log(`🎫 Ticket "${t}" is ${isValid ? 'valid' : 'invalid'}`);
        return isValid;
      });

    if (allowedStatuses.includes(status) && tickets.length > 0) {
      updates[status] = tickets;
      console.log(`✅ Added update: ${status} -> [${tickets.join(', ')}]`);
    } else {
      console.log(`⚠️ Skipped - Status "${status}" not allowed or no valid tickets`);
    }
  }
  
  console.log("📊 Final parsed updates:", updates);
  return updates;
}

async function getTransitions(ticketId) {
  try {
    console.log(`🔄 Getting transitions for ${ticketId}`);
    
    const res = await axios.get(
      `${jiraBaseURL}/rest/api/3/issue/${ticketId}/transitions`,
      { headers: authHeader }
    );
    
    const transitions = res.data.transitions || [];
    console.log(`📋 Available transitions for ${ticketId}:`, 
      transitions.map(t => `"${t.name}" (id: ${t.id})`));
    
    return transitions;
    
  } catch (error) {
    console.error(`❌ Error getting transitions for ${ticketId}:`, error.response?.data || error.message);
    throw error;
  }
}

async function transitionTicket(ticketId, targetStatus) {
  try {
    console.log(`🎯 Attempting to transition ${ticketId} to "${targetStatus}"`);
    
    const transitions = await getTransitions(ticketId);
    const target = transitions.find(
      (t) => t.name.trim().toLowerCase() === targetStatus.toLowerCase()
    );

    if (!target) {
      const availableTransitions = transitions.map(t => t.name).join(', ');
      console.warn(`⚠️ No transition to "${targetStatus}" found for ${ticketId}`);
      console.warn(`Available transitions: ${availableTransitions}`);
      throw new Error(`No transition to "${targetStatus}" available for ${ticketId}. Available: ${availableTransitions}`);
    }

    console.log(`🔄 Using transition "${target.name}" (id: ${target.id})`);
    
    await axios.post(
      `${jiraBaseURL}/rest/api/3/issue/${ticketId}/transitions`,
      { transition: { id: target.id } },
      { headers: authHeader }
    );
    
    console.log(`✅ Updated ${ticketId} to "${targetStatus}"`);
    
  } catch (error) {
    console.error(`❌ Failed to transition ${ticketId}:`, error.response?.data || error.message);
    throw error;
  }
}

async function handleUpdateMessage(text) {
  console.log("🚀 Starting to handle update message");
  
  const parsed = parseUpdateMessage(text);
  
  if (Object.keys(parsed).length === 0) {
    console.warn("⚠️ No valid updates found in message:", text);
    throw new Error("No valid Jira ticket updates found in your message");
  }

  const results = [];
  const errors = [];

  for (const [status, tickets] of Object.entries(parsed)) {
    console.log(`📝 Processing ${tickets.length} tickets for status "${status}"`);
    
    for (const ticket of tickets) {
      try {
        await transitionTicket(ticket, status);
        results.push(`${ticket} -> ${status}`);
      } catch (err) {
        const errorMsg = `Failed to update ${ticket}: ${err.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  }

  console.log(`📊 Results: ${results.length} successful, ${errors.length} failed`);
  
  if (errors.length > 0) {
    throw new Error(`Some updates failed: ${errors.join('; ')}`);
  }
}

module.exports = {
  handleUpdateMessage,
  parseUpdateMessage, // Export for testing
  getTransitions,     // Export for testing
  transitionTicket    // Export for testing
};


