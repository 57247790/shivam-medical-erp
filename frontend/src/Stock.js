
import { useEffect, useMemo, useState } from "react";

function Stock({ stock, setStock, goBack }) {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);

  // =====================================================
  // BACKEND API URL
  // ONLINE RENDER BACKEND
  // =====================================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://shivam-medical-erp.onrender.com";

  // =====================================================
  // LOAD STOCK FROM BACKEND
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadBackendStock = async () => {
      try {
        console.log(
          "🌐 STOCK API URL:",
          `${API_URL}/api/stock`
        );

        const response = await fetch(
          `${API_URL}/api/stock`
        );

        console.log(
          "🌐 STOCK RESPONSE STATUS:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `Backend stock load failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "📦 BACKEND STOCK RESULT:",
          result
        );

        if (
          mounted &&
          result.success &&
          Array.isArray(result.stock)
        ) {
          setStock(result.stock);

          localStorage.setItem(
            "stock",
            JSON.stringify(result.stock)
          );

          console.log(
            "✅ STOCK LOADED FROM BACKEND:",
            result.stock
          );
        } else {
          console.error(
            "❌ BACKEND STOCK DATA INVALID:",
            result
          );
        }
      } catch (error) {
        console.error(
          "❌ BACKEND STOCK LOAD ERROR:",
          error
        );

        // Backend fail होने पर existing localStorage stock रहने दें
      }
    };

    loadBackendStock();

    return () => {
      mounted = false;
    };
  }, [API_URL, setStock]);

  // =====================================================
  // CURRENT STOCK
  // =====================================================

  const currentStock = useMemo(
    () => (Array.isArray(stock) ? stock : []),
    [stock]
  );

  // =====================================================
  // SAFE NUMBER
  // =====================================================

  const getNumber = (value) => {
    const num = Number(value);

    return Number.isFinite(num) ? num : 0;
  };

  // =====================================================
  // PURCHASE RATE
  // =====================================================

  const getPurchaseRate = (item) => {
    if (!item) return 0;

    if (
      item.purchaseRate !== undefined &&
      item.purchaseRate !== null &&
      item.purchaseRate !== ""
    ) {
      return getNumber(item.purchaseRate);
    }

    if (
      item.purchase_rate !== undefined &&
      item.purchase_rate !== null &&
      item.purchase_rate !== ""
    ) {
      return getNumber(item.purchase_rate);
    }

    if (
      item.rate !== undefined &&
      item.rate !== null &&
      item.rate !== ""
    ) {
      return getNumber(item.rate);
    }

    return 0;
  };

  // =====================================================
  // SALE RATE
  // =====================================================

  const getSaleRate = (item) => {
    if (!item) return 0;

    if (
      item.saleRate !== undefined &&
      item.saleRate !== null &&
      item.saleRate !== ""
    ) {
      return getNumber(item.saleRate);
    }

    if (
      item.sale_rate !== undefined &&
      item.sale_rate !== null &&
      item.sale_rate !== ""
    ) {
      return getNumber(item.sale_rate);
    }

    return 0;
  };

  // =====================================================
  // MRP
  // =====================================================

  const getMRP = (item) => {
    if (!item) return 0;

    if (
      item.mrp !== undefined &&
      item.mrp !== null &&
      item.mrp !== ""
    ) {
      return getNumber(item.mrp);
    }

    if (
      item.MRP !== undefined &&
      item.MRP !== null &&
      item.MRP !== ""
    ) {
      return getNumber(item.MRP);
    }

    return 0;
  };

  // =====================================================
  // EXPIRY INFO
  // =====================================================

  const expiryInfo = (expiry) => {
    if (!expiry) {
      return {
        text: "N/A",
        color: "#777",
        days: null,
        status: "No Expiry",
      };
    }

    const expiryDate = new Date(expiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return {
        text: expiry,
        color: "#777",
        days: null,
        status: "Invalid Date",
      };
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const diff =
      expiryDate.getTime() -
      today.getTime();

    const days = Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );

    if (days < 0) {
      return {
        text: `🔴 Expired ${Math.abs(days)}d`,
        color: "#d32f2f",
        days,
        status: "Expired",
      };
    }

    if (days <= 30) {
      return {
        text: `🔴 ${expiry} (${days}d)`,
        color: "#d32f2f",
        days,
        status: "Expiring Soon",
      };
    }

    return {
      text: expiry,
      color: "#2e7d32",
      days,
      status: "Safe",
    };
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredStock = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return currentStock;
    }

    return currentStock.filter((item) => {
      const medicine = String(
        item.medicine || ""
      ).toLowerCase();

      const company = String(
        item.company || ""
      ).toLowerCase();

      const barcode = String(
        item.barcode || ""
      ).toLowerCase();

      const batch = String(
        item.batch || ""
      ).toLowerCase();

      const supplier = String(
        item.supplier ||
          item.supplierName ||
          ""
      ).toLowerCase();

      return (
        medicine.includes(text) ||
        company.includes(text) ||
        barcode.includes(text) ||
        batch.includes(text) ||
        supplier.includes(text)
      );
    });
  }, [currentStock, search]);

  // =====================================================
  // DELETE MEDICINE
  // =====================================================

  const deleteMedicine = async (item) => {
    if (!item) {
      return;
    }

    const confirmDelete = window.confirm(
      "⚠️ क्या आप इस Stock Item को Delete करना चाहते हैं?\n\n" +
        `Medicine: ${item.medicine || "-"}\n` +
        `Batch: ${item.batch || "-"}\n` +
        `Barcode: ${item.barcode || "-"}\n` +
        `Quantity: ${item.quantity || 0}`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // =================================================
      // BACKEND DELETE
      // =================================================

      if (
        item.id !== undefined &&
        item.id !== null &&
        Number.isInteger(Number(item.id))
      ) {
        const response = await fetch(
          `${API_URL}/api/stock/${item.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          let errorMessage =
            "Backend stock delete failed";

          try {
            const errorResult =
              await response.json();

            if (errorResult.message) {
              errorMessage =
                errorResult.message;
            }
          } catch {
            // Ignore JSON parsing error
          }

          throw new Error(errorMessage);
        }

        console.log(
          "✅ STOCK DELETED FROM BACKEND:",
          item.id
        );
      }

      // =================================================
      // LOCAL STOCK UPDATE
      // =================================================

      const updatedStock =
        currentStock.filter(
          (stockItem) => {
            if (
              item.id !== undefined &&
              item.id !== null
            ) {
              return (
                stockItem.id !==
                item.id
              );
            }

            if (item.barcode) {
              return (
                String(
                  stockItem.barcode || ""
                ).trim() !==
                String(
                  item.barcode || ""
                ).trim()
              );
            }

            return (
              stockItem !== item
            );
          }
        );

      setStock(updatedStock);

      localStorage.setItem(
        "stock",
        JSON.stringify(updatedStock)
      );

      setSelectedStock(null);

      alert(
        "✅ Stock Item Delete हो गया"
      );
    } catch (error) {
      console.error(
        "❌ BACKEND STOCK DELETE ERROR:",
        error
      );

      alert(
        "❌ Stock Delete नहीं हुआ.\n\n" +
          "Backend/database connection check करें."
      );
    }
  };

  // =====================================================
  // TOTAL QUANTITY
  // =====================================================

  const totalQuantity =
    filteredStock.reduce(
      (sum, item) =>
        sum + getNumber(item.quantity),
      0
    );

  // =====================================================
  // TOTAL PURCHASE VALUE
  // =====================================================

  const totalPurchaseValue =
    filteredStock.reduce(
      (sum, item) =>
        sum +
        getNumber(item.quantity) *
          getPurchaseRate(item),
      0
    );

  // =====================================================
  // TOTAL SALE VALUE
  // =====================================================

  const totalSaleValue =
    filteredStock.reduce(
      (sum, item) =>
        sum +
        getNumber(item.quantity) *
          getSaleRate(item),
      0
    );

  // =====================================================
  // EXPIRED COUNT
  // =====================================================

  const expiredCount =
    filteredStock.filter((item) => {
      if (!item.expiry) {
        return false;
      }

      const expiryDate = new Date(
        item.expiry
      );

      if (
        Number.isNaN(
          expiryDate.getTime()
        )
      ) {
        return false;
      }

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      return expiryDate < today;
    }).length;

  // =====================================================
  // EXPIRING SOON COUNT
  // =====================================================

  const expiringSoonCount =
    filteredStock.filter((item) => {
      if (!item.expiry) {
        return false;
      }

      const expiryDate = new Date(
        item.expiry
      );

      if (
        Number.isNaN(
          expiryDate.getTime()
        )
      ) {
        return false;
      }

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const days = Math.ceil(
        (
          expiryDate.getTime() -
          today.getTime()
        ) /
          (1000 * 60 * 60 * 24)
      );

      return (
        days >= 0 &&
        days <= 30
      );
    }).length;

  // =====================================================
  // LOW STOCK COUNT
  // =====================================================

  const lowStockCount =
    filteredStock.filter((item) => {
      const qty = getNumber(
        item.quantity
      );

      return (
        qty > 0 &&
        qty <= 10
      );
    }).length;

  // =====================================================
  // STOCK DETAILS PAGE
  // =====================================================

  if (selectedStock) {
    const item = selectedStock;

    const qty = getNumber(
      item.quantity
    );

    const purchaseRate =
      getPurchaseRate(item);

    const saleRate =
      getSaleRate(item);

    const mrp =
      getMRP(item);

    const purchaseAmount =
      getNumber(
        item.purchaseAmount
      ) ||
      qty * purchaseRate;

    const saleValue =
      qty * saleRate;

    const expiry =
      expiryInfo(
        item.expiry ||
          item.expiryDate ||
          item.expiry_date
      );

    const gstAmount =
      getNumber(
        item.gstAmountPerItem
      );

    const gstType =
      item.gstType ||
      "0";

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "20px",
          background: "#f2f5f9",
          fontFamily:
            "Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#1976d2,#42a5f5)",
            color: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "15px",
          }}
        >
          <h1
            style={{
              margin: 0,
            }}
          >
            📦 Stock Details
          </h1>

          <p
            style={{
              margin:
                "6px 0 0 0",
            }}
          >
            Complete Medicine Stock
            Information
          </p>
        </div>

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            setSelectedStock(null)
          }
          style={{
            padding:
              "11px 18px",
            background:
              "#555",
            color:
              "white",
            border:
              "none",
            borderRadius:
              "7px",
            cursor:
              "pointer",
            fontSize:
              "15px",
            fontWeight:
              "bold",
            marginBottom:
              "15px",
          }}
        >
          ⬅️ Back to Stock
        </button>

        {/* MAIN CARD */}

        <div
          style={{
            maxWidth:
              "1000px",
            margin:
              "0 auto",
            background:
              "white",
            padding:
              "20px",
            borderRadius:
              "12px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          {/* MEDICINE TITLE */}

          <div
            style={{
              padding:
                "18px",
              background:
                "#e3f2fd",
              borderRadius:
                "10px",
              marginBottom:
                "20px",
            }}
          >
            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#666",
                marginBottom:
                  "5px",
              }}
            >
              MEDICINE
            </div>

            <h2
              style={{
                margin:
                  0,
                color:
                  "#1565c0",
              }}
            >
              💊{" "}
              {item.medicine ||
                "-"}
            </h2>

            <div
              style={{
                marginTop:
                  "7px",
                color:
                  "#555",
              }}
            >
              {item.company ||
                "-"}
            </div>
          </div>

          {/* DETAILS GRID */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap:
                "12px",
            }}
          >
            <InfoBox
              title="🏢 Company"
              value={
                item.company ||
                "-"
              }
            />

            <InfoBox
              title="🔢 Batch"
              value={
                item.batch ||
                "-"
              }
            />

            <InfoBox
              title="📷 Barcode"
              value={
                item.barcode ||
                "-"
              }
            />

            <InfoBox
              title="🏭 Supplier"
              value={
                item.supplier ||
                  item.supplierName ||
                  "-"
              }
            />

            <InfoBox
              title="📱 Supplier Mobile"
              value={
                item.supplierMobile ||
                "-"
              }
            />

            <InfoBox
              title="📦 Quantity"
              value={
                qty
              }
            />

            <InfoBox
              title="💰 Purchase Rate"
              value={
                `₹${purchaseRate.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="💵 Sale Rate"
              value={
                `₹${saleRate.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="🏷️ MRP"
              value={
                `₹${mrp.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="🧾 GST"
              value={
                gstType
              }
            />

            <InfoBox
              title="🧾 GST / Adjustment Per Item"
              value={
                `₹${gstAmount.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="💰 Purchase Amount"
              value={
                `₹${purchaseAmount.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="💵 Current Sale Value"
              value={
                `₹${saleValue.toFixed(
                  2
                )}`
              }
            />

            <InfoBox
              title="📅 Purchase Date"
              value={
                item.purchaseDate ||
                item.date ||
                "-"
              }
            />

            <InfoBox
              title="⏰ Purchase Time"
              value={
                item.time ||
                "-"
              }
            />

            <InfoBox
              title="📅 Expiry Date"
              value={
                item.expiry ||
                item.expiryDate ||
                item.expiry_date ||
                "-"
              }
            />

            <InfoBox
              title="⏳ Expiry Status"
              value={
                expiry.status
              }
              valueColor={
                expiry.color
              }
            />
          </div>

          {/* STOCK STATUS */}

          <div
            style={{
              marginTop:
                "20px",
              padding:
                "18px",
              borderRadius:
                "10px",
              background:
                qty <= 0
                  ? "#ffebee"
                  : qty <= 10
                  ? "#fff3e0"
                  : "#e8f5e9",
              border:
                "1px solid #ddd",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 8px 0",
              }}
            >
              📦 Stock Status
            </h3>

            <div
              style={{
                fontSize:
                  "18px",
                fontWeight:
                  "bold",
                color:
                  qty <= 0
                    ? "#d32f2f"
                    : qty <= 10
                    ? "#ef6c00"
                    : "#2e7d32",
              }}
            >
              {qty <= 0
                ? "🔴 OUT OF STOCK"
                : qty <= 10
                ? "🟠 LOW STOCK"
                : "🟢 STOCK AVAILABLE"}
            </div>

            <div
              style={{
                marginTop:
                  "6px",
              }}
            >
              Available Quantity:
              {" "}
              <strong>
                {qty}
              </strong>
            </div>
          </div>

          {/* EXPIRY */}

          <div
            style={{
              marginTop:
                "15px",
              padding:
                "18px",
              background:
                "#fafafa",
              borderRadius:
                "10px",
              border:
                "1px solid #ddd",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 8px 0",
              }}
            >
              📅 Expiry Information
            </h3>

            <div
              style={{
                color:
                  expiry.color,
                fontWeight:
                  "bold",
                fontSize:
                  "16px",
              }}
            >
              {expiry.text}
            </div>
          </div>

          {/* ACTIONS */}

          <div
            style={{
              display:
                "flex",
              gap:
                "10px",
              flexWrap:
                "wrap",
              marginTop:
                "20px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedStock(
                  null
                )
              }
              style={{
                flex:
                  "1 1 200px",
                padding:
                  "13px",
                background:
                  "#1976d2",
                color:
                  "white",
                border:
                  "none",
                borderRadius:
                  "8px",
                cursor:
                  "pointer",
                fontWeight:
                  "bold",
              }}
            >
              ⬅️ Back to Stock
            </button>

            <button
              type="button"
              onClick={() =>
                deleteMedicine(
                  item
                )
              }
              style={{
                flex:
                  "1 1 200px",
                padding:
                  "13px",
                background:
                  "#d32f2f",
                color:
                  "white",
                border:
                  "none",
                borderRadius:
                  "8px",
                cursor:
                  "pointer",
                fontWeight:
                  "bold",
              }}
            >
              🗑️ Delete Stock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN STOCK PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily:
          "Arial, sans-serif",
        boxSizing:
          "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1976d2,#42a5f5)",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "10px",
            flexWrap:
              "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
              }}
            >
              📦 Stock
            </h1>

            <p
              style={{
                margin:
                  "5px 0 0 0",
                fontSize:
                  "13px",
              }}
            >
              Medicine Stock
              Management
            </p>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.18)",
              padding:
                "10px 15px",
              borderRadius:
                "8px",
              fontWeight:
                "bold",
            }}
          >
            Items:{" "}
            {filteredStock.length}
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div
        style={{
          background:
            "white",
          padding:
            "15px",
          borderRadius:
            "10px",
          marginBottom:
            "15px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h3
          style={{
            margin:
              "0 0 10px 0",
          }}
        >
          🔎 Stock Search
        </h3>

        <input
          type="text"
          placeholder="Medicine / Company / Barcode / Batch / Supplier"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            width:
              "100%",
            boxSizing:
              "border-box",
            padding:
              "12px",
            fontSize:
              "15px",
            border:
              "2px solid #1976d2",
            borderRadius:
              "7px",
            outline:
              "none",
          }}
          autoComplete="off"
        />

        {search && (
          <div
            style={{
              marginTop:
                "8px",
              fontSize:
                "12px",
              color:
                "#555",
            }}
          >
            🔍{" "}
            {
              filteredStock.length
            }{" "}
            item(s) found
          </div>
        )}
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap:
            "10px",
          marginBottom:
            "15px",
        }}
      >
        <SummaryBox
          title="Total Items"
          value={
            filteredStock.length
          }
          color="#1976d2"
        />

        <SummaryBox
          title="Total Quantity"
          value={
            totalQuantity
          }
          color="#2e7d32"
        />

        <SummaryBox
          title="Purchase Value"
          value={`₹${totalPurchaseValue.toFixed(
            2
          )}`}
          color="#ef6c00"
        />

        <SummaryBox
          title="Sale Value"
          value={`₹${totalSaleValue.toFixed(
            2
          )}`}
          color="#6a1b9a"
        />

        <SummaryBox
          title="Low Stock"
          value={
            lowStockCount
          }
          color="#ef6c00"
        />

        <SummaryBox
          title="Expiry ≤ 30 Days"
          value={
            expiringSoonCount
          }
          color="#d32f2f"
        />

        <SummaryBox
          title="Expired"
          value={
            expiredCount
          }
          color="#b71c1c"
        />
      </div>

      {/* CLICK INFO */}

      {filteredStock.length > 0 && (
        <div
          style={{
            background:
              "#e3f2fd",
            border:
              "1px solid #90caf9",
            color:
              "#1565c0",
            padding:
              "10px 14px",
            borderRadius:
              "8px",
            marginBottom:
              "12px",
            fontSize:
              "13px",
            fontWeight:
              "bold",
          }}
        >
          👆 किसी भी Stock Row पर Click
          करें → पूरी Medicine Details
          खुलेंगी।
        </div>
      )}

      {/* STOCK TABLE */}

      <div
        style={{
          background:
            "white",
          padding:
            "15px",
          borderRadius:
            "10px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
          overflowX:
            "auto",
        }}
      >
        <h3
          style={{
            margin:
              "0 0 10px 0",
          }}
        >
          📋 Current Stock
        </h3>

        {filteredStock.length ===
        0 ? (
          <div
            style={{
              padding:
                "30px",
              textAlign:
                "center",
              color:
                "#777",
            }}
          >
            {search
              ? "❌ कोई Stock Item नहीं मिला"
              : "📦 अभी Stock खाली है"}
          </div>
        ) : (
          <table
            style={{
              width:
                "100%",
              minWidth:
                "1300px",
              borderCollapse:
                "collapse",
              fontSize:
                "12px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={thStyle}
                >
                  #
                </th>

                <th
                  style={thStyle}
                >
                  Medicine
                </th>

                <th
                  style={thStyle}
                >
                  Company
                </th>

                <th
                  style={thStyle}
                >
                  Batch
                </th>

                <th
                  style={thStyle}
                >
                  Barcode
                </th>

                <th
                  style={thStyle}
                >
                  Supplier
                </th>

                <th
                  style={thStyle}
                >
                  Qty
                </th>

                <th
                  style={thStyle}
                >
                  Purchase Rate
                </th>

                <th
                  style={thStyle}
                >
                  Sale Rate
                </th>

                <th
                  style={thStyle}
                >
                  MRP
                </th>

                <th
                  style={thStyle}
                >
                  Expiry
                </th>

                <th
                  style={thStyle}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStock.map(
                (
                  item,
                  index
                ) => {
                  const exp =
                    expiryInfo(
                      item.expiry ||
                        item.expiryDate ||
                        item.expiry_date
                    );

                  const qty =
                    getNumber(
                      item.quantity
                    );

                  const purchaseRate =
                    getPurchaseRate(
                      item
                    );

                  const saleRate =
                    getSaleRate(
                      item
                    );

                  const mrp =
                    getMRP(
                      item
                    );

                  const lowStock =
                    qty > 0 &&
                    qty <= 10;

                  return (
                    <tr
                      key={
                        item.id ||
                        `${item.barcode}-${item.batch}-${index}`
                      }
                      onClick={() =>
                        setSelectedStock(
                          item
                        )
                      }
                      title="Click करके पूरी Stock Details देखें"
                      style={{
                        cursor:
                          "pointer",
                        background:
                          "white",
                        transition:
                          "background 0.15s",
                      }}
                      onMouseEnter={(
                        e
                      ) => {
                        e.currentTarget.style.background =
                          "#f1f8ff";
                      }}
                      onMouseLeave={(
                        e
                      ) => {
                        e.currentTarget.style.background =
                          "white";
                      }}
                    >
                      {/* # */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {index +
                          1}
                      </td>

                      {/* MEDICINE */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            "#1565c0",
                        }}
                      >
                        💊{" "}
                        {item.medicine ||
                          "-"}
                      </td>

                      {/* COMPANY */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {item.company ||
                          "-"}
                      </td>

                      {/* BATCH */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {item.batch ||
                          "-"}
                      </td>

                      {/* BARCODE */}

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            "#1565c0",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {item.barcode ||
                          "-"}
                      </td>

                      {/* SUPPLIER */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <strong>
                          {item.supplier ||
                            item.supplierName ||
                            "-"}
                        </strong>

                        {item.supplierMobile && (
                          <div
                            style={{
                              fontSize:
                                "10px",
                              color:
                                "#777",
                              marginTop:
                                "3px",
                            }}
                          >
                            📱{" "}
                            {
                              item.supplierMobile
                            }
                          </div>
                        )}
                      </td>

                      {/* QUANTITY */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            qty <= 0
                              ? "#d32f2f"
                              : lowStock
                              ? "#ef6c00"
                              : "#2e7d32",
                        }}
                      >
                        {qty}

                        {qty <=
                          0 && (
                          <div
                            style={{
                              fontSize:
                                "10px",
                              color:
                                "#d32f2f",
                            }}
                          >
                            OUT
                          </div>
                        )}

                        {lowStock && (
                          <div
                            style={{
                              fontSize:
                                "10px",
                              color:
                                "#ef6c00",
                            }}
                          >
                            LOW
                          </div>
                        )}
                      </td>

                      {/* PURCHASE RATE */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        <span
                          style={{
                            fontWeight:
                              "bold",
                            color:
                              "#ef6c00",
                          }}
                        >
                          ₹
                          {purchaseRate.toFixed(
                            2
                          )}
                        </span>
                      </td>

                      {/* SALE RATE */}

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            "#2e7d32",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {saleRate >
                        0
                          ? `₹${saleRate.toFixed(
                              2
                            )}`
                          : "₹0.00"}
                      </td>

                      {/* MRP */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            "#1565c0",
                        }}
                      >
                        ₹
                        {mrp.toFixed(
                          2
                        )}
                      </td>

                      {/* EXPIRY */}

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            exp.color,
                          fontWeight:
                            "bold",
                        }}
                      >
                        {
                          exp.text
                        }
                      </td>

                      {/* ACTION */}

                      <td
                        style={
                          tdStyle
                        }
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            deleteMedicine(
                              item
                            )
                          }
                          style={{
                            padding:
                              "7px 11px",
                            background:
                              "#d32f2f",
                            color:
                              "white",
                            border:
                              "none",
                            borderRadius:
                              "5px",
                            cursor:
                              "pointer",
                            fontWeight:
                              "bold",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* BACK */}

      <button
        type="button"
        onClick={goBack}
        style={{
          width:
            "100%",
          marginTop:
            "15px",
          padding:
            "13px",
          background:
            "#555",
          color:
            "white",
          border:
            "none",
          borderRadius:
            "8px",
          fontSize:
            "16px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        ⬅️ Dashboard
      </button>
    </div>
  );
}

// =====================================================
// INFO BOX
// =====================================================

function InfoBox({
  title,
  value,
  valueColor,
}) {
  return (
    <div
      style={{
        padding:
          "15px",
        background:
          "#f8f9fa",
        borderRadius:
          "9px",
        border:
          "1px solid #e0e0e0",
        minHeight:
          "65px",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          fontSize:
            "12px",
          color:
            "#666",
          marginBottom:
            "7px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize:
            "16px",
          color:
            valueColor ||
            "#222",
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// SUMMARY BOX
// =====================================================

function SummaryBox({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background:
          "white",
        padding:
          "12px",
        borderRadius:
          "9px",
        borderLeft:
          `4px solid ${color}`,
        boxShadow:
          "0 2px 7px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize:
            "11px",
          color:
            "#666",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            "4px",
          fontSize:
            "18px",
          fontWeight:
            "bold",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =====================================================
// TABLE STYLES
// =====================================================

const thStyle = {
  border:
    "1px solid #ddd",
  padding:
    "8px",
  background:
    "#e3f2fd",
  whiteSpace:
    "nowrap",
  textAlign:
    "left",
};

const tdStyle = {
  border:
    "1px solid #ddd",
  padding:
    "8px",
  whiteSpace:
    "nowrap",
  verticalAlign:
    "middle",
};

export default Stock;