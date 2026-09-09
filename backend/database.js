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

// ===============================
// BILLS TABLE
// ===============================

db.prepare(`
  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    billNo TEXT,

    customer TEXT,
    customerName TEXT,
    customerMobile TEXT,
    mobile TEXT,

    items TEXT,

    totalItems REAL DEFAULT 0,
    totalQuantity REAL DEFAULT 0,

    discountPercent REAL DEFAULT 0,
    discountAmount REAL DEFAULT 0,

    subtotal REAL DEFAULT 0,
    billTotal REAL DEFAULT 0,
    total REAL DEFAULT 0,
    totalAmount REAL DEFAULT 0,

    previousAdvance REAL DEFAULT 0,
    advanceAdjusted REAL DEFAULT 0,
    advanceUsed REAL DEFAULT 0,
    billAfterAdvance REAL DEFAULT 0,

    paymentReceived REAL DEFAULT 0,
    receivedAmount REAL DEFAULT 0,
    billPaid REAL DEFAULT 0,
    paidNow REAL DEFAULT 0,
    jama REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    paidAtBill REAL DEFAULT 0,
    receivedAtBill REAL DEFAULT 0,

    bakiUdhari REAL DEFAULT 0,
    pendingAmount REAL DEFAULT 0,
    creditAmount REAL DEFAULT 0,
    credit INTEGER DEFAULT 0,

    advance REAL DEFAULT 0,
    advanceAdded REAL DEFAULT 0,
    advanceBalance REAL DEFAULT 0,
    remainingAdvance REAL DEFAULT 0,

    paymentType TEXT,

    date TEXT,
    billDate TEXT,
    createdAt INTEGER
  )
`).run();

// ===============================
// DATABASE STARTUP LOG
// ===============================

console.log("======================================");
console.log("   SHIVAM MEDICAL DATABASE");
console.log("======================================");
console.log("Database connected successfully");
console.log("Database file:", dbPath);
console.log("Stock table ready");
console.log("Bills table ready");
console.log("======================================");

// ===============================
// EXPORT DATABASE
// ===============================

module.exports = db;