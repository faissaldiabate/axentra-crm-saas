import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { scoringDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const leadsDB = SQLDatabase.named("leads");

export interface TrackEngagementRequest {
  leadId: number;
  eventType: "email_open" | "email_click" | "email_reply" | "call_answered" | "meeting_scheduled";
  eventData?: Record<string, any>;
}

// Tracks engagement events for lead scoring.
export const trackEngagement = api<TrackEngagementRequest, void>(
  { auth: true, expose: true, method: "POST", path: "/scoring/track" },
  async (req) => {
    const auth = getAuthData()!;

    // Verify the lead belongs to the authenticated user
    const lead = await leadsDB.queryRow`
      SELECT id FROM leads WHERE id = ${req.leadId} AND user_id = ${parseInt(auth.userID)}
    `;

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Track the engagement event
    await scoringDB.exec`
      INSERT INTO lead_engagement (lead_id, event_type, event_data)
      VALUES (${req.leadId}, ${req.eventType}, ${JSON.stringify(req.eventData || {})})
    `;

    // Update lead's last activity
    await leadsDB.exec`
      UPDATE leads SET last_activity = NOW() WHERE id = ${req.leadId}
    `;
  }
);
