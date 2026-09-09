
import React, { useEffect, useMemo, useState } from "react";

function Stock({ stock, setStock, goBack }) {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // ONLINE BACKEND URL
  // =========================================================
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://shivam-medical-erp.onrender.com";

  // =========================================================
  // LOAD STOCK FROM BACKEND
  // =========================================================
  useEffect(() => {
    let mounted = true;

    const loadStock = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/stock`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Stock API Error: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        console.log("📦 STOCK API RESULT:", result);

        // =====================================================
        // API CAN RETURN:
        // 1. Direct array
        // 2. { success: true, stock: [...] }
        // =====================================================

        let backendStock = null;

        if (Array.isArray(result)) {
          backendStock = result;
        } else if (
          result &&
          Array.isArray(result.stock)
        ) {
          backendStock = result.stock;
        }

        if (mounted && Array.isArray(backendStock)) {
          console.log(
            "✅ BACKEND STOCK LOADED:",
            backendStock.length,
            backendStock
          );

          setStock(backendStock);

          localStorage.setItem(
            "stock",
            JSON.stringify(backendStock)
          );
        } else {
          console.warn(
            "⚠️ STOCK API RESPONSE FORMAT NOT RECOGNIZED:",
            result
          );
        }
      } catch (error) {
        console.error(
          "❌ STOCK LOAD ERROR:",
          error
        );

        // Backend fail होने पर localStorage stock रहने दें
        try {
          const localStock = JSON.parse(
            localStorage.getItem("stock") || "[]"
          );

          if (
            mounted &&
            Array.isArray(localStock)
          ) {
            setStock(localStock);
          }
        } catch (localError) {
          console.error(
            "❌ LOCAL STOCK ERROR:",
            localError
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStock();

    return () => {
      mounted = false;
    };
  }, [API_URL, setStock]);

  // =========================================================
  // NORMALIZE STOCK
  // =========================================================
  const safeStock = Array.isArray(stock)
    ? stock
    : [];

  // =========================================================
  // SEARCH
  // =========================================================
  const filteredStock = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    if (!text) {
      return safeStock;
    }

    return safeStock.filter((item) => {
      const medicine = String(
        item.medicine || ""
      ).toLowerCase();

      const company = String(
        item.company || ""
      ).toLowerCase();

      const batch = String(
        item.batch || ""
      ).toLowerCase();

      const barcode = String(
        item.barcode || ""
      ).toLowerCase();

      const supplier = String(
        item.supplier || ""
      ).toLowerCase();

      return (
        medicine.includes(text) ||
        company.includes(text) ||
        batch.includes(text) ||
        barcode.includes(text) ||
        supplier.includes(text)
      );
    });
  }, [safeStock, search]);

  // =========================================================
  // TOTAL STOCK
  // =========================================================
  const totalQuantity = useMemo(() => {
    return safeStock.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );
  }, [safeStock]);

  // =========================================================
  // TOTAL STOCK VALUE
  // =========================================================
  const totalPurchaseValue = useMemo(() => {
    return safeStock.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(
            item.purchaseRateWithGST ??
              item.rate ??
              0
          ),
      0
    );
  }, [safeStock]);

  // =========================================================
  // TOTAL MRP VALUE
  // =========================================================
  const totalMRPValue = useMemo(() => {
    return safeStock.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.mrp || 0),
      0
    );
  }, [safeStock]);

  // =========================================================
  // DELETE STOCK
  // =========================================================
  const deleteStock = async (id) => {
    if (!id) {
      alert("Stock ID नहीं मिला");
      return;
    }

    const ok = window.confirm(
      "क्या आप इस stock item को delete करना चाहते हैं?"
    );

    if (!ok) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/stock/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Delete failed: ${response.status}`
        );
      }

      const updatedStock = safeStock.filter(
        (item) =>
          String(item.id) !== String(id)
      );

      setStock(updatedStock);

      localStorage.setItem(
        "stock",
        JSON.stringify(updatedStock)
      );

      window.dispatchEvent(
        new Event("stockUpdated")
      );

      setSelectedItem(null);

      alert("Stock delete हो गया");
    } catch (error) {
      console.error(
        "❌ DELETE STOCK ERROR:",
        error
      );

      alert(
        "Stock delete नहीं हुआ। Backend connection check करें।"
      );
    }
  };

  // =========================================================
  // EXPIRY STATUS
  // =========================================================
  const getExpiryStatus = (expiry) => {
    if (!expiry) {
      return {
        text: "-",
        className: "",
      };
    }

    const expiryDate = new Date(expiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return {
        text: expiry,
        className: "",
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
        text: "EXPIRED",
        className: "expired",
      };
    }

    if (days <= 30) {
      return {
        text: `${days} दिन`,
        className: "near-expiry",
      };
    }

    return {
      text: expiry,
      className: "",
    };
  };

  // =========================================================
  // REFRESH
  // =========================================================
  const refreshStock = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/stock`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Refresh failed: ${response.status}`
        );
      }

      const result = await response.json();

      console.log(
        "🔄 REFRESH STOCK RESULT:",
        result
      );

      let backendStock = null;

      if (Array.isArray(result)) {
        backendStock = result;
      } else if (
        result &&
        Array.isArray(result.stock)
      ) {
        backendStock = result.stock;
      }

      if (Array.isArray(backendStock)) {
        setStock(backendStock);

        localStorage.setItem(
          "stock",
          JSON.stringify(backendStock)
        );

        window.dispatchEvent(
          new Event("stockUpdated")
        );
      }
    } catch (error) {
      console.error(
        "❌ REFRESH STOCK ERROR:",
        error
      );

      alert(
        "Stock refresh नहीं हो पाया।"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            📦 Stock
          </h2>

          <div
            style={{
              fontSize: "13px",
              color: "#666",
              marginTop: "5px",
            }}
          >
            Online Stock
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={refreshStock}
            disabled={loading}
            style={{
              padding:
                "9px 14px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            🔄 Refresh
          </button>

          {goBack && (
            <button
              onClick={goBack}
              style={{
                padding:
                  "9px 14px",
                cursor:
                  "pointer",
              }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div
        style={{
          marginBottom: "15px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Medicine / Company / Batch / Barcode / Supplier search..."
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "11px",
            fontSize: "15px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
            boxSizing:
              "border-box",
          }}
        />
      </div>

      {/* SUMMARY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
            background:
              "#f8f8f8",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            Total Items
          </div>

          <strong
            style={{
              fontSize: "22px",
            }}
          >
            {safeStock.length}
          </strong>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
            background:
              "#f8f8f8",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            Total Quantity
          </div>

          <strong
            style={{
              fontSize: "22px",
            }}
          >
            {totalQuantity}
          </strong>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
            background:
              "#f8f8f8",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            Purchase Value
          </div>

          <strong
            style={{
              fontSize: "22px",
            }}
          >
            ₹
            {totalPurchaseValue.toFixed(
              2
            )}
          </strong>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ddd",
            borderRadius: "8px",
            background:
              "#f8f8f8",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            MRP Value
          </div>

          <strong
            style={{
              fontSize: "22px",
            }}
          >
            ₹
            {totalMRPValue.toFixed(
              2
            )}
          </strong>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            padding: "15px",
            textAlign: "center",
          }}
        >
          ⏳ Stock loading...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredStock.length ===
          0 && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              border:
                "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h3>
              Stock नहीं मिला
            </h3>

            <p>
              Search बदलकर देखें
              या Refresh दबाएँ।
            </p>
          </div>
        )}

      {/* TABLE */}
      {!loading &&
        filteredStock.length >
          0 && (
          <div
            style={{
              overflowX:
                "auto",
              border:
                "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "1100px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "#f1f1f1",
                  }}
                >
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
                    MRP
                  </th>

                  <th
                    style={thStyle}
                  >
                    Sale Rate
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
                  (item, index) => {
                    const expiry =
                      getExpiryStatus(
                        item.expiry
                      );

                    return (
                      <tr
                        key={
                          item.id ||
                          `${item.medicine}-${item.batch}-${index}`
                        }
                        style={{
                          borderTop:
                            "1px solid #ddd",
                        }}
                      >
                        <td
                          style={tdStyle}
                        >
                          {index +
                            1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {item.medicine ||
                            "-"}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {item.company ||
                            "-"}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {item.batch ||
                            "-"}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {item.barcode ||
                            "-"}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {item.supplier ||
                            "-"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {Number(
                            item.quantity ||
                              0
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          ₹
                          {Number(
                            item.purchaseRateWithGST ??
                              item.rate ??
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          ₹
                          {Number(
                            item.mrp ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          ₹
                          {Number(
                            item.saleRate ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              expiry.className
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {expiry.text}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "6px",
                            }}
                          >
                            <button
                              onClick={() =>
                                setSelectedItem(
                                  item
                                )
                              }
                              style={{
                                padding:
                                  "6px 10px",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Details
                            </button>

                            {item.id && (
                              <button
                                onClick={() =>
                                  deleteStock(
                                    item.id
                                  )
                                }
                                style={{
                                  padding:
                                    "6px 10px",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* DETAILS */}
      {selectedItem && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.45)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={() =>
            setSelectedItem(
              null
            )
          }
        >
          <div
            style={{
              background:
                "#fff",
              width: "100%",
              maxWidth:
                "600px",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              borderRadius:
                "10px",
              padding:
                "20px",
              boxSizing:
                "border-box",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "15px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                Stock Details
              </h3>

              <button
                onClick={() =>
                  setSelectedItem(
                    null
                  )
                }
              >
                ✕
              </button>
            </div>

            <DetailRow
              label="Medicine"
              value={
                selectedItem.medicine
              }
            />

            <DetailRow
              label="Company"
              value={
                selectedItem.company
              }
            />

            <DetailRow
              label="Batch"
              value={
                selectedItem.batch
              }
            />

            <DetailRow
              label="Barcode"
              value={
                selectedItem.barcode
              }
            />

            <DetailRow
              label="Supplier"
              value={
                selectedItem.supplier
              }
            />

            <DetailRow
              label="Supplier Mobile"
              value={
                selectedItem.supplierMobile
              }
            />

            <DetailRow
              label="Quantity"
              value={
                selectedItem.quantity
              }
            />

            <DetailRow
              label="Purchase Rate"
              value={`₹${Number(
                selectedItem.rate ||
                  0
              ).toFixed(2)}`}
            />

            <DetailRow
              label="Purchase Rate With GST"
              value={`₹${Number(
                selectedItem.purchaseRateWithGST ??
                  selectedItem.rate ??
                  0
              ).toFixed(2)}`}
            />

            <DetailRow
              label="GST"
              value={
                selectedItem.gstType
                  ? `${selectedItem.gstType} (${selectedItem.gstPercent || 0}%)`
                  : "-"
              }
            />

            <DetailRow
              label="MRP"
              value={`₹${Number(
                selectedItem.mrp ||
                  0
              ).toFixed(2)}`}
            />

            <DetailRow
              label="Sale Rate"
              value={`₹${Number(
                selectedItem.saleRate ||
                  0
              ).toFixed(2)}`}
            />

            <DetailRow
              label="Purchase Amount"
              value={`₹${Number(
                selectedItem.purchaseAmount ||
                  0
              ).toFixed(2)}`}
            />

            <DetailRow
              label="Expiry"
              value={
                selectedItem.expiry ||
                "-"
              }
            />

            <DetailRow
              label="Stock ID"
              value={
                selectedItem.id ||
                "-"
              }
            />
          </div>
        </div>
      )}

      {/* STATUS */}
      <div
        style={{
          marginTop: "15px",
          fontSize: "12px",
          color: "#777",
        }}
      >
        Backend: {API_URL}
      </div>

      <style>
        {`
          .expired {
            color: red;
          }

          .near-expiry {
            color: orange;
          }
        `}
      </style>
    </div>
  );
}

// =========================================================
// TABLE STYLES
// =========================================================

const thStyle = {
  padding: "10px",
  textAlign: "left",
  borderBottom:
    "1px solid #ccc",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  padding: "9px",
  verticalAlign:
    "middle",
  whiteSpace:
    "nowrap",
};

// =========================================================
// DETAIL ROW
// =========================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "180px 1fr",
        gap: "10px",
        padding:
          "9px 0",
        borderBottom:
          "1px solid #eee",
      }}
    >
      <strong>
        {label}
      </strong>

      <span>
        {value === undefined ||
        value === null ||
        value === ""
          ? "-"
          : String(value)}
      </span>
    </div>
  );
}

export default Stock;