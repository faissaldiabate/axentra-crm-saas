import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { leadsDB } from "./db";
import { LeadSource, LeadStatus, Lead } from "./types";

export interface GetLeadRequest {
  id: number;
}

// Retrieves a specific lead by ID.
export const get = api<GetLeadRequest, Lead>(
  { auth: true, expose: true, method: "GET", path: "/leads/:id" },
  async (req) => {
    const auth = getAuthData()!;

    const lead = await leadsDB.queryRow<{
      id: number;
      user_id: number;
      name: string;
      email: string;
      company: string | null;
      phone: string | null;
      source: string | null;
      status: string;
      score: number;
      last_activity: Date;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, user_id, name, email, company, phone, source, status, score, last_activity, created_at, updated_at
      FROM leads WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;

    if (!lead) {
      throw APIError.notFound("lead not found");
    }

    return {
      id: lead.id,
      userId: lead.user_id,
      name: lead.name,
      email: lead.email,
      company: lead.company || undefined,
      phone: lead.phone || undefined,
      source: lead.source as LeadSource,
      status: lead.status as LeadStatus,
      score: lead.score,
      lastActivity: lead.last_activity,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    };
  }
);
