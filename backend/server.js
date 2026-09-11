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
// HELPERS
// =========================================================

function safeNumber(value, defaultValue = 0) {
  const n = Number(value);

  return Number.isFinite(n) ? n : defaultValue;
}

// =========================================================
// TEXT HELPER
// =========================================================

function safeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

// =========================================================
// CUSTOMER NAME HELPER
// =========================================================

function getCustomerNameFromBill(bill) {
  if (!bill || typeof bill !== "object") {
    return "";
  }

  const directFields = [
    bill.customerName,
    bill.customer_name,
    bill.customername,
    bill.partyName,
    bill.party_name,
    bill.clientName,
    bill.client_name,
    bill.name,
  ];

  for (const value of directFields) {
    const text = safeText(value);

    if (text) {
      return text;
    }
  }

  // customer can sometimes be a simple string
  if (typeof bill.customer === "string") {
    const text = bill.customer.trim();

    if (text) {
      return text;
    }
  }

  // customer can sometimes be an object
  if (
    bill.customer &&
    typeof bill.customer === "object"
  ) {
    const nestedFields = [
      bill.customer.name,
      bill.customer.customerName,
      bill.customer.customer_name,
      bill.customer.partyName,
      bill.customer.clientName,
    ];

    for (const value of nestedFields) {
      const text = safeText(value);

      if (text) {
        return text;
      }
    }
  }

  // customerDetails support
  if (
    bill.customerDetails &&
    typeof bill.customerDetails === "object"
  ) {
    const nestedFields = [
      bill.customerDetails.name,
      bill.customerDetails.customerName,
      bill.customerDetails.customer_name,
      bill.customerDetails.partyName,
    ];

    for (const value of nestedFields) {
      const text = safeText(value);

      if (text) {
        return text;
      }
    }
  }

  return "";
}

// =========================================================
// CUSTOMER MOBILE HELPER
// =========================================================

function getCustomerMobileFromBill(bill) {
  if (!bill || typeof bill !== "object") {
    return "";
  }

  const directFields = [
    bill.customerMobile,
    bill.customer_mobile,
    bill.customerPhone,
    bill.customer_phone,
    bill.mobile,
    bill.phone,
    bill.partyMobile,
    bill.party_mobile,
    bill.partyPhone,
    bill.clientMobile,
    bill.client_mobile,
  ];

  for (const value of directFields) {
    const text = safeText(value);

    if (text) {
      return text;
    }
  }

  // customer object
  if (
    bill.customer &&
    typeof bill.customer === "object"
  ) {
    const nestedFields = [
      bill.customer.mobile,
      bill.customer.phone,
      bill.customer.customerMobile,
      bill.customer.customerPhone,
    ];

    for (const value of nestedFields) {
      const text = safeText(value);

      if (text) {
        return text;
      }
    }
  }

  // customerDetails support
  if (
    bill.customerDetails &&
    typeof bill.customerDetails === "object"
  ) {
    const nestedFields = [
      bill.customerDetails.mobile,
      bill.customerDetails.phone,
      bill.customerDetails.customerMobile,
      bill.customerDetails.customerPhone,
    ];

    for (const value of nestedFields) {
      const text = safeText(value);

      if (text) {
        return text;
      }
    }
  }

  return "";
}

// =========================================================
// BILL PARSER
// =========================================================

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

  const customerName =
    safeText(row.customerName) ||
    safeText(row.customer) ||
    "";

  const customerMobile =
    safeText(row.customerMobile) ||
    safeText(row.mobile) ||
    "";

  return {
    ...row,

    customer: customerName,
    customerName: customerName,
    customerMobile: customerMobile,
    mobile: customerMobile,

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

    date:
      row.date || row.billDate || "",

    billDate:
      row.billDate || row.date || "",
  };
}

// =========================================================
// CUSTOMER PAYMENTS TABLE
// =========================================================

