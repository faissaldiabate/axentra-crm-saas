import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import { scoringDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const leadsDB = SQLDatabase.named("leads");

interface ScoreCalculationResponse {
  updated: number;
}

// Calculates lead scores based on engagement data.
function calculateScore(engagements: Array<{ event_type: string; created_at: Date }>): number {
  const scoreWeights = {
    email_open: 1,
    email_click: 3,
    email_reply: 10,
    call_answered: 15,
    meeting_scheduled: 25,
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let score = 0;
  for (const engagement of engagements) {
    if (engagement.created_at > thirtyDaysAgo) {
      const weight = scoreWeights[engagement.event_type as keyof typeof scoreWeights] || 0;
      // Apply time decay - more recent events have higher weight
      const daysSince = Math.floor((Date.now() - engagement.created_at.getTime()) / (1000 * 60 * 60 * 24));
      const timeDecay = Math.max(0.1, 1 - (daysSince / 30));
      score += weight * timeDecay;
    }
  }

  return Math.round(score);
}

// Updates lead scores based on recent engagement.
export const updateLeadScores = api<void, ScoreCalculationResponse>(
  { expose: false, method: "POST", path: "/scoring/update" },
  async () => {
    const leads = await leadsDB.queryAll<{ id: number }>`
      SELECT id FROM leads
    `;

    let updated = 0;

    for (const lead of leads) {
      try {
        const engagements = await scoringDB.queryAll<{
          event_type: string;
          created_at: Date;
        }>`
          SELECT event_type, created_at
          FROM lead_engagement
          WHERE lead_id = ${lead.id}
          ORDER BY created_at DESC
        `;

        const newScore = calculateScore(engagements);

        await leadsDB.exec`
          UPDATE leads SET score = ${newScore}, updated_at = NOW()
          WHERE id = ${lead.id}
        `;

        updated++;
      } catch (error) {
        console.error(`Failed to update score for lead ${lead.id}:`, error);
      }
    }

    return { updated };
  }
);

// Cron job to update lead scores daily at 2 AM
const _ = new CronJob("update-lead-scores", {
  title: "Update Lead Scores",
  schedule: "0 2 * * *", // Daily at 2 AM
  endpoint: updateLeadScores,
});
