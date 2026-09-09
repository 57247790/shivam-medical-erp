const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===============================
// DATABASE
// ===============================

const db = require("./database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// UPLOAD FOLDER
// ===============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ===============================
// MULTER
// ===============================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(
      file.originalname
    );

    const name =
      path
        .basename(
          file.originalname,
          ext
        )
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "_"
        ) +
      "-" +
      Date.now() +
      ext;

    cb(null, name);
  },
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Shivam Medical ERP Backend is running",
    status: "OK",
  });
});

// =====================================================
// API TEST
// =====================================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message:
      "API working successfully",
  });
});

// =====================================================
// DATABASE TEST
// =====================================================

app.get(
  "/api/database-test",
  (req, res) => {
    try {
      const result = db
        .prepare(
          `
          SELECT name
          FROM sqlite_master
          WHERE type='table'
          `
        )
        .all();

      res.json({
        success: true,
        message:
          "Database working successfully",
        tables: result,
      });
    } catch (error) {
      console.error(
        "Database test error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Database connection failed",
        error: error.message,
      });
    }
  }
);

// =====================================================
// STOCK API
// =====================================================

// -----------------------------------------------------
// GET ALL STOCK
// GET /api/stock
// -----------------------------------------------------

app.get("/api/stock", (req, res) => {
  try {
    const stock = db
      .prepare(
        `
        SELECT *
        FROM stock
        ORDER BY id DESC
        `
      )
      .all();

    res.json({
      success: true,
      count: stock.length,
      stock: stock,
    });
  } catch (error) {
    console.error(
      "GET STOCK ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Stock load failed",
      error: error.message,
    });
  }
});

// -----------------------------------------------------
// GET SINGLE STOCK ITEM
// GET /api/stock/:id
// -----------------------------------------------------

