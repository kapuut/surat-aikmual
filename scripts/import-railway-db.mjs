import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import mysql from "mysql2/promise";

const host = process.env.IMPORT_DB_HOST || "switchback.proxy.rlwy.net";
const port = Number(process.env.IMPORT_DB_PORT || 48124);
const user = process.env.IMPORT_DB_USER || "root";
const database = process.env.IMPORT_DB_NAME || "railway";

async function getPassword() {
  if (process.env.IMPORT_DB_PASSWORD) {
    return process.env.IMPORT_DB_PASSWORD;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const value = await rl.question("Masukkan password MySQL Railway: ");
    return value.trim();
  } finally {
    rl.close();
  }
}

async function run() {
  const projectRoot = process.cwd();
  const sqlPath = path.join(projectRoot, "database", "db_surat.sql");

  const password = await getPassword();
  if (!password) {
    throw new Error("Password kosong. Import dibatalkan.");
  }

  const sql = await fs.readFile(sqlPath, "utf8");

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  try {
    console.log(`Menghubungkan ke ${host}:${port}/${database} ...`);
    await connection.query(sql);
    const [rows] = await connection.query("SHOW TABLES");
    console.log("Import selesai.");
    console.log(`Jumlah tabel sekarang: ${Array.isArray(rows) ? rows.length : 0}`);
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("Import gagal:", error.message || error);
  process.exitCode = 1;
});
