import { SQLDatabase } from "encore.dev/storage/sqldb";

export const scoringDB = SQLDatabase.named("leads");
