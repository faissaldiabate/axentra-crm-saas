import { SQLDatabase } from "encore.dev/storage/sqldb";

export const leadsDB = new SQLDatabase("leads", {
  migrations: "./migrations",
});
