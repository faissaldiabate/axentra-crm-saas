import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { CronJob } from "encore.dev/cron";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { notifications } from "~encore/clients";

const leadsDB = SQLDatabase.named("leads");
const authDB = SQLDatabase.named("auth");

export interface WeeklyReportData {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    leadsCreated: number;
    followupsSent: number;
    averageScore: number;
    conversionRate: number;
  };
  leadsBySource: Array<{
    source: string;
    count: number;
  }>;
  leadsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface GenerateReportRequest {
  userId?: number;
  startDate?: string;
  endDate?: string;
  format?: "json" | "pdf";
}

// Generates a weekly report for the authenticated user or specified user.
export const generateWeeklyReport = api<GenerateReportRequest, WeeklyReportData>(
  { auth: true, expose: true, method: "POST", path: "/reports/weekly" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = req.userId || parseInt(auth.userID);

    const endDate = req.endDate ? new Date(req.endDate) : new Date();
    const startDate = req.startDate ? new Date(req.startDate) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get leads created in the period
    const leadsCreated = await leadsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM leads
      WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    `;

    // Get follow-ups sent in the period
    const followupsSent = await leadsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM followup_logs fl
      JOIN leads l ON fl.lead_id = l.id
      WHERE l.user_id = ${userId}
      AND fl.sent_at >= ${startDate}
      AND fl.sent_at <= ${endDate}
    `;

    // Get average score
    const averageScore = await leadsDB.queryRow<{ avg: number }>`
      SELECT COALESCE(AVG(score), 0) as avg
      FROM leads
      WHERE user_id = ${userId}
      AND created_at <= ${endDate}
    `;

    // Get conversion rate (won leads / total leads)
    const conversionData = await leadsDB.queryRow<{ total: number; won: number }>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won
      FROM leads
      WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    `;

    const conversionRate = conversionData?.total ? (conversionData.won / conversionData.total) * 100 : 0;

    // Get leads by source
    const leadsBySource = await leadsDB.queryAll<{ source: string; count: number }>`
      SELECT COALESCE(source, 'unknown') as source, COUNT(*) as count
      FROM leads
      WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
      GROUP BY source
      ORDER BY count DESC
    `;

    // Get leads by status
    const leadsByStatus = await leadsDB.queryAll<{ status: string; count: number }>`
      SELECT status, COUNT(*) as count
      FROM leads
      WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
      GROUP BY status
      ORDER BY count DESC
    `;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        leadsCreated: leadsCreated?.count || 0,
        followupsSent: followupsSent?.count || 0,
        averageScore: Math.round(averageScore?.avg || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      leadsBySource,
      leadsByStatus,
    };
  }
);

// Automatically generates and sends weekly reports to all users
export const sendWeeklyReports = api<void, { sent: number }>(
  { expose: false, method: "POST", path: "/reports/send-weekly" },
  async () => {
    const users = await authDB.queryAll<{ id: number; email: string; first_name: string }>`
      SELECT id, email, first_name FROM users
    `;

    let sent = 0;

    for (const user of users) {
      try {
        const report = await generateWeeklyReport.call({
          userId: user.id,
        });

        const message = `
Hi ${user.first_name},

Here's your weekly CRM report:

📊 Metrics:
- Leads Created: ${report.metrics.leadsCreated}
- Follow-ups Sent: ${report.metrics.followupsSent}
- Average Lead Score: ${report.metrics.averageScore}
- Conversion Rate: ${report.metrics.conversionRate}%

📈 Leads by Source:
${report.leadsBySource.map(item => `- ${item.source}: ${item.count}`).join('\n')}

📋 Leads by Status:
${report.leadsByStatus.map(item => `- ${item.status}: ${item.count}`).join('\n')}

Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}

Best regards,
Axentra CRM
        `;

        await notifications.sendNotification({
          userId: user.id,
          message,
          channel: "email",
          recipient: user.email,
          subject: "Your Weekly CRM Report",
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send report to user ${user.id}:`, error);
      }
    }

    return { sent };
  }
);

// Cron job to send weekly reports every Monday at 8 AM
const _ = new CronJob("weekly-reports", {
  title: "Send Weekly Reports",
  schedule: "0 8 * * 1", // Every Monday at 8 AM
  endpoint: sendWeeklyReports,
});