async function initCustomerPaymentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_payments (
      id TEXT PRIMARY KEY,

      customer TEXT,
      "customerName" TEXT,
      name TEXT,

      mobile TEXT,
      phone TEXT,
      "customerMobile" TEXT,

      amount NUMERIC DEFAULT 0,
      "paidAmount" NUMERIC DEFAULT 0,
      payment NUMERIC DEFAULT 0,

      mode TEXT,
      "paymentMode" TEXT,

      note TEXT,

      date TEXT,
      time TEXT,

      "adjustedToUdhari" NUMERIC DEFAULT 0,
      "isAdvance" BOOLEAN DEFAULT FALSE,
      "advanceAmount" NUMERIC DEFAULT 0,
      "adjustedToAdvance" NUMERIC DEFAULT 0,

      allocations JSONB DEFAULT '[]'::jsonb,

      "createdAt" TEXT
    )
  `);

  console.log(
    "✅ CUSTOMER PAYMENTS table ready"
  );
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
    const result = await pool.query(
      "SELECT 1 AS test"
    );

    res.json({
      success: true,
      message: "API working successfully",
      database:
        result.rows[0].test === 1
          ? "PostgreSQL Connected"
          : "Error",
    });
  } catch (error) {
    console.error(
      "API TEST ERROR:",
      error
    );

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

app.get(
  "/api/database-test",
  async (req, res) => {
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
      console.error(
        "DATABASE TEST ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Database test failed",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STOCK - GET ALL
// =========================================================

app.get(
  "/api/stock",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM stock
        ORDER BY id DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "GET STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch stock",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STOCK - GET ONE
// =========================================================

app.get(
  "/api/stock/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

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

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Stock item not found",
        });
      }

      res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "GET STOCK BY ID ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch stock item",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STOCK - POST
// =========================================================

app.post(
  "/api/stock",
  async (req, res) => {
    try {
      const item = req.body || {};

      const result =
        await pool.query(
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
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17
          )
          RETURNING *
          `,
          [
            safeText(
              item.medicine
            ),
            safeText(
              item.company
            ),
            safeText(
              item.batch
            ),
            safeText(
              item.barcode
            ),
            safeText(
              item.supplier
            ),
            safeText(
              item.supplierMobile
            ),

            safeNumber(
              item.quantity
            ),
            safeNumber(
              item.rate
            ),
            safeNumber(
              item.mrp
            ),
            safeNumber(
              item.saleRate
            ),

            safeText(
              item.expiry
            ),

            safeText(
              item.gstType
            ),
            safeNumber(
              item.gstPercent
            ),
            safeNumber(
              item.purchaseRateWithGST
            ),
            safeNumber(
              item.purchaseAmount
            ),

            item.createdAt ||
              new Date().toISOString(),

            item.updatedAt ||
              new Date().toISOString(),
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Stock saved successfully",
        item:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "POST STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save stock",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STOCK - PUT
// =========================================================

app.put(
  "/api/stock/:id",
  async (req, res) => {
    try {
      console.log(
        "=========================================="
      );

      console.log(
        "🔥 STOCK PUT HIT"
      );

      console.log(
        "Stock ID:",
        req.params.id
      );

      console.log(
        "Request Body:",
        req.body
      );

      console.log(
        "=========================================="
      );

      const id = Number(
        req.params.id
      );

      const item =
        req.body || {};

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid stock ID",
        });
      }

      const existing =
        await pool.query(
          `
          SELECT *
          FROM stock
          WHERE id = $1
          `,
          [id]
        );

      if (
        existing.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Stock item not found",
        });
      }

      const old =
        existing.rows[0];

      const newQuantity =
        item.quantity !== undefined
          ? safeNumber(
              item.quantity
            )
          : safeNumber(
              old.quantity
            );

      console.log(
        "📦 OLD STOCK:",
        {
          id: old.id,
          medicine:
            old.medicine,
          quantity:
            old.quantity,
        }
      );

      console.log(
        "📉 OLD QUANTITY:",
        old.quantity
      );

      console.log(
        "📉 NEW QUANTITY:",
        newQuantity
      );

      const result =
        await pool.query(
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
            item.medicine !==
            undefined
              ? safeText(
                  item.medicine
                )
              : old.medicine,

            item.company !==
            undefined
              ? safeText(
                  item.company
                )
              : old.company,

            item.batch !==
            undefined
              ? safeText(
                  item.batch
                )
              : old.batch,

            item.barcode !==
            undefined
              ? safeText(
                  item.barcode
                )
              : old.barcode,

            item.supplier !==
            undefined
              ? safeText(
                  item.supplier
                )
              : old.supplier,

            item.supplierMobile !==
            undefined
              ? safeText(
                  item.supplierMobile
                )
              : old.supplierMobile,

            newQuantity,

            item.rate !==
            undefined
              ? safeNumber(
                  item.rate
                )
              : safeNumber(
                  old.rate
                ),

            item.mrp !==
            undefined
              ? safeNumber(
                  item.mrp
                )
              : safeNumber(
                  old.mrp
                ),

            item.saleRate !==
            undefined
              ? safeNumber(
                  item.saleRate
                )
              : safeNumber(
                  old.saleRate
                ),

            item.expiry !==
            undefined
              ? safeText(
                  item.expiry
                )
              : old.expiry,

            item.gstType !==
            undefined
              ? safeText(
                  item.gstType
                )
              : old.gstType,

            item.gstPercent !==
            undefined
              ? safeNumber(
                  item.gstPercent
                )
              : safeNumber(
                  old.gstPercent
                ),

            item.purchaseRateWithGST !==
            undefined
              ? safeNumber(
                  item.purchaseRateWithGST
                )
              : safeNumber(
                  old.purchaseRateWithGST
                ),

            item.purchaseAmount !==
            undefined
              ? safeNumber(
                  item.purchaseAmount
                )
              : safeNumber(
                  old.purchaseAmount
                ),

            item.createdAt !==
            undefined
              ? item.createdAt
              : old.createdAt,

            item.updatedAt ||
              new Date().toISOString(),

            id,
          ]
        );

      const updated =
        result.rows[0];

      console.log(
        "=========================================="
      );

      console.log(
        "✅ STOCK UPDATE SUCCESS"
      );

      console.log(
        "Stock ID:",
        updated.id
      );

      console.log(
        "Medicine:",
        updated.medicine
      );

      console.log(
        "OLD QUANTITY:",
        old.quantity
      );

      console.log(
        "NEW QUANTITY:",
        updated.quantity
      );

      console.log(
        "=========================================="
      );

      res.json({
        success: true,
        message:
          "Stock updated successfully",
        item: updated,
      });
    } catch (error) {
      console.error(
        "❌ PUT STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update stock",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STOCK - DELETE
// =========================================================

app.delete(
  "/api/stock/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid stock ID",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM stock
          WHERE id = $1
          RETURNING *
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Stock item not found",
        });
      }

      res.json({
        success: true,
        message:
          "Stock deleted successfully",
        item:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "DELETE STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete stock",
        error: error.message,
      });
    }
  }
);