app.get(
  "/api/stock/:id",
  (req, res) => {
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

      const item = db
        .prepare(
          `
          SELECT *
          FROM stock
          WHERE id = ?
          `
        )
        .get(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            "Stock item not found",
        });
      }

      res.json({
        success: true,
        stock: item,
      });
    } catch (error) {
      console.error(
        "GET SINGLE STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Stock item load failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// ADD STOCK
// POST /api/stock
// -----------------------------------------------------

app.post(
  "/api/stock",
  (req, res) => {
    try {
      const {
        medicine,
        company,
        batch,
        barcode,
        supplier,
        supplierMobile,
        quantity,
        rate,
        mrp,
        saleRate,
        expiry,
        gstType,
        gstPercent,
        purchaseRateWithGST,
        purchaseAmount,
      } = req.body;

      if (
        !medicine ||
        String(medicine).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Medicine name is required",
        });
      }

      const now =
        new Date().toISOString();

      const result = db
        .prepare(
          `
          INSERT INTO stock (
            medicine,
            company,
            batch,
            barcode,
            supplier,
            supplierMobile,
            quantity,
            rate,
            mrp,
            saleRate,
            expiry,
            gstType,
            gstPercent,
            purchaseRateWithGST,
            purchaseAmount,
            createdAt,
            updatedAt
          )

          VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
          )
          `
        )
        .run(
          String(
            medicine || ""
          ).trim(),

          String(
            company || ""
          ).trim(),

          String(
            batch || ""
          ).trim(),

          String(
            barcode || ""
          ).trim(),

          String(
            supplier || ""
          ).trim(),

          String(
            supplierMobile || ""
          ).trim(),

          Number(quantity) || 0,
          Number(rate) || 0,
          Number(mrp) || 0,
          Number(saleRate) || 0,

          String(
            expiry || ""
          ).trim(),

          String(
            gstType || ""
          ).trim(),

          Number(gstPercent) || 0,

          Number(
            purchaseRateWithGST
          ) || 0,

          Number(
            purchaseAmount
          ) || 0,

          now,
          now
        );

      const newItem = db
        .prepare(
          `
          SELECT *
          FROM stock
          WHERE id = ?
          `
        )
        .get(
          result.lastInsertRowid
        );

      res.status(201).json({
        success: true,
        message:
          "Stock saved successfully",
        stock: newItem,
      });
    } catch (error) {
      console.error(
        "ADD STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Stock save failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// UPDATE STOCK
// PUT /api/stock/:id
// -----------------------------------------------------

app.put(
  "/api/stock/:id",
  (req, res) => {
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

      const existing = db
        .prepare(
          `
          SELECT *
          FROM stock
          WHERE id = ?
          `
        )
        .get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Stock item not found",
        });
      }

      const {
        medicine,
        company,
        batch,
        barcode,
        supplier,
        supplierMobile,
        quantity,
        rate,
        mrp,
        saleRate,
        expiry,
        gstType,
        gstPercent,
        purchaseRateWithGST,
        purchaseAmount,
      } = req.body;

      const now =
        new Date().toISOString();

      db.prepare(
        `
        UPDATE stock
        SET
          medicine = ?,
          company = ?,
          batch = ?,
          barcode = ?,
          supplier = ?,
          supplierMobile = ?,
          quantity = ?,
          rate = ?,
          mrp = ?,
          saleRate = ?,
          expiry = ?,
          gstType = ?,
          gstPercent = ?,
          purchaseRateWithGST = ?,
          purchaseAmount = ?,
          updatedAt = ?

        WHERE id = ?
        `
      ).run(
        medicine !== undefined
          ? String(
              medicine
            ).trim()
          : existing.medicine,

        company !== undefined
          ? String(
              company
            ).trim()
          : existing.company,

        batch !== undefined
          ? String(
              batch
            ).trim()
          : existing.batch,

        barcode !== undefined
          ? String(
              barcode
            ).trim()
          : existing.barcode,

        supplier !== undefined
          ? String(
              supplier
            ).trim()
          : existing.supplier,

        supplierMobile !== undefined
          ? String(
              supplierMobile
            ).trim()
          : existing.supplierMobile,

        quantity !== undefined
          ? Number(quantity) || 0
          : existing.quantity,

        rate !== undefined
          ? Number(rate) || 0
          : existing.rate,

        mrp !== undefined
          ? Number(mrp) || 0
          : existing.mrp,

        saleRate !== undefined
          ? Number(saleRate) || 0
          : existing.saleRate,

        expiry !== undefined
          ? String(
              expiry
            ).trim()
          : existing.expiry,

        gstType !== undefined
          ? String(
              gstType
            ).trim()
          : existing.gstType,

        gstPercent !== undefined
          ? Number(
              gstPercent
            ) || 0
          : existing.gstPercent,

        purchaseRateWithGST !==
        undefined
          ? Number(
              purchaseRateWithGST
            ) || 0
          : existing.purchaseRateWithGST,

        purchaseAmount !==
        undefined
          ? Number(
              purchaseAmount
            ) || 0
          : existing.purchaseAmount,

        now,
        id
      );

      const updatedItem = db
        .prepare(
          `
          SELECT *
          FROM stock
          WHERE id = ?
          `
        )
        .get(id);

      res.json({
        success: true,
        message:
          "Stock updated successfully",
        stock: updatedItem,
      });
    } catch (error) {
      console.error(
        "UPDATE STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Stock update failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// DELETE STOCK
// DELETE /api/stock/:id
// -----------------------------------------------------

app.delete(
  "/api/stock/:id",
  (req, res) => {
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

      const existing = db
        .prepare(
          `
          SELECT *
          FROM stock
          WHERE id = ?
          `
        )
        .get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Stock item not found",
        });
      }

      db.prepare(
        `
        DELETE FROM stock
        WHERE id = ?
        `
      ).run(id);

      res.json({
        success: true,
        message:
          "Stock deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error(
        "DELETE STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Stock delete failed",
        error: error.message,
      });
    }
  }
);

// =====================================================
// BILLS API
// =====================================================

// -----------------------------------------------------
// GET ALL BILLS
// GET /api/bills
// -----------------------------------------------------

