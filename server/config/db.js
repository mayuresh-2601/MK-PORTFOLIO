import mysql from "mysql2/promise";

import { getPoolConfig } from "./databaseConfig.js";

/* 
   Database Connection Pool
 */

const db = mysql.createPool(getPoolConfig());

/* 
   Verify Database Connection
 */

export const testDatabaseConnection = async () => {
  try {
    const connection = await db.getConnection();

    await connection.ping();

    console.log("✅ MySQL / TiDB database connected successfully.");

    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed.");
    console.error(error.message);

    throw error;
  }
};

export default db;