// =========================================================
// CUSTOMER PAYMENTS - GET ALL
// =========================================================

app.get(
  "/api/customer-payments",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT *
          FROM customer_payments
          ORDER BY "createdAt" DESC
        `);

      const payments =
        result.rows.map(
          (row) => ({
            ...row,

            amount: Number(
              row.amount || 0
            ),

            paidAmount: Number(
              row.paidAmount || 0
            ),

            payment: Number(
              row.payment || 0
            ),

            adjustedToUdhari:
              Number(
                row.adjustedToUdhari ||
                  0
              ),

            advanceAmount:
              Number(
                row.advanceAmount ||
                  0
              ),

            adjustedToAdvance:
              Number(
                row.adjustedToAdvance ||
                  0
              ),

            isAdvance:
              Boolean(
                row.isAdvance
              ),

            allocations:
              Array.isArray(
                row.allocations
              )
                ? row.allocations
                : [],
          })
        );

      console.log(
        "=========================================="
      );

      console.log(
        "💰 GET /api/customer-payments"
      );

      console.log(
        "TOTAL CUSTOMER PAYMENTS:",
        payments.length
      );

      console.log(
        "=========================================="
      );

      res.json({
        success: true,
        count:
          payments.length,
        payments,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER PAYMENTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer payments",
        error: error.message,
      });
    }
  }
);

// =========================================================
// CUSTOMER PAYMENTS - POST
// =========================================================

app.post(
  "/api/customer-payments",
  async (req, res) => {
    try {
      const payment =
        req.body || {};

      console.log(
        "=========================================="
      );

      console.log(
        "🔥 CUSTOMER PAYMENT POST HIT"
      );

      console.log(
        "Payment ID:",
        payment.id
      );

      console.log(
        "Customer:",
        payment.customer ||
          payment.customerName ||
          payment.name
      );

      console.log(
        "Amount:",
        payment.amount ||
          payment.paidAmount ||
          payment.payment
      );

      console.log(
        "=========================================="
      );

      const id =
        safeText(
          payment.id
        );

      const customer =
        safeText(
          payment.customer ||
            payment.customerName ||
            payment.name
        );

      const amount =
        safeNumber(
          payment.amount ??
            payment.paidAmount ??
            payment.payment
        );

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Payment id is required",
        });
      }

      if (!customer) {
        return res.status(400).json({
          success: false,
          message:
            "Customer name is required",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount must be greater than 0",
        });
      }

      const result =
        await pool.query(
          `
          INSERT INTO customer_payments (
            id,
            customer,
            "customerName",
            name,

            mobile,
            phone,
            "customerMobile",

            amount,
            "paidAmount",
            payment,

            mode,
            "paymentMode",

            note,

            date,
            time,

            "adjustedToUdhari",
            "isAdvance",
            "advanceAmount",
            "adjustedToAdvance",

            allocations,

            "createdAt"
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,

            $5,
            $6,
            $7,

            $8,
            $9,
            $10,

            $11,
            $12,

            $13,

            $14,
            $15,

            $16,
            $17,
            $18,
            $19,

            $20,

            $21
          )

          ON CONFLICT (id)
          DO UPDATE SET

            customer =
              EXCLUDED.customer,

            "customerName" =
              EXCLUDED."customerName",

            name =
              EXCLUDED.name,

            mobile =
              EXCLUDED.mobile,

            phone =
              EXCLUDED.phone,

            "customerMobile" =
              EXCLUDED."customerMobile",

            amount =
              EXCLUDED.amount,

            "paidAmount" =
              EXCLUDED."paidAmount",

            payment =
              EXCLUDED.payment,

            mode =
              EXCLUDED.mode,

            "paymentMode" =
              EXCLUDED."paymentMode",

            note =
              EXCLUDED.note,

            date =
              EXCLUDED.date,

            time =
              EXCLUDED.time,

            "adjustedToUdhari" =
              EXCLUDED."adjustedToUdhari",

            "isAdvance" =
              EXCLUDED."isAdvance",

            "advanceAmount" =
              EXCLUDED."advanceAmount",

            "adjustedToAdvance" =
              EXCLUDED."adjustedToAdvance",

            allocations =
              EXCLUDED.allocations,

            "createdAt" =
              EXCLUDED."createdAt"

          RETURNING *
          `,
          [
            // 1
            id,

            // 2-4 CUSTOMER
            customer,

            safeText(
              payment.customerName ||
                customer
            ),

            safeText(
              payment.name ||
                customer
            ),

            // 5-7 MOBILE
            safeText(
              payment.mobile
            ),

            safeText(
              payment.phone
            ),

            safeText(
              payment.customerMobile
            ),

            // 8-10 AMOUNT
            safeNumber(
              payment.amount
            ),

            safeNumber(
              payment.paidAmount
            ),

            safeNumber(
              payment.payment
            ),

            // 11-12 MODE
            safeText(
              payment.mode
            ),

            safeText(
              payment.paymentMode
            ),

            // 13 NOTE
            safeText(
              payment.note
            ),

            // 14-15 DATE/TIME
            safeText(
              payment.date
            ),

            safeText(
              payment.time
            ),

            // 16-19 PAYMENT BREAKUP
            safeNumber(
              payment.adjustedToUdhari
            ),

            Boolean(
              payment.isAdvance
            ),

            safeNumber(
              payment.advanceAmount
            ),

            safeNumber(
              payment.adjustedToAdvance
            ),

            // 20 ALLOCATIONS
            JSON.stringify(
              Array.isArray(
                payment.allocations
              )
                ? payment.allocations
                : []
            ),

            // 21 CREATED AT
            safeText(
              payment.createdAt
            ) ||
              new Date().toISOString(),
          ]
        );

      const row =
        result.rows[0];

      const savedPayment = {
        ...row,

        amount: Number(
          row.amount || 0
        ),

        paidAmount: Number(
          row.paidAmount || 0
        ),

        payment: Number(
          row.payment || 0
        ),

        adjustedToUdhari:
          Number(
            row.adjustedToUdhari ||
              0
          ),

        advanceAmount:
          Number(
            row.advanceAmount ||
              0
          ),

        adjustedToAdvance:
          Number(
            row.adjustedToAdvance ||
              0
          ),

        isAdvance:
          Boolean(
            row.isAdvance
          ),

        allocations:
          Array.isArray(
            row.allocations
          )
            ? row.allocations
            : [],
      };

      console.log(
        "=========================================="
      );

      console.log(
        "✅ CUSTOMER PAYMENT SAVED ONLINE"
      );

      console.log(
        "Payment ID:",
        savedPayment.id
      );

      console.log(
        "Customer:",
        savedPayment.customer
      );

      console.log(
        "Amount:",
        savedPayment.amount
      );

      console.log(
        "Udhari Adjust:",
        savedPayment.adjustedToUdhari
      );

      console.log(
        "Advance:",
        savedPayment.advanceAmount
      );

      console.log(
        "=========================================="
      );

      res.status(201).json({
        success: true,
        message:
          "Customer payment saved successfully",
        payment:
          savedPayment,
      });
    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "❌ POST CUSTOMER PAYMENT ERROR"
      );

      console.error(
        error
      );

      console.error(
        "=========================================="
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save customer payment",
        error: error.message,
      });
    }
  }
);

// =========================================================
// CUSTOMER PAYMENTS - DELETE
// =========================================================

app.delete(
  "/api/customer-payments/:id",
  async (req, res) => {
    try {
      const id =
        safeText(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Payment ID is required",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM customer_payments
          WHERE id = $1
          RETURNING id
          `,
          [id]
        );

      res.json({
        success: true,
        deleted:
          result.rowCount > 0,
        id,
      });
    } catch (error) {
      console.error(
        "DELETE CUSTOMER PAYMENT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete customer payment",
        error: error.message,
      });
    }
  }
);

