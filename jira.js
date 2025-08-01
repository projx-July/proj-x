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
  const updates = {};
  const normalizedText = text.replace(/\n/g, " ").replace(/;/g, ",");
  const regex = /([A-Za-z ]+):\s*([^:]+)/gi;
  let match;

  while ((match = regex.exec(normalizedText)) !== null) {
    const status = match[1].trim().toLowerCase();
    const tickets = match[2]
      .split(",")
      .map((ticket) => ticket.trim().toUpperCase())
      .filter((t) => /^[A-Z]+-\d+$/.test(t)); // valid Jira keys only

    if (allowedStatuses.includes(status) && tickets.length > 0) {
      updates[status] = tickets;
    }
  }

  return updates;
}

async function getTransitions(ticketId) {
  const res = await axios.get(
    `${jiraBaseURL}/rest/api/3/issue/${ticketId}/transitions`,
    { headers: authHeader }
  );
  return res.data.transitions || [];
}

async function transitionTicket(ticketId, targetStatus) {
  const transitions = await getTransitions(ticketId);

  const target = transitions.find(
    (t) => t.name.trim().toLowerCase() === targetStatus.toLowerCase()
  );

  if (!target) {
    console.warn(`⚠️ No transition to "${targetStatus}" found for ${ticketId}`);
    return;
  }

  await axios.post(
    `${jiraBaseURL}/rest/api/3/issue/${ticketId}/transitions`,
    { transition: { id: target.id } },
    { headers: authHeader }
  );

  console.log(`✅ Updated ${ticketId} to "${targetStatus}"`);
}

async function handleUpdateMessage(text) {
  const parsed = parseUpdateMessage(text);
  if (Object.keys(parsed).length === 0) {
    console.warn("⚠️ No valid updates found in message:", text);
    return;
  }

  for (const [status, tickets] of Object.entries(parsed)) {
    for (const ticket of tickets) {
      try {
        await transitionTicket(ticket, status);
      } catch (err) {
        console.error(`❌ Failed to update ${ticket}:`, err.response?.data || err.message);
      }
    }
  }
}

module.exports = {
  handleUpdateMessage
};


