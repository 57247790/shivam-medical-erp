import React, { useMemo, useState } from "react";

function SupplierPayment({ goBack }) {
  const [supplier, setSupplier] = useState(() => {
    return (
      localStorage.getItem(
        "selectedSupplierForPayment"
      ) || ""
    );
  });

  const [paymentType, setPaymentType] =
    useState("udhari");

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] =
    useState("Cash");
  const [note, setNote] = useState("");

  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // SAFE ARRAY
  // =====================================================

  const getArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  // =====================================================
  // SAFE OBJECT
  // =====================================================

  const getObject = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "{}"
      );

      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        return data;
      }

      return {};
    } catch {
      return {};
    }
  };

  // =====================================================
  // PURCHASE HISTORY
  // =====================================================

  const purchaseHistory = useMemo(() => {
    return getArray("purchaseHistory");
  }, [refresh]);

  // =====================================================
  // STOCK
  // =====================================================

  const stock = useMemo(() => {
    return getArray("stock");
  }, [refresh]);

  // =====================================================
  // PAYMENT HISTORY
  // =====================================================

  const payments = useMemo(() => {
    return getArray("supplierPayments");
  }, [refresh]);

  // =====================================================
  // ADVANCE DATA
  // =====================================================

  const advances = useMemo(() => {
    return getObject("supplierAdvances");
  }, [refresh]);

  // =====================================================
  // SUPPLIER NAME
  // =====================================================

  const getSupplierName = (item) => {
    return String(
      item?.supplier ||
        item?.supplierName ||
        item?.vendor ||
        ""
    ).trim();
  };

  // =====================================================
  // SUPPLIER KEY
  // =====================================================

  const makeSupplierKey = (name) => {
    return String(name || "")
      .trim()
      .toLowerCase();
  };

  // =====================================================
  // PURCHASE AMOUNT
  // =====================================================

  const getPurchaseAmount = (item) => {
    if (item?.purchaseAmount != null) {
      return Number(
        item.purchaseAmount
      ) || 0;
    }

    if (item?.totalAmount != null) {
      return Number(
        item.totalAmount
      ) || 0;
    }

    if (item?.amount != null) {
      return Number(item.amount) || 0;
    }

    const qty = Number(
      item?.quantity ||
        item?.qty ||
        0
    );

    const rate = Number(
      item?.purchaseRate ||
        item?.rate ||
        0
    );

    return qty * rate;
  };

  // =====================================================
  // PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (item) => {
    return Number(
      item?.amount ||
        item?.paidAmount ||
        item?.payment ||
        0
    );
  };

  // =====================================================
  // ALL SUPPLIERS
  // =====================================================

  const suppliers = useMemo(() => {
    const names = new Set();

    purchaseHistory.forEach((item) => {
      const name =
        getSupplierName(item);

      if (name) {
        names.add(name);
      }
    });

    stock.forEach((item) => {
      const name =
        getSupplierName(item);

      if (name) {
        names.add(name);
      }
    });

    payments.forEach((item) => {
      const name =
        getSupplierName(item);

      if (name) {
        names.add(name);
      }
    });

    Object.keys(advances).forEach(
      (key) => {
        if (key) {
          const found = [
            ...purchaseHistory,
            ...stock,
            ...payments,
          ].find(
            (item) =>
              makeSupplierKey(
                getSupplierName(item)
              ) === key
          );

          if (found) {
            names.add(
              getSupplierName(found)
            );
          }
        }
      }
    );

    return Array.from(names).sort(
      (a, b) =>
        a.localeCompare(b)
    );
  }, [
    purchaseHistory,
    stock,
    payments,
    advances,
  ]);

  // =====================================================
  // CURRENT SUPPLIER KEY
  // =====================================================

  const supplierKey = useMemo(() => {
    return makeSupplierKey(
      supplier
    );
  }, [supplier]);

  // =====================================================
  // TOTAL PURCHASE
  // =====================================================

  const totalPurchase = useMemo(() => {
    if (!supplier.trim()) {
      return 0;
    }

    const name =
      supplier.trim().toLowerCase();

    return purchaseHistory
      .filter(
        (item) =>
          getSupplierName(item)
            .toLowerCase() === name
      )
      .reduce(
        (sum, item) =>
          sum +
          getPurchaseAmount(item),
        0
      );
  }, [
    supplier,
    purchaseHistory,
  ]);

  // =====================================================
  // UDHARI SETTLEMENT PAYMENT
  //
  // IMPORTANT:
  // केवल paymentType = udhari_settlement
  // को Udhari में count करेंगे.
  // =====================================================

  const totalUdhariPaid = useMemo(() => {
    if (!supplier.trim()) {
      return 0;
    }

    const name =
      supplier.trim().toLowerCase();

    return payments
      .filter((item) => {
        const itemName =
          getSupplierName(item)
            .toLowerCase();

        const type =
          item?.paymentType ||
          "udhari_settlement";

        return (
          itemName === name &&
          type ===
            "udhari_settlement"
        );
      })
      .reduce(
        (sum, item) =>
          sum +
          getPaymentAmount(item),
        0
      );
  }, [
    supplier,
    payments,
  ]);

  // =====================================================
  // CURRENT ADVANCE
  // =====================================================

  const currentAdvance = useMemo(() => {
    if (!supplierKey) {
      return 0;
    }

    return Number(
      advances[supplierKey] || 0
    );
  }, [
    supplierKey,
    advances,
  ]);

  // =====================================================
  // PENDING
  // =====================================================

  const pending = Math.max(
    totalPurchase -
      totalUdhariPaid,
    0
  );

  // =====================================================
  // SELECT SUPPLIER
  // =====================================================

  const selectSupplier = (name) => {
    setSupplier(name);

    localStorage.setItem(
      "selectedSupplierForPayment",
      name
    );
  };

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  const savePayment = () => {
    const cleanSupplier =
      supplier.trim();

    if (!cleanSupplier) {
      alert(
        "⚠️ पहले Supplier select करें।"
      );
      return;
    }

    const paymentAmount =
      Number(amount);

    if (
      !amount ||
      isNaN(paymentAmount) ||
      paymentAmount <= 0
    ) {
      alert(
        "⚠️ सही Payment Amount डालें।"
      );
      return;
    }

    // =================================================
    // UDHARI PAYMENT
    // =================================================

    if (
      paymentType === "udhari"
    ) {
      if (pending <= 0) {
        alert(
          "✅ इस Supplier की कोई Udhari बाकी नहीं है।\n\n" +
            "अगर पहले से पैसा देना है तो Payment Type में Advance चुनें।"
        );

        return;
      }

      if (
        paymentAmount > pending
      ) {
        alert(
          "⚠️ Udhari Payment Pending Amount से ज्यादा नहीं हो सकता।\n\n" +
            "Pending: ₹" +
            pending.toFixed(2)
        );

        return;
      }
    }

    const now = new Date();

    const date =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

    const time =
      now.toLocaleTimeString();

    // =================================================
    // PAYMENT RECORD
    // =================================================

    const paymentRecord = {
      id:
        Date.now() +
        Math.random(),

      supplier:
        cleanSupplier,

      supplierName:
        cleanSupplier,

      amount:
        Number(
          paymentAmount.toFixed(2)
        ),

      paidAmount:
        Number(
          paymentAmount.toFixed(2)
        ),

      payment:
        Number(
          paymentAmount.toFixed(2)
        ),

      paymentMode,

      note: note.trim(),

      date,

      time,

      createdAt:
        Date.now(),

      // VERY IMPORTANT
      paymentType:
        paymentType ===
        "advance"
          ? "advance"
          : "udhari_settlement",
    };

    // =================================================
    // OLD PAYMENTS
    // =================================================

    let oldPayments = [];

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "supplierPayments"
          ) || "[]"
        );

      oldPayments =
        Array.isArray(saved)
          ? saved
          : [];
    } catch {
      oldPayments = [];
    }

    const updatedPayments = [
      paymentRecord,
      ...oldPayments,
    ];

    localStorage.setItem(
      "supplierPayments",
      JSON.stringify(
        updatedPayments
      )
    );

    // =================================================
    // ADVANCE PAYMENT
    // =================================================

    if (
      paymentType === "advance"
    ) {
      let oldAdvances =
        getObject(
          "supplierAdvances"
        );

      const oldAdvance =
        Number(
          oldAdvances[
            supplierKey
          ] || 0
        );

      const newAdvance =
        Number(
          (
            oldAdvance +
            paymentAmount
          ).toFixed(2)
        );

      oldAdvances[
        supplierKey
      ] = newAdvance;

      localStorage.setItem(
        "supplierAdvances",
        JSON.stringify(
          oldAdvances
        )
      );

      // =================================================
      // EVENT
      // =================================================

      window.dispatchEvent(
        new Event(
          "supplierPaymentUpdated"
        )
      );

      localStorage.setItem(
        "supplierPaymentUpdatedAt",
        String(Date.now())
      );

      alert(
        "✅ Advance Payment Saved Successfully\n\n" +
          "Supplier: " +
          cleanSupplier +
          "\n" +
          "Advance: ₹" +
          paymentAmount.toFixed(2) +
          "\n" +
          "Mode: " +
          paymentMode +
          "\n\n" +
          "पहले Advance: ₹" +
          oldAdvance.toFixed(2) +
          "\n" +
          "अब Advance: ₹" +
          newAdvance.toFixed(2)
      );
    }

    // =================================================
    // UDHARI PAYMENT
    // =================================================

    else {
      window.dispatchEvent(
        new Event(
          "supplierPaymentUpdated"
        )
      );

      localStorage.setItem(
        "supplierPaymentUpdatedAt",
        String(Date.now())
      );

      const newPending =
        Math.max(
          pending -
            paymentAmount,
          0
        );

      alert(
        "✅ Supplier Udhari Payment Saved\n\n" +
          "Supplier: " +
          cleanSupplier +
          "\n" +
          "Payment: ₹" +
          paymentAmount.toFixed(2) +
          "\n" +
          "Mode: " +
          paymentMode +
          "\n\n" +
          "पहले Pending: ₹" +
          pending.toFixed(2) +
          "\n" +
          "अब Pending: ₹" +
          newPending.toFixed(2) +
          "\n\n" +
          "Advance Balance: ₹" +
          currentAdvance.toFixed(2)
      );
    }

    // =================================================
    // RESET
    // =================================================

    setAmount("");
    setNote("");

    setRefresh(
      (value) => value + 1
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={pageStyle}>

      {/* HEADER */}

      <div style={headerStyle}>
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            💳 Supplier Payment
          </h1>

          <p
            style={{
              marginBottom: 0,
            }}
          >
            Shivam Medical ERP
          </p>
        </div>
      </div>

      {/* SUPPLIER */}

      <div style={cardStyle}>
        <h2>
          🏢 Supplier Select करें
        </h2>

        {suppliers.length === 0 ? (
          <div
            style={{
              padding: "15px",
              background:
                "#fff3cd",
              borderRadius: "8px",
              color:
                "#856404",
              marginBottom:
                "15px",
            }}
          >
            ⚠️ कोई Supplier उपलब्ध
            नहीं है।

            <br />

            <small>
              पहले Purchase Entry में
              Supplier Name save करें।
            </small>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(200px,1fr))",
              gap: "10px",
            }}
          >
            {suppliers.map(
              (name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() =>
                    selectSupplier(
                      name
                    )
                  }
                  style={{
                    padding:
                      "12px",
                    textAlign:
                      "left",
                    borderRadius:
                      "8px",
                    border:
                      supplier ===
                      name
                        ? "2px solid #1976d2"
                        : "1px solid #ccc",
                    background:
                      supplier ===
                      name
                        ? "#e3f2fd"
                        : "white",
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  🏢 {name}
                </button>
              )
            )}
          </div>
        )}

        {/* MANUAL SUPPLIER */}

        <input
          type="text"
          value={supplier}
          placeholder="या Supplier Name लिखें"
          onChange={(e) => {
            setSupplier(
              e.target.value
            );

            localStorage.setItem(
              "selectedSupplierForPayment",
              e.target.value
            );
          }}
          style={inputStyle}
        />
      </div>

      {/* SUMMARY */}

      {supplier.trim() && (
        <div style={cardStyle}>

          <h2>
            🏢 {supplier}
          </h2>

          <div
            style={summaryGrid}
          >

            <SummaryBox
              title="Total Purchase"
              value={
                totalPurchase
              }
              color="#1565c0"
            />

            <SummaryBox
              title="Udhari Paid"
              value={
                totalUdhariPaid
              }
              color="#2e7d32"
            />

            <SummaryBox
              title="Pending"
              value={pending}
              color="#d32f2f"
            />

            <SummaryBox
              title="Advance"
              value={
                currentAdvance
              }
              color="#6a1b9a"
            />

          </div>
        </div>
      )}

      {/* PAYMENT FORM */}

      {supplier.trim() && (
        <div style={cardStyle}>

          <h2>
            💰 Payment Entry
          </h2>

          {/* PAYMENT TYPE */}

          <label
            style={{
              fontWeight:
                "bold",
            }}
          >
            Payment Type
          </label>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "10px",
              marginTop:
                "10px",
              marginBottom:
                "15px",
            }}
          >

            <button
              type="button"
              onClick={() =>
                setPaymentType(
                  "udhari"
                )
              }
              style={{
                padding:
                  "13px",
                borderRadius:
                  "8px",
                border:
                  paymentType ===
                  "udhari"
                    ? "2px solid #d32f2f"
                    : "1px solid #ccc",
                background:
                  paymentType ===
                  "udhari"
                    ? "#ffebee"
                    : "white",
                color:
                  paymentType ===
                  "udhari"
                    ? "#c62828"
                    : "#555",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              🔴 Udhari Payment
            </button>

            <button
              type="button"
              onClick={() =>
                setPaymentType(
                  "advance"
                )
              }
              style={{
                padding:
                  "13px",
                borderRadius:
                  "8px",
                border:
                  paymentType ===
                  "advance"
                    ? "2px solid #6a1b9a"
                    : "1px solid #ccc",
                background:
                  paymentType ===
                  "advance"
                    ? "#f3e5f5"
                    : "white",
                color:
                  paymentType ===
                  "advance"
                    ? "#6a1b9a"
                    : "#555",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              💜 Advance Payment
            </button>

          </div>

          {/* INFORMATION */}

          {paymentType ===
          "udhari" ? (
            <div
              style={{
                padding:
                  "11px",
                background:
                  "#ffebee",
                color:
                  "#c62828",
                borderRadius:
                  "7px",
                marginBottom:
                  "14px",
                fontSize:
                  "13px",
              }}
            >
              🔴 यह payment Supplier की
              existing Udhari में से
              कम होगी।

              <br />

              Current Pending:{" "}
              <b>
                ₹
                {pending.toFixed(
                  2
                )}
              </b>
            </div>
          ) : (
            <div
              style={{
                padding:
                  "11px",
                background:
                  "#f3e5f5",
                color:
                  "#6a1b9a",
                borderRadius:
                  "7px",
                marginBottom:
                  "14px",
                fontSize:
                  "13px",
              }}
            >
              💜 यह payment Supplier के
              Advance Balance में जमा होगी।

              <br />

              Current Advance:{" "}
              <b>
                ₹
                {currentAdvance.toFixed(
                  2
                )}
              </b>
            </div>
          )}

          {/* AMOUNT */}

          <label>
            Payment Amount ₹
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            placeholder="Payment Amount"
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            style={inputStyle}
          />

          {/* QUICK BUTTONS */}

          <div
            style={{
              display:
                "flex",
              gap: "8px",
              flexWrap:
                "wrap",
              marginBottom:
                "15px",
            }}
          >

            {paymentType ===
            "udhari" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      pending.toFixed(
                        2
                      )
                    )
                  }
                  style={
                    quickButton
                  }
                >
                  Full Pending
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      Math.min(
                        500,
                        pending
                      ).toFixed(
                        2
                      )
                    )
                  }
                  style={
                    quickButton
                  }
                >
                  ₹500
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      Math.min(
                        1000,
                        pending
                      ).toFixed(
                        2
                      )
                    )
                  }
                  style={
                    quickButton
                  }
                >
                  ₹1000
                </button>
              </>
            )}

            {paymentType ===
            "advance" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      "500"
                    )
                  }
                  style={
                    advanceButton
                  }
                >
                  ₹500 Advance
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      "1000"
                    )
                  }
                  style={
                    advanceButton
                  }
                >
                  ₹1000 Advance
                </button>
              </>
            )}

          </div>

          {/* MODE */}

          <label>
            Payment Mode
          </label>

          <select
            value={
              paymentMode
            }
            onChange={(e) =>
              setPaymentMode(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="Cash">
              💵 Cash
            </option>

            <option value="UPI">
              📱 UPI
            </option>

            <option value="Bank">
              🏦 Bank
            </option>

            <option value="Cheque">
              🧾 Cheque
            </option>

            <option value="Card">
              💳 Card
            </option>
          </select>

          {/* NOTE */}

          <label>
            Note
          </label>

          <input
            type="text"
            value={note}
            placeholder="Payment Note"
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            style={inputStyle}
          />

          {/* SAVE */}

          <button
            type="button"
            onClick={
              savePayment
            }
            disabled={
              paymentType ===
                "udhari" &&
              pending <= 0
            }
            style={{
              ...greenButton,
              background:
                paymentType ===
                "advance"
                  ? "#6a1b9a"
                  : "#2e7d32",
              opacity:
                paymentType ===
                  "advance" ||
                pending > 0
                  ? 1
                  : 0.5,
              cursor:
                paymentType ===
                  "advance" ||
                pending > 0
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {paymentType ===
            "advance"
              ? "💜 Save Advance Payment"
              : "💾 Save Udhari Payment"}
          </button>

        </div>
      )}

      {/* BACK */}

      <button
        type="button"
        onClick={goBack}
        style={backButton}
      >
        ⬅️ Supplier Ledger
      </button>

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
          "15px",
        borderRadius:
          "8px",
        borderLeft:
          `5px solid ${color}`,
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          color:
            "#666",
          fontSize:
            "14px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color,
          fontSize:
            "22px",
          fontWeight:
            "bold",
          marginTop:
            "5px",
        }}
      >
        ₹
        {Number(
          value || 0
        ).toFixed(2)}
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight:
    "100vh",
  padding:
    "15px",
  background:
    "#f2f5f9",
  fontFamily:
    "Arial, sans-serif",
  boxSizing:
    "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#1565c0,#42a5f5)",
  color:
    "white",
  padding:
    "20px",
  borderRadius:
    "12px",
  marginBottom:
    "15px",
};

