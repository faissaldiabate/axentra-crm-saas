import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { leadsDB } from "./db";
import { Query } from "encore.dev/api";
import { LeadSource, LeadStatus, Lead } from "./types";

export interface ListLeadsRequest {
  page?: Query<number>;
  limit?: Query<number>;
  status?: Query<LeadStatus>;
  source?: Query<LeadSource>;
  search?: Query<string>;
}

export interface ListLeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

// Lists leads with optional filtering and pagination.
export const list = api<ListLeadsRequest, ListLeadsResponse>(
  { auth: true, expose: true, method: "GET", path: "/leads" },
  async (req) => {
    const auth = getAuthData()!;
    const page = req.page || 1;
    const limit = req.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE user_id = $1";
    let params: any[] = [parseInt(auth.userID)];
    let paramIndex = 2;

    if (req.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(req.status);
      paramIndex++;
    }

    if (req.source) {
      whereClause += ` AND source = $${paramIndex}`;
      params.push(req.source);
      paramIndex++;
    }

    if (req.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company ILIKE $${paramIndex})`;
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as count FROM leads ${whereClause}`;
    const countResult = await leadsDB.rawQueryRow<{ count: number }>(countQuery, ...params);
    const total = countResult?.count || 0;

    const query = `
      SELECT id, user_id, name, email, company, phone, source, status, score, last_activity, created_at, updated_at
      FROM leads ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const leads = await leadsDB.rawQueryAll<{
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

    return {
      leads: leads.map(lead => ({
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
      })),
      total,
      page,
      limit,
    };
  }
);
