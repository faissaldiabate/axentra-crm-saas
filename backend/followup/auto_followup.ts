import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { CronJob } from "encore.dev/cron";

const leadsDB = SQLDatabase.named("leads");

interface InactiveLeadsResponse {
  processed: number;
  sent: number;
}

// Generates AI-powered follow-up messages for inactive leads.
async function generateFollowupMessage(leadName: string, company?: string): Promise<string> {
  // Placeholder for AI integration (OpenAI, Claude, etc.)
  const templates = [
    `Hi ${leadName}, I wanted to follow up on our previous conversation. Are you still interested in learning more about our solution?`,
    `Hello ${leadName}, I hope you're doing well. I wanted to check if you had any questions about our proposal.`,
    `Hi ${leadName}, I noticed we haven't connected in a few days. Would you like to schedule a quick call to discuss your needs?`,
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return company ? template + ` I believe our solution could be particularly valuable for ${company}.` : template;
}

// Processes inactive leads and sends follow-up messages.
export const processInactiveLeads = api<void, InactiveLeadsResponse>(
  { expose: false, method: "POST", path: "/followup/process" },
  async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const inactiveLeads = await leadsDB.queryAll<{
      id: number;
      name: string;
      email: string;
      company: string | null;
      user_id: number;
    }>`
      SELECT id, name, email, company, user_id
      FROM leads 
      WHERE last_activity < ${threeDaysAgo}
      AND status IN ('new', 'contacted')
      AND id NOT IN (
        SELECT lead_id FROM followup_logs 
        WHERE sent_at > ${threeDaysAgo}
      )
    `;

    let sent = 0;

    for (const lead of inactiveLeads) {
      try {
        const message = await generateFollowupMessage(lead.name, lead.company || undefined);
        
        // Log the follow-up
        await leadsDB.exec`
          INSERT INTO followup_logs (lead_id, message)
          VALUES (${lead.id}, ${message})
        `;

        // Update lead's last activity
        await leadsDB.exec`
          UPDATE leads SET last_activity = NOW() WHERE id = ${lead.id}
        `;

        // Here you would integrate with your email service
        // await sendEmail(lead.email, "Follow-up", message);
        
        sent++;
      } catch (error) {
        console.error(`Failed to process lead ${lead.id}:`, error);
      }
    }

    return {
      processed: inactiveLeads.length,
      sent,
    };
  }
);

// Cron job to automatically process inactive leads every day at 9 AM
const _ = new CronJob("auto-followup", {
  title: "Auto Follow-up Inactive Leads",
  schedule: "0 9 * * *", // Daily at 9 AM
  endpoint: processInactiveLeads,
});
