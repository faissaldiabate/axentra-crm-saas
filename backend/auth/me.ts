import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { authDB } from "./db";

export interface UserInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
}

// Returns the current user's information.
export const me = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/auth/me" },
  async () => {
    const auth = getAuthData()!;
    
    const user = await authDB.queryRow<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      company: string | null;
    }>`
      SELECT id, email, first_name, last_name, company
      FROM users WHERE id = ${parseInt(auth.userID)}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      company: user.company || undefined,
    };
  }
);
