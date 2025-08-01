const axios = require("axios");

const jiraBaseURL = "https://projectxjul.atlassian.net";
const authHeader = {
  Authorization:
    "Basic " +
    Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64"),
  Accept: "application/json",
  "Content-Type": "application/json"
};

// Only allow these statuses
const allowedStatuses = ["to do", "in progress", "in review", "done"];

// Parse Slack message like: In Progress: SCRUM-1, SCRUM-2, Done: SCRUM-3
function parseUpdateMessage(text) {
  const updates = {};
  const parts = text.split(/[,;\n]/).join(",").split(/(?=[A-Z][a-z]+\s*[:])/);
  for (const part of parts) {
    const match = part.match(/([A-Za-z\s]+):\s*([A-Z]+-\d+(?:,\s*[A-Z]+-\d+)*)/);
    if (match) {
      const status = match[1].trim().toLowerCase();
      const tickets = match[2].split(",").map((t) => t.trim());
      if (allowedStatuses.includes(status)) {
        updates[status] = tickets;
      }
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
    (t) => t.name.toLowerCase() === targetStatus.toLowerCase()
  );

  if (!target) {
    console.log(`⚠️ No transition found for "${targetStatus}" in ${ticketId}`);
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

