
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const { pool, initDatabase } = require("./database");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// =========================================================
// UPLOAD FOLDER
// =========================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =========================================================
// MULTER
// =========================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const name =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// =========================================================
// HELPER
// =========================================================

function safeNumber(value, defaultValue = 0) {
  const n = Number(value);

  return Number.isFinite(n) ? n : defaultValue;
}

function parseBill(row) {
  if (!row) return null;

  let items = [];

  try {
    items =
      typeof row.items === "string"
        ? JSON.parse(row.items)
        : Array.isArray(row.items)
        ? row.items
        : [];
  } catch (error) {
    items = [];
  }

  return {
    ...row,

    items,

    totalItems: safeNumber(row.totalItems),
    totalQuantity: safeNumber(row.totalQuantity),

    discountPercent: safeNumber(row.discountPercent),
    discountAmount: safeNumber(row.discountAmount),

    subtotal: safeNumber(row.subtotal),
    billTotal: safeNumber(row.billTotal),
    total: safeNumber(row.total),
    totalAmount: safeNumber(row.totalAmount),

    previousAdvance: safeNumber(row.previousAdvance),
    advanceAdjusted: safeNumber(row.advanceAdjusted),
    advanceUsed: safeNumber(row.advanceUsed),
    billAfterAdvance: safeNumber(row.billAfterAdvance),

    paymentReceived: safeNumber(row.paymentReceived),
    receivedAmount: safeNumber(row.receivedAmount),

    billPaid: safeNumber(row.billPaid),
    paidNow: safeNumber(row.paidNow),

    jama: safeNumber(row.jama),
    paid: safeNumber(row.paid),
    paidAmount: safeNumber(row.paidAmount),

    paidAtBill: safeNumber(row.paidAtBill),
    receivedAtBill: safeNumber(row.receivedAtBill),

    bakiUdhari: safeNumber(row.bakiUdhari),
    pendingAmount: safeNumber(row.pendingAmount),
    creditAmount: safeNumber(row.creditAmount),

    credit:
      row.credit === true ||
      row.credit === 1 ||
      row.credit === "1",

    advance: safeNumber(row.advance),
    advanceAdded: safeNumber(row.advanceAdded),
    advanceBalance: safeNumber(row.advanceBalance),
    remainingAdvance: safeNumber(row.remainingAdvance),

    createdAt:
      row.createdAt === null ||
      row.createdAt === undefined
        ? 0
        : safeNumber(row.createdAt),
  };
}

// =========================================================
// HEALTH
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Shivam Medical ERP Backend is running",
  });
});

// =========================================================
// API TEST
// =========================================================

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS test");

    res.json({
      success: true,
      message: "API working successfully",
      database: result.rows[0].test === 1 ? "PostgreSQL Connected" : "Error",
    });
  } catch (error) {
    console.error("API TEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =========================================================
// DATABASE TEST
// =========================================================

app.get("/api/database-test", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    res.json({
      success: true,
      database: "PostgreSQL",
      tables: result.rows,
    });
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message,
    });
  }
});

// =========================================================
// STOCK - GET ALL
// =========================================================

app.get("/api/stock", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM stock
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET STOCK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
      error: error.message,
    });
  }
});

// =========================================================
// STOCK - GET ONE
// =========================================================

app.get("/api/stock/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM stock
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET STOCK BY ID ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stock item",
      error: error.message,
    });
  }
});

// =========================================================
// STOCK - POST
// =========================================================

