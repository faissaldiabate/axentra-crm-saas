import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { leadsDB } from "./db";
import { LeadSource, LeadStatus, Lead } from "./types";

export interface CreateLeadRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  source?: LeadSource;
}

// Creates a new lead.
export const create = api<CreateLeadRequest, Lead>(
  { auth: true, expose: true, method: "POST", path: "/leads" },
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
      INSERT INTO leads (user_id, name, email, company, phone, source)
      VALUES (${auth.userID}, ${req.name}, ${req.email}, ${req.company || null}, ${req.phone || null}, ${req.source || null})
      RETURNING id, user_id, name, email, company, phone, source, status, score, last_activity, created_at, updated_at
    `;

    if (!lead) {
      throw new Error("Failed to create lead");
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
