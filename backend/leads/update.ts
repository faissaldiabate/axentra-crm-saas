import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { leadsDB } from "./db";
import { LeadSource, LeadStatus, Lead } from "./types";

export interface UpdateLeadRequest {
  id: number;
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
}

// Updates an existing lead.
export const update = api<UpdateLeadRequest, Lead>(
  { auth: true, expose: true, method: "PUT", path: "/leads/:id" },
  async (req) => {
    const auth = getAuthData()!;

    const existingLead = await leadsDB.queryRow`
      SELECT id FROM leads WHERE id = ${req.id} AND user_id = ${parseInt(auth.userID)}
    `;

    if (!existingLead) {
      throw APIError.notFound("lead not found");
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(req.name);
      paramIndex++;
    }

    if (req.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(req.email);
      paramIndex++;
    }

    if (req.company !== undefined) {
      updates.push(`company = $${paramIndex}`);
      params.push(req.company);
      paramIndex++;
    }

    if (req.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(req.phone);
      paramIndex++;
    }

    if (req.source !== undefined) {
      updates.push(`source = $${paramIndex}`);
      params.push(req.source);
      paramIndex++;
    }

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(req.status);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`last_activity = NOW()`);

    const query = `
      UPDATE leads 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, user_id, name, email, company, phone, source, status, score, last_activity, created_at, updated_at
    `;
    params.push(req.id, parseInt(auth.userID));

    const lead = await leadsDB.rawQueryRow<{
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
    }>(query, ...params);

    if (!lead) {
      throw APIError.internal("failed to update lead");
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
