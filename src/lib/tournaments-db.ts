import mysql from "mysql2/promise";
import { Tournament } from "./tournament";

const DATABASE_URL = process.env.DATABASE_URL || "";

export async function getTournamentsFromDB(): Promise<Tournament[]> {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const [rows] = await connection.execute("SELECT id, data FROM tournament ORDER BY created_at DESC");
    return (rows as { id: string; data: string }[]).map(row =>
      typeof row.data === "string" ? JSON.parse(row.data) : row.data
    );
  } catch (err) {
    console.error("[TOURNAMENTS DB]", err);
    return [];
  } finally {
    await connection?.end();
  }
}
