import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";
import { authDB } from "./db";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const decoded = jwt.verify(token, jwtSecret()) as { userId: number; email: string };
      
      // Verify user still exists in database
      const user = await authDB.queryRow<{ id: number; email: string }>`
        SELECT id, email FROM users WHERE id = ${decoded.userId}
      `;

      if (!user) {
        throw APIError.unauthenticated("user not found");
      }

      return {
        userID: user.id.toString(),
        email: user.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
