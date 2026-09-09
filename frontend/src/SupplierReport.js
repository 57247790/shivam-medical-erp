import React, { useEffect, useState } from "react";

function SupplierReport({ goBack }) {
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);

  // =========================================
  // LOAD SUPPLIERS
  // =========================================

  const loadSuppliers = () => {
    let names = [];

    try {
      const purchaseHistory = JSON.parse(
        localStorage.getItem("purchaseHistory") || "[]"
      );

      if (Array.isArray(purchaseHistory)) {
        purchaseHistory.forEach((item) => {
          const name = String(
            item?.supplier ||
              item?.supplierName ||
              item?.vendor ||
              ""
          ).trim();

          if (name) {
            names.push(name);
          }
        });
      }
    } catch (error) {
      console.error("Purchase history error:", error);
    }

    try {
      const savedPayments = JSON.parse(
        localStorage.getItem("supplierPayments") || "[]"
      );

      if (Array.isArray(savedPayments)) {
        savedPayments.forEach((item) => {
          const name = String(
            item?.supplier ||
              item?.supplierName ||
              ""
          ).trim();

          if (name) {
            names.push(name);
          }
        });
      }
    } catch (error) {
      console.error("Supplier payments error:", error);
    }

    const uniqueSuppliers = [];

    names.forEach((name) => {
      const exists = uniqueSuppliers.some(
        (item) =>
          item.toLowerCase() === name.toLowerCase()
      );

      if (!exists) {
        uniqueSuppliers.push(name);
      }
    });

    setSuppliers(uniqueSuppliers);

    const savedSupplier = localStorage.getItem(
      "selectedSupplierForPayment"
    );

    if (savedSupplier) {
      const found = uniqueSuppliers.find(
        (name) =>
          name.toLowerCase() ===
          savedSupplier.trim().toLowerCase()
      );

      if (found) {
        setSupplier(found);
      }
    }
  };

  // =========================================
  // LOAD PAYMENTS
  // =========================================

  const loadPayments = () => {
    try {
      const savedPayments = JSON.parse(
        localStorage.getItem("supplierPayments") || "[]"
      );

      setPayments(
        Array.isArray(savedPayments)
          ? savedPayments
          : []
      );
    } catch (error) {
      console.error("Payment history error:", error);
      setPayments([]);
    }
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadSuppliers();
    loadPayments();

    const refreshData = () => {
      loadSuppliers();
      loadPayments();
    };

    window.addEventListener(
      "supplierPaymentSaved",
      refreshData
    );

    window.addEventListener(
      "purchaseSaved",
      refreshData
    );

    return () => {
      window.removeEventListener(
        "supplierPaymentSaved",
        refreshData
      );

      window.removeEventListener(
        "purchaseSaved",
        refreshData
      );
    };
  }, []);

  // =========================================
  // PURCHASE TOTAL
  // =========================================

  const getPurchaseTotal = () => {
    if (!supplier.trim()) {
      return 0;
    }

    try {
      const history = JSON.parse(
        localStorage.getItem("purchaseHistory") || "[]"
      );

      if (!Array.isArray(history)) {
        return 0;
      }

      return history
        .filter((item) => {
          const name = String(
            item?.supplier ||
              item?.supplierName ||
              item?.vendor ||
              ""
          )
            .trim()
            .toLowerCase();

          return (
            name ===
            supplier.trim().toLowerCase()
          );
        })
        .reduce((total, item) => {
          if (item.purchaseAmount != null) {
            return (
              total +
              Number(item.purchaseAmount || 0)
            );
          }

          if (item.totalAmount != null) {
            return (
              total +
              Number(item.totalAmount || 0)
            );
          }

          if (item.amount != null) {
            return (
              total +
              Number(item.amount || 0)
            );
          }

          const quantity = Number(
            item.quantity ||
              item.qty ||
              0
          );

          const rate = Number(
            item.purchaseRate ||
              item.rate ||
              0
          );

          return total + quantity * rate;
        }, 0);
    } catch {
      return 0;
    }
  };

  // =========================================
  // PAID TOTAL
  // =========================================

  const getPaidTotal = () => {
    if (!supplier.trim()) {
      return 0;
    }

    return payments
      .filter((item) => {
        const name = String(
          item?.supplier ||
            item?.supplierName ||
            ""
        )
          .trim()
          .toLowerCase();

        return (
          name ===
          supplier.trim().toLowerCase()
        );
      })
      .reduce((total, item) => {
        return (
          total +
          Number(
            item.amount ||
              item.paidAmount ||
              item.payment ||
              0
          )
        );
      }, 0);
  };

  // =========================================
  // TOTALS
  // =========================================

  const purchaseTotal = getPurchaseTotal();
  const paidTotal = getPaidTotal();

  const pending = Math.max(
    purchaseTotal - paidTotal,
    0
  );

  // =========================================
  // SAVE PAYMENT
  // =========================================

  const savePayment = () => {
    if (!supplier.trim()) {
      alert("⚠️ पहले Supplier select करें।");
      return;
    }

    const paymentAmount = Number(amount);

    if (!amount || paymentAmount <= 0) {
      alert("⚠️ Payment amount सही डालें।");
      return;
    }

    const currentPurchaseTotal =
      getPurchaseTotal();

    const currentPaidTotal =
      getPaidTotal();

    const currentPending = Math.max(
      currentPurchaseTotal -
        currentPaidTotal,
      0
    );

    if (currentPending <= 0) {
      alert(
        "✅ इस Supplier की कोई Pending Payment नहीं है।"
      );
      return;
    }

    if (paymentAmount > currentPending) {
      alert(
        "⚠️ Payment Pending से ज्यादा नहीं हो सकती।\n\n" +
          "Supplier: " +
          supplier.trim() +
          "\n" +
          "Pending: ₹" +
          currentPending.toFixed(2) +
          "\n" +
          "आपने डाला: ₹" +
          paymentAmount.toFixed(2)
      );

      return;
    }

    const now = new Date();

    const paymentDate =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const payment = {
      id: Date.now(),

      supplier: supplier.trim(),
      supplierName: supplier.trim(),

      amount: paymentAmount,
      paidAmount: paymentAmount,
      payment: paymentAmount,

      paymentMode: paymentMode,

      note: note.trim(),

      date: paymentDate,
      time: now.toLocaleTimeString(),

      createdAt: Date.now(),
    };

    let oldPayments = [];

    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "supplierPayments"
        ) || "[]"
      );

      oldPayments = Array.isArray(saved)
        ? saved
        : [];
    } catch {
      oldPayments = [];
    }

    const updatedPayments = [
      payment,
      ...oldPayments,
    ];

    localStorage.setItem(
      "supplierPayments",
      JSON.stringify(updatedPayments)
    );

    localStorage.setItem(
      "selectedSupplierForPayment",
      supplier.trim()
    );

    setPayments(updatedPayments);

    window.dispatchEvent(
      new Event("supplierPaymentSaved")
    );

    const remainingPending = Math.max(
      currentPending - paymentAmount,
      0
    );

    alert(
      "✅ Supplier Payment Saved Successfully\n\n" +
        "Supplier: " +
        supplier.trim() +
        "\n" +
        "Payment: ₹" +
        paymentAmount.toFixed(2) +
        "\n" +
        "Mode: " +
        paymentMode +
        "\n" +
        "Remaining Pending: ₹" +
        remainingPending.toFixed(2)
    );

    setAmount("");
    setNote("");

    loadSuppliers();
    loadPayments();
  };

  // =========================================
  // SUPPLIER PAYMENT HISTORY
  // =========================================

  const supplierPaymentHistory = payments.filter(
    (item) => {
      const name = String(
        item?.supplier ||
          item?.supplierName ||
          ""
      )
        .trim()
        .toLowerCase();

      return (
        name ===
        supplier.trim().toLowerCase()
      );
    }
  );

  // =========================================
  // DELETE PAYMENT
  // =========================================

  const deletePayment = (id) => {
    const confirmDelete = window.confirm(
      "क्या आप यह Supplier Payment delete करना चाहते हैं?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedPayments = payments.filter(
      (item) => item.id !== id
    );

    localStorage.setItem(
      "supplierPayments",
      JSON.stringify(updatedPayments)
    );

    setPayments(updatedPayments);

    window.dispatchEvent(
      new Event("supplierPaymentSaved")
    );

    alert("✅ Payment deleted successfully.");
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1565c0,#42a5f5)",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          🏢 Supplier Payment Entry
        </h1>

        <p style={{ marginBottom: 0 }}>
          Shivam Medical ERP
        </p>
      </div>

      {/* PAYMENT FORM */}

      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto 20px",
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        {/* SUPPLIER */}

        <label>
          <b>🏢 Supplier</b>
        </label>

        <select
          value={supplier}
          onChange={(e) => {
            const selected = e.target.value;

            setSupplier(selected);

            localStorage.setItem(
              "selectedSupplierForPayment",
              selected
            );
          }}
          style={inputStyle}
        >
          <option value="">
            -- Supplier Select करें --
          </option>

          {suppliers.map((name) => (
            <option
              key={name}
              value={name}
            >
              {name}
            </option>
          ))}
        </select>

        {suppliers.length === 0 && (
          <div
            style={{
              padding: "12px",
              background: "#ffebee",
              color: "#c62828",
              borderRadius: "7px",
              marginBottom: "15px",
              fontWeight: "bold",
            }}
          >
            ⚠️ कोई Supplier उपलब्ध नहीं है।
            <br />
            पहले Purchase Entry में
            Supplier का नाम save करें।
          </div>
        )}

        {/* SUMMARY */}

        {supplier && (
          <div
            style={{
              marginTop: "15px",
              padding: "18px",
              background: "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              🏢 Supplier: {supplier}
            </h3>

            <div>
              Total Purchase:{" "}
              <b>
                ₹{purchaseTotal.toFixed(2)}
              </b>
            </div>

            <div style={{ marginTop: "7px" }}>
              Total Paid:{" "}
              <b
                style={{
                  color: "#2e7d32",
                }}
              >
                ₹{paidTotal.toFixed(2)}
              </b>
            </div>

            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background:
                  pending > 0
                    ? "#ffebee"
                    : "#e8f5e9",
                color:
                  pending > 0
                    ? "#d32f2f"
                    : "#2e7d32",
                borderRadius: "7px",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Pending: ₹
              {pending.toFixed(2)}
            </div>
          </div>
        )}

        {/* AMOUNT */}

        <label
          style={{
            display: "block",
            marginTop: "20px",
          }}
        >
          <b>💰 Payment Amount</b>
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          placeholder="Payment Amount ₹"
          style={inputStyle}
        />

        {/* PAYMENT MODE */}

        <label>
          <b>💳 Payment Mode</b>
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "8px",
            marginTop: "10px",
            marginBottom: "15px",
          }}
        >
          {[
            ["Cash", "💵"],
            ["UPI", "📱"],
            ["Bank", "🏦"],
            ["Cheque", "🧾"],
          ].map(([mode, icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                setPaymentMode(mode)
              }
              style={{
                padding: "12px 5px",
                border: "none",
                borderRadius: "7px",
                cursor: "pointer",
                background:
                  paymentMode === mode
                    ? "#1565c0"
                    : "#e0e0e0",
                color:
                  paymentMode === mode
                    ? "white"
                    : "#222",
                fontWeight: "bold",
              }}
            >
              {icon} {mode}
            </button>
          ))}
        </div>

        {/* NOTE */}

        <label>
          <b>📝 Note</b>
        </label>

        <textarea
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
          placeholder="Payment Note"
          rows="4"
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />

        {/* SAVE */}

        <button
          type="button"
          onClick={savePayment}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "14px",
            background: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "17px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          💾 Save Supplier Payment
        </button>

        {/* BACK */}

        <button
          type="button"
          onClick={() => {
            if (typeof goBack === "function") {
              goBack();
            }
          }}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "13px",
            background: "#555",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ⬅️ Back to Supplier Ledger
        </button>
      </div>

      {/* =========================================
          PAYMENT HISTORY
      ========================================= */}

      {supplier && (
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 3px 10px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              📋 Supplier Payment History
            </h2>

            <div
              style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                padding: "8px 12px",
                borderRadius: "7px",
                fontWeight: "bold",
              }}
            >
              Total Paid: ₹
              {paidTotal.toFixed(2)}
            </div>
          </div>

          {supplierPaymentHistory.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                background: "#f5f5f5",
                borderRadius: "8px",
                color: "#666",
              }}
            >
              अभी इस Supplier की कोई payment
              history नहीं है।
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#1565c0",
                      color: "white",
                    }}
                  >
                    <th style={thStyle}>
                      Date
                    </th>

                    <th style={thStyle}>
                      Supplier
                    </th>

                    <th style={thStyle}>
                      Mode
                    </th>

                    <th style={thStyle}>
                      Amount
                    </th>

                    <th style={thStyle}>
                      Note
                    </th>

                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {supplierPaymentHistory.map(
                    (item, index) => (
                      <tr
                        key={
                          item.id ||
                          index
                        }
                      >
                        <td style={tdStyle}>
                          {item.date || "-"}
                          <br />
                          <small>
                            {item.time || ""}
                          </small>
                        </td>

                        <td style={tdStyle}>
                          <b>
                            {item.supplier ||
                              item.supplierName ||
                              "-"}
                          </b>
                        </td>

                        <td style={tdStyle}>
                          {item.paymentMode ===
                            "Cash" &&
                            "💵 "}

                          {item.paymentMode ===
                            "UPI" &&
                            "📱 "}

                          {item.paymentMode ===
                            "Bank" &&
                            "🏦 "}

                          {item.paymentMode ===
                            "Cheque" &&
                            "🧾 "}

                          {item.paymentMode ||
                            "-"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              "#2e7d32",
                            fontWeight:
                              "bold",
                          }}
                        >
                          ₹
                          {Number(
                            item.amount ||
                              item.paidAmount ||
                              item.payment ||
                              0
                          ).toFixed(2)}
                        </td>

                        <td style={tdStyle}>
                          {item.note || "-"}
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              deletePayment(
                                item.id
                              )
                            }
                            style={{
                              background:
                                "#d32f2f",
                              color:
                                "white",
                              border:
                                "none",
                              borderRadius:
                                "6px",
                              padding:
                                "7px 10px",
                              cursor:
                                "pointer",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================
// STYLES
// =========================================

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "15px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  fontSize: "16px",
  background: "white",
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
  fontSize: "13px",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  fontSize: "13px",
  verticalAlign: "top",
};

export default SupplierReport;