const cardStyle = {
  background:
    "white",
  padding:
    "18px",
  borderRadius:
    "10px",
  marginBottom:
    "15px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
};

const inputStyle = {
  display:
    "block",
  width:
    "100%",
  boxSizing:
    "border-box",
  padding:
    "12px",
  marginTop:
    "10px",
  marginBottom:
    "15px",
  border:
    "1px solid #ccc",
  borderRadius:
    "7px",
  fontSize:
    "16px",
};

const summaryGrid = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(160px,1fr))",
  gap:
    "10px",
};

const greenButton = {
  width:
    "100%",
  padding:
    "14px",
  color:
    "white",
  border:
    "none",
  borderRadius:
    "7px",
  fontSize:
    "16px",
  fontWeight:
    "bold",
};

const quickButton = {
  padding:
    "8px 12px",
  background:
    "#e3f2fd",
  color:
    "#1565c0",
  border:
    "1px solid #90caf9",
  borderRadius:
    "6px",
  cursor:
    "pointer",
  fontWeight:
    "bold",
};

const advanceButton = {
  padding:
    "8px 12px",
  background:
    "#f3e5f5",
  color:
    "#6a1b9a",
  border:
    "1px solid #ce93d8",
  borderRadius:
    "6px",
  cursor:
    "pointer",
  fontWeight:
    "bold",
};

const backButton = {
  width:
    "100%",
  padding:
    "13px",
  background:
    "#555",
  color:
    "white",
  border:
    "none",
  borderRadius:
    "7px",
  fontSize:
    "16px",
  cursor:
    "pointer",
};

export default SupplierPayment;