// =========================================================
// BILLS - GET ALL
// =========================================================

app.get(
  "/api/bills",
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT *
          FROM bills
          ORDER BY "createdAt" DESC
        `);

      const bills =
        result.rows.map(
          parseBill
        );

      console.log(
        "=========================================="
      );

      console.log(
        "🧾 GET /api/bills"
      );

      console.log(
        "TOTAL BILLS:",
        bills.length
      );

      if (
        bills.length > 0
      ) {
        console.log(
          "LATEST BILL CUSTOMER:",
          bills[0].customer
        );

        console.log(
          "LATEST BILL MOBILE:",
          bills[0].customerMobile
        );

        console.log(
          "LATEST BILL NO:",
          bills[0].billNo
        );
      }

      console.log(
        "=========================================="
      );

      res.json(
        bills
      );
    } catch (error) {
      console.error(
        "GET BILLS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch bills",
        error: error.message,
      });
    }
  }
);

// =========================================================
// BILLS - GET ONE
// =========================================================

app.get(
  "/api/bills/:id",
  async (req, res) => {
    try {
      const id =
        req.params.id;

      const result =
        await pool.query(
          `
          SELECT *
          FROM bills
          WHERE id = $1
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Bill not found",
        });
      }

      res.json(
        parseBill(
          result.rows[0]
        )
      );
    } catch (error) {
      console.error(
        "GET BILL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch bill",
        error: error.message,
      });
    }
  }
);