app.post("/api/stock", async (req, res) => {
  try {
    const item = req.body || {};

    const result = await pool.query(
      `
      INSERT INTO stock (
        medicine,
        company,
        batch,
        barcode,
        supplier,
        "supplierMobile",
        quantity,
        rate,
        mrp,
        "saleRate",
        expiry,
        "gstType",
        "gstPercent",
        "purchaseRateWithGST",
        "purchaseAmount",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
      `,
      [
        item.medicine || "",
        item.company || "",
        item.batch || "",
        item.barcode || "",
        item.supplier || "",
        item.supplierMobile || "",

        safeNumber(item.quantity),
        safeNumber(item.rate),
        safeNumber(item.mrp),
        safeNumber(item.saleRate),

        item.expiry || "",

        item.gstType || "",
        safeNumber(item.gstPercent),
        safeNumber(item.purchaseRateWithGST),
        safeNumber(item.purchaseAmount),

        item.createdAt || new Date().toISOString(),
        item.updatedAt || new Date().toISOString(),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Stock saved successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("POST STOCK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save stock",
      error: error.message,
    });
  }
});

// =========================================================
// STOCK - PUT
// =========================================================

app.put("/api/stock/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = req.body || {};

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const existing = await pool.query(
      `
      SELECT *
      FROM stock
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    const old = existing.rows[0];

    const result = await pool.query(
      `
      UPDATE stock
      SET
        medicine = $1,
        company = $2,
        batch = $3,
        barcode = $4,
        supplier = $5,
        "supplierMobile" = $6,
        quantity = $7,
        rate = $8,
        mrp = $9,
        "saleRate" = $10,
        expiry = $11,
        "gstType" = $12,
        "gstPercent" = $13,
        "purchaseRateWithGST" = $14,
        "purchaseAmount" = $15,
        "createdAt" = $16,
        "updatedAt" = $17
      WHERE id = $18
      RETURNING *
      `,
      [
        item.medicine !== undefined
          ? item.medicine
          : old.medicine,

        item.company !== undefined
          ? item.company
          : old.company,

        item.batch !== undefined
          ? item.batch
          : old.batch,

        item.barcode !== undefined
          ? item.barcode
          : old.barcode,

        item.supplier !== undefined
          ? item.supplier
          : old.supplier,

        item.supplierMobile !== undefined
          ? item.supplierMobile
          : old.supplierMobile,

        item.quantity !== undefined
          ? safeNumber(item.quantity)
          : safeNumber(old.quantity),

        item.rate !== undefined
          ? safeNumber(item.rate)
          : safeNumber(old.rate),

        item.mrp !== undefined
          ? safeNumber(item.mrp)
          : safeNumber(old.mrp),

        item.saleRate !== undefined
          ? safeNumber(item.saleRate)
          : safeNumber(old.saleRate),

        item.expiry !== undefined
          ? item.expiry
          : old.expiry,

        item.gstType !== undefined
          ? item.gstType
          : old.gstType,

        item.gstPercent !== undefined
          ? safeNumber(item.gstPercent)
          : safeNumber(old.gstPercent),

        item.purchaseRateWithGST !== undefined
          ? safeNumber(item.purchaseRateWithGST)
          : safeNumber(old.purchaseRateWithGST),

        item.purchaseAmount !== undefined
          ? safeNumber(item.purchaseAmount)
          : safeNumber(old.purchaseAmount),

        item.createdAt !== undefined
          ? item.createdAt
          : old.createdAt,

        item.updatedAt ||
          new Date().toISOString(),

        id,
      ]
    );

    res.json({
      success: true,
      message: "Stock updated successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("PUT STOCK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
});

// =========================================================
// STOCK - DELETE
// =========================================================

app.delete("/api/stock/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM stock
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    res.json({
      success: true,
      message: "Stock deleted successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE STOCK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete stock",
      error: error.message,
    });
  }
});

// =========================================================
// BILLS - GET ALL
// =========================================================

app.get("/api/bills", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM bills
      ORDER BY "createdAt" DESC
    `);

    const bills = result.rows.map(parseBill);

    res.json(bills);
  } catch (error) {
    console.error("GET BILLS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bills",
      error: error.message,
    });
  }
});

// =========================================================
// BILLS - GET ONE
// =========================================================

app.get("/api/bills/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM bills
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    res.json(parseBill(result.rows[0]));
  } catch (error) {
    console.error("GET BILL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bill",
      error: error.message,
    });
  }
});

// =========================================================
// BILLS - POST
// =========================================================