app.get(
  "/api/bills",
  (req, res) => {
    try {
      const rows = db
        .prepare(
          `
          SELECT *
          FROM bills
          ORDER BY createdAt DESC
          `
        )
        .all();

      const bills = rows.map(
        (row) => {
          let items = [];

          try {
            items = row.items
              ? JSON.parse(
                  row.items
                )
              : [];
          } catch (error) {
            console.error(
              "BILL ITEMS JSON ERROR:",
              error
            );

            items = [];
          }

          return {
            ...row,
            items,
            credit: Boolean(
              row.credit
            ),
          };
        }
      );

      res.json({
        success: true,
        count: bills.length,
        bills,
      });
    } catch (error) {
      console.error(
        "GET BILLS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Bills load failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// GET SINGLE BILL
// GET /api/bills/:id
// -----------------------------------------------------

app.get(
  "/api/bills/:id",
  (req, res) => {
    try {
      const id = String(
        req.params.id || ""
      ).trim();

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Bill ID is required",
        });
      }

      const row = db
        .prepare(
          `
          SELECT *
          FROM bills
          WHERE id = ?
          `
        )
        .get(id);

      if (!row) {
        return res.status(404).json({
          success: false,
          message:
            "Bill not found",
        });
      }

      let items = [];

      try {
        items = row.items
          ? JSON.parse(
              row.items
            )
          : [];
      } catch (error) {
        items = [];
      }

      res.json({
        success: true,

        bill: {
          ...row,
          items,
          credit: Boolean(
            row.credit
          ),
        },
      });
    } catch (error) {
      console.error(
        "GET SINGLE BILL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Bill load failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// SAVE BILL
// POST /api/bills
// -----------------------------------------------------

app.post(
  "/api/bills",
  (req, res) => {
    try {
      const bill = req.body;

      if (!bill) {
        return res.status(400).json({
          success: false,
          message:
            "Bill data is required",
        });
      }

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

      // -----------------------------------------------
      // DUPLICATE BILL CHECK
      // -----------------------------------------------

      const existingBill = db
        .prepare(
          `
          SELECT id
          FROM bills
          WHERE id = ?
          `
        )
        .get(
          String(bill.id)
        );

      if (existingBill) {
        return res.status(409).json({
          success: false,
          message:
            "Bill already exists",
          billId: bill.id,
        });
      }

      // -----------------------------------------------
      // ITEMS
      // -----------------------------------------------

      const items =
        Array.isArray(
          bill.items
        )
          ? JSON.stringify(
              bill.items
            )
          : "[]";

      // -----------------------------------------------
      // INSERT BILL
      // -----------------------------------------------

      const stmt = db.prepare(`
        INSERT INTO bills (

          id,
          billNo,

          customer,
          customerName,
          customerMobile,
          mobile,

          items,

          totalItems,
          totalQuantity,

          discountPercent,
          discountAmount,

          subtotal,
          billTotal,
          total,
          totalAmount,

          previousAdvance,
          advanceAdjusted,
          advanceUsed,
          billAfterAdvance,

          paymentReceived,
          receivedAmount,
          billPaid,
          paidNow,
          jama,
          paid,
          paidAmount,
          paidAtBill,
          receivedAtBill,

          bakiUdhari,
          pendingAmount,
          creditAmount,
          credit,

          advance,
          advanceAdded,
          advanceBalance,
          remainingAdvance,

          paymentType,

          date,
          billDate,
          createdAt

        )

        VALUES (

          ?, ?,

          ?, ?, ?, ?,

          ?,

          ?, ?,

          ?, ?,

          ?, ?, ?, ?,

          ?, ?, ?, ?,

          ?, ?, ?, ?, ?, ?, ?, ?, ?,

          ?, ?, ?, ?,

          ?, ?, ?, ?,

          ?,

          ?, ?, ?

        )
      `);

      stmt.run(

        String(
          bill.id
        ),

        String(
          bill.billNo
        ),

        String(
          bill.customer || ""
        ),

        String(
          bill.customerName || ""
        ),

        String(
          bill.customerMobile || ""
        ),

        String(
          bill.mobile || ""
        ),

        items,

        Number(
          bill.totalItems
        ) || 0,

        Number(
          bill.totalQuantity
        ) || 0,

        Number(
          bill.discountPercent
        ) || 0,

        Number(
          bill.discountAmount
        ) || 0,

        Number(
          bill.subtotal
        ) || 0,

        Number(
          bill.billTotal
        ) || 0,

        Number(
          bill.total
        ) || 0,

        Number(
          bill.totalAmount
        ) || 0,

        Number(
          bill.previousAdvance
        ) || 0,

        Number(
          bill.advanceAdjusted
        ) || 0,

        Number(
          bill.advanceUsed
        ) || 0,

        Number(
          bill.billAfterAdvance
        ) || 0,

        Number(
          bill.paymentReceived
        ) || 0,

        Number(
          bill.receivedAmount
        ) || 0,

        Number(
          bill.billPaid
        ) || 0,

        Number(
          bill.paidNow
        ) || 0,

        Number(
          bill.jama
        ) || 0,

        Number(
          bill.paid
        ) || 0,

        Number(
          bill.paidAmount
        ) || 0,

        Number(
          bill.paidAtBill
        ) || 0,

        Number(
          bill.receivedAtBill
        ) || 0,

        Number(
          bill.bakiUdhari
        ) || 0,

        Number(
          bill.pendingAmount
        ) || 0,

        Number(
          bill.creditAmount
        ) || 0,

        bill.credit
          ? 1
          : 0,

        Number(
          bill.advance
        ) || 0,

        Number(
          bill.advanceAdded
        ) || 0,

        Number(
          bill.advanceBalance
        ) || 0,

        Number(
          bill.remainingAdvance
        ) || 0,

        String(
          bill.paymentType || ""
        ),

        String(
          bill.date || ""
        ),

        String(
          bill.billDate || ""
        ),

        Number(
          bill.createdAt
        ) || Date.now()
      );

      // -----------------------------------------------
      // GET SAVED BILL
      // -----------------------------------------------

      const savedRow = db
        .prepare(
          `
          SELECT *
          FROM bills
          WHERE id = ?
          `
        )
        .get(
          String(
            bill.id
          )
        );

      let savedItems = [];

      try {
        savedItems =
          savedRow.items
            ? JSON.parse(
                savedRow.items
              )
            : [];
      } catch (error) {
        savedItems = [];
      }

      const savedBill = {
        ...savedRow,

        items:
          savedItems,

        credit:
          Boolean(
            savedRow.credit
          ),
      };

      console.log(
        "BILL SAVED:",
        savedBill.billNo
      );

      res.status(201).json({
        success: true,
        message:
          "Bill saved successfully",
        bill: savedBill,
      });
    } catch (error) {
      console.error(
        "SAVE BILL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Bill save failed",
        error: error.message,
      });
    }
  }
);

// -----------------------------------------------------
// DELETE BILL
// DELETE /api/bills/:id
// -----------------------------------------------------

app.delete(
  "/api/bills/:id",
  (req, res) => {
    try {
      const id = String(
        req.params.id || ""
      ).trim();

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Bill ID is required",
        });
      }

      const existing = db
        .prepare(
          `
          SELECT id
          FROM bills
          WHERE id = ?
          `
        )
        .get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Bill not found",
        });
      }

      db.prepare(
        `
        DELETE FROM bills
        WHERE id = ?
        `
      ).run(id);

      res.json({
        success: true,
        message:
          "Bill deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error(
        "DELETE BILL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Bill delete failed",
        error: error.message,
      });
    }
  }
);

// =====================================================
// FILE UPLOAD
// =====================================================

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

      res.json({
        success: true,
        message:
          "File uploaded successfully",

        file: {
          originalName:
            req.file.originalname,

          fileName:
            req.file.filename,

          size:
            req.file.size,

          url:
            `/uploads/${req.file.filename}`,
        },
      });
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "File upload failed",
      });
    }
  }
);

// =====================================================
// SERVE UPLOADED FILES
// =====================================================

app.use(
  "/uploads",
  express.static(
    uploadDir
  )
);

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found",
    });
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "   SHIVAM MEDICAL ERP BACKEND"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Local URL: http://localhost:${PORT}`
    );

    console.log(
      `API Test: http://localhost:${PORT}/api/test`
    );

    console.log(
      `Database Test: http://localhost:${PORT}/api/database-test`
    );

    console.log(
      `Stock API: http://localhost:${PORT}/api/stock`
    );

    console.log(
      `Bills API: http://localhost:${PORT}/api/bills`
    );

    console.log(
      "======================================"
    );

    console.log("");
  }
);