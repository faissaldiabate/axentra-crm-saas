export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type LeadSource = "website" | "referral" | "social" | "email" | "phone" | "event" | "other";

export interface Lead {
  id: number;
  userId: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  source?: LeadSource;
  status: LeadStatus;
  score: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowupLog {
  id: number;
  leadId: number;
  message: string;
  sentAt: Date;
  status: string;
}
