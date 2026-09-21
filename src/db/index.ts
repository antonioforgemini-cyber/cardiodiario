import { createClient, Client } from "@libsql/client";

let client: Client;

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

client = createClient({
  url,
  authToken,
});

export const db = client;
