const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "shivam_medical.db");

const db = new Database(dbPath);

// ===============================
// STOCK TABLE
// ===============================

db.prepare(`
  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine TEXT,
    company TEXT,
    batch TEXT,
    barcode TEXT,
    supplier TEXT,
    supplierMobile TEXT,
    quantity REAL DEFAULT 0,
    rate REAL DEFAULT 0,
    mrp REAL DEFAULT 0,
    saleRate REAL DEFAULT 0,
    expiry TEXT,
    gstType TEXT,
    gstPercent REAL DEFAULT 0,
    purchaseRateWithGST REAL DEFAULT 0,
    purchaseAmount REAL DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  )
`).run();

console.log("======================================");
console.log("   SHIVAM MEDICAL DATABASE");
console.log("======================================");
console.log("Database connected successfully");
console.log("Database file:", dbPath);
console.log("======================================");

module.exports = db;