// =========================================================
// BILLS - POST
// =========================================================

app.post(
  "/api/bills",
  async (req, res) => {
    try {
      const bill =
        req.body || {};

      console.log(
        "=========================================="
      );

      console.log(
        "🔥 BILL POST HIT"
      );

      console.log(
        "Bill ID:",
        bill.id
      );

      console.log(
        "Bill No:",
        bill.billNo
      );

      console.log(
        "Raw Customer:",
        bill.customer
      );

      console.log(
        "Raw Customer Name:",
        bill.customerName
      );

      console.log(
        "Raw Customer Mobile:",
        bill.customerMobile
      );

      console.log(
        "=========================================="
      );

      if (!bill.id) {
        return res.status(400).json({
          success: false,
          message:
            "Bill ID is required",
        });
      }

      if (!bill.billNo) {
        return res.status(400).json({
          success: false,
          message:
            "Bill number is required",
        });
      }

      // =====================================================
      // CUSTOMER NORMALIZATION
      // =====================================================

      const customerName =
        getCustomerNameFromBill(
          bill
        );

      const customerMobile =
        getCustomerMobileFromBill(
          bill
        );

      console.log(
        "✅ FINAL CUSTOMER NAME:",
        customerName
      );

      console.log(
        "✅ FINAL CUSTOMER MOBILE:",
        customerMobile
      );

      // =====================================================
      // DUPLICATE CHECK
      // =====================================================

      const duplicate =
        await pool.query(
          `
          SELECT id
          FROM bills
          WHERE id = $1
          `,
          [
            String(
              bill.id
            ),
          ]
        );

      if (
        duplicate.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Bill already exists",
        });
      }

      // =====================================================
      // ITEMS
      // =====================================================

      const items =
        Array.isArray(
          bill.items
        )
          ? bill.items
          : [];

      // =====================================================
      // INSERT BILL
      // =====================================================

      const result =
        await pool.query(
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
            // 1-2
            String(
              bill.id
            ),

            safeText(
              bill.billNo
            ),

            // 3-6 CUSTOMER
            customerName,
            customerName,
            customerMobile,
            customerMobile,

            // 7 ITEMS
            JSON.stringify(
              items
            ),

            // 8-9
            safeNumber(
              bill.totalItems
            ),

            safeNumber(
              bill.totalQuantity
            ),

            // 10-11
            safeNumber(
              bill.discountPercent
            ),

            safeNumber(
              bill.discountAmount
            ),

            // 12-15
            safeNumber(
              bill.subtotal
            ),

            safeNumber(
              bill.billTotal
            ),

            safeNumber(
              bill.total
            ),

            safeNumber(
              bill.totalAmount
            ),

            // 16-19
            safeNumber(
              bill.previousAdvance
            ),

            safeNumber(
              bill.advanceAdjusted
            ),

            safeNumber(
              bill.advanceUsed
            ),

            safeNumber(
              bill.billAfterAdvance
            ),

            // 20-21
            safeNumber(
              bill.paymentReceived
            ),

            safeNumber(
              bill.receivedAmount
            ),

            // 22-23
            safeNumber(
              bill.billPaid
            ),

            safeNumber(
              bill.paidNow
            ),

            // 24-26
            safeNumber(
              bill.jama
            ),

            safeNumber(
              bill.paid
            ),

            safeNumber(
              bill.paidAmount
            ),

            // 27-28
            safeNumber(
              bill.paidAtBill
            ),

            safeNumber(
              bill.receivedAtBill
            ),

            // 29-31
            safeNumber(
              bill.bakiUdhari
            ),

            safeNumber(
              bill.pendingAmount
            ),

            safeNumber(
              bill.creditAmount
            ),

            // 32
            bill.credit
              ? 1
              : 0,

            // 33-36
            safeNumber(
              bill.advance
            ),

            safeNumber(
              bill.advanceAdded
            ),

            safeNumber(
              bill.advanceBalance
            ),

            safeNumber(
              bill.remainingAdvance
            ),

            // 37
            safeText(
              bill.paymentType
            ),

            // 38-39
            safeText(
              bill.date
            ),

            safeText(
              bill.billDate
            ),

            // 40
            bill.createdAt
              ? safeNumber(
                  bill.createdAt
                )
              : Date.now(),
          ]
        );

      const savedBill =
        parseBill(
          result.rows[0]
        );

      console.log(
        "=========================================="
      );

      console.log(
        "✅ BILL SAVED SUCCESSFULLY"
      );

      console.log(
        "Bill ID:",
        savedBill.id
      );

      console.log(
        "Bill No:",
        savedBill.billNo
      );

      console.log(
        "Customer:",
        savedBill.customer
      );

      console.log(
        "Customer Mobile:",
        savedBill.customerMobile
      );

      console.log(
        "Total:",
        savedBill.total
      );

      console.log(
        "=========================================="
      );

      res.status(201).json({
        success: true,
        message:
          "Bill saved successfully",
        bill:
          savedBill,
      });
    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "❌ POST BILL ERROR"
      );

      console.error(
        error
      );

      console.error(
        "=========================================="
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save bill",
        error: error.message,
      });
    }
  }
);

// =========================================================
// BILLS - DELETE
// =========================================================

app.delete(
  "/api/bills/:id",
  async (req, res) => {
    try {
      const id =
        req.params.id;

      const result =
        await pool.query(
          `
          DELETE FROM bills
          WHERE id = $1
          RETURNING *
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Bill not found",
        });
      }

      res.json({
        success: true,
        message:
          "Bill deleted successfully",
        bill:
          parseBill(
            result.rows[0]
          ),
      });
    } catch (error) {
      console.error(
        "DELETE BILLS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete bill",
        error: error.message,
      });
    }
  }
);

// =========================================================
// FILE UPLOAD
// =========================================================

app.post(
  "/api/upload",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No file uploaded",
        });
      }

      const fileUrl =
        `/uploads/${req.file.filename}`;

      res.json({
        success: true,
        message:
          "File uploaded successfully",
        file: {
          originalName:
            req.file.originalname,

          filename:
            req.file.filename,

          size:
            req.file.size,

          url:
            fileUrl,
        },
      });
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "File upload failed",
        error: error.message,
      });
    }
  }
);

// =========================================================
// STATIC UPLOADS
// =========================================================

app.use(
  "/uploads",
  express.static(
    uploadDir
  )
);

// =========================================================
// 404
// =========================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found",
      path:
        req.originalUrl,
    });
  }
);

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error:
        error.message,
    });
  }
);

// =========================================================
// START SERVER
// =========================================================

async function startServer() {
  try {
    await initDatabase();

    // =====================================================
    // CUSTOMER PAYMENTS TABLE
    // =====================================================

    await initCustomerPaymentsTable();

    await pool.query(
      "SELECT 1"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "✅ PostgreSQL connection successful"
    );

    console.log(
      "✅ Database initialized"
    );

    console.log(
      "=========================================="
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `🚀 Shivam Medical ERP Backend running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "❌ SERVER START FAILED"
    );

    console.error(
      error
    );

    console.error(
      "=========================================="
    );

    process.exit(1);
  }
}

startServer();