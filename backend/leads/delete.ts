import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { leadsDB } from "./db";

export interface DeleteLeadRequest {
  id: number;
}

// Deletes a lead.
export const deleteLead = api<DeleteLeadRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/leads/:id" },
  async (req) => {
    const auth = getAuthData()!;

    const result = await leadsDB.exec`
      DELETE FROM leads WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;

    // Note: We can't check affected rows with the current Encore.ts API
    // The delete will succeed even if no rows were affected
  }
);