app.post("/api/bills", async (req, res) => {
  try {
    const bill = req.body || {};

    if (!bill.id) {
      return res.status(400).json({
        success: false,
        message: "Bill ID is required",
      });
    }

    if (!bill.billNo) {
      return res.status(400).json({
        success: false,
        message: "Bill number is required",
      });
    }

    // =====================================================
    // DUPLICATE CHECK
    // =====================================================

    const duplicate = await pool.query(
      `
      SELECT id
      FROM bills
      WHERE id = $1
      `,
      [String(bill.id)]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Bill already exists",
      });
    }

    // =====================================================
    // ITEMS
    // =====================================================

    const items = Array.isArray(bill.items)
      ? bill.items
      : [];

    // =====================================================
    // INSERT BILL
    // =====================================================

    const result = await pool.query(
      `
      INSERT INTO bills (
        id,
        "billNo",

        customer,
        "customerName",
        "customerMobile",
        mobile,

        items,

        "totalItems",
        "totalQuantity",

        "discountPercent",
        "discountAmount",

        subtotal,
        "billTotal",
        total,
        "totalAmount",

        "previousAdvance",
        "advanceAdjusted",
        "advanceUsed",
        "billAfterAdvance",

        "paymentReceived",
        "receivedAmount",

        "billPaid",
        "paidNow",

        jama,
        paid,
        "paidAmount",

        "paidAtBill",
        "receivedAtBill",

        "bakiUdhari",
        "pendingAmount",
        "creditAmount",

        credit,

        advance,
        "advanceAdded",
        "advanceBalance",
        "remainingAdvance",

        "paymentType",

        date,
        "billDate",

        "createdAt"
      )
      VALUES (
        $1, $2,
        $3, $4, $5, $6,
        $7,
        $8, $9,
        $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21,
        $22, $23,
        $24, $25, $26,
        $27, $28,
        $29, $30, $31,
        $32,
        $33, $34, $35, $36,
        $37,
        $38, $39,
        $40
      )
      RETURNING *
      `,
      [
        String(bill.id),
        bill.billNo || "",

        bill.customer || "",
        bill.customerName || "",
        bill.customerMobile || "",
        bill.mobile || "",

        JSON.stringify(items),

        safeNumber(bill.totalItems),
        safeNumber(bill.totalQuantity),

        safeNumber(bill.discountPercent),
        safeNumber(bill.discountAmount),

        safeNumber(bill.subtotal),
        safeNumber(bill.billTotal),
        safeNumber(bill.total),
        safeNumber(bill.totalAmount),

        safeNumber(bill.previousAdvance),
        safeNumber(bill.advanceAdjusted),
        safeNumber(bill.advanceUsed),
        safeNumber(bill.billAfterAdvance),

        safeNumber(bill.paymentReceived),
        safeNumber(bill.receivedAmount),

        safeNumber(bill.billPaid),
        safeNumber(bill.paidNow),

        safeNumber(bill.jama),
        safeNumber(bill.paid),
        safeNumber(bill.paidAmount),

        safeNumber(bill.paidAtBill),
        safeNumber(bill.receivedAtBill),

        safeNumber(bill.bakiUdhari),
        safeNumber(bill.pendingAmount),
        safeNumber(bill.creditAmount),

        bill.credit ? 1 : 0,

        safeNumber(bill.advance),
        safeNumber(bill.advanceAdded),
        safeNumber(bill.advanceBalance),
        safeNumber(bill.remainingAdvance),

        bill.paymentType || "",

        bill.date || "",
        bill.billDate || "",

        bill.createdAt
          ? safeNumber(bill.createdAt)
          : Date.now(),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Bill saved successfully",
      bill: parseBill(result.rows[0]),
    });
  } catch (error) {
    console.error("POST BILL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save bill",
      error: error.message,
    });
  }
});

// =========================================================
// BILLS - DELETE
// =========================================================

app.delete("/api/bills/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM bills
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    res.json({
      success: true,
      message: "Bill deleted successfully",
      bill: parseBill(result.rows[0]),
    });
  } catch (error) {
    console.error("DELETE BILL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete bill",
      error: error.message,
    });
  }
});

// =========================================================
// FILE UPLOAD
// =========================================================

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl =
      `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
});

// =========================================================
// STATIC UPLOADS
// =========================================================

app.use(
  "/uploads",
  express.static(uploadDir)
);

// =========================================================
// 404
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =========================================================
// ERROR HANDLER
// =========================================================

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

// =========================================================
// START SERVER
// =========================================================

async function startServer() {
  try {
    await initDatabase();

    await pool.query("SELECT 1");

    console.log("==========================================");
    console.log("✅ PostgreSQL connection successful");
    console.log("✅ Database initialized");
    console.log("==========================================");

    app.listen(PORT, () => {
      console.log(
        `🚀 Shivam Medical ERP Backend running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("==========================================");
    console.error("❌ SERVER START FAILED");
    console.error(error);
    console.error("==========================================");

    process.exit(1);
  }
}

startServer();