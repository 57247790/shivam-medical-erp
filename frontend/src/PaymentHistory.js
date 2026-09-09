
import React, { useMemo, useState } from "react";

function PaymentHistory({ goBack }) {
  // =====================================================
  // LOAD PAYMENT HISTORY
  // =====================================================

  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem("paymentHistory");

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(
        "Payment history load error:",
        error
      );

      return [];
    }
  });

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] = useState("");

  // =====================================================
  // TYPE FILTER
  // =====================================================

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  // =====================================================
  // PAYMENT MODE FILTER
  // =====================================================

  const [modeFilter, setModeFilter] =
    useState("ALL");

  // =====================================================
  // DELETE PAYMENT
  // =====================================================

  const deletePayment = (paymentToDelete) => {
    if (!paymentToDelete) return;

    const confirmDelete = window.confirm(
      "क्या आप यह payment history delete करना चाहते हैं?"
    );

    if (!confirmDelete) return;

    const updatedPayments = payments.filter(
      (payment) =>
        payment !== paymentToDelete
    );

    setPayments(updatedPayments);

    localStorage.setItem(
      "paymentHistory",
      JSON.stringify(updatedPayments)
    );
  };

  // =====================================================
  // SAFE NUMBER
  // =====================================================

  const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  // =====================================================
  // PAYMENT TYPE
  // =====================================================

  const getPaymentType = (payment) => {
    const type = String(
      payment.type ||
        payment.paymentType ||
        payment.entryType ||
        ""
    )
      .trim()
      .toUpperCase();

    if (
      type.includes("ADVANCE") ||
      type.includes("एडवांस")
    ) {
      return "ADVANCE";
    }

    if (
      type.includes("PARTIAL") ||
      type.includes("PART") ||
      type.includes("कुछ")
    ) {
      return "PARTIAL";
    }

    if (
      type.includes("UDHARI") ||
      type.includes("CREDIT") ||
      type.includes("RECEIVED") ||
      type.includes("PAYMENT")
    ) {
      return "UDHARI";
    }

    return type || "PAYMENT";
  };

  // =====================================================
  // PAYMENT MODE
  // =====================================================

  const getPaymentMode = (payment) => {
    return (
      payment.paymentMode ||
      payment.mode ||
      payment.method ||
      payment.payMode ||
      "-"
    );
  };

  // =====================================================
  // DATE
  // =====================================================

  const getDate = (payment) => {
    return (
      payment.date ||
      payment.paymentDate ||
      payment.createdAt ||
      "-"
    );
  };

  // =====================================================
  // TIME
  // =====================================================

  const getTime = (payment) => {
    return (
      payment.time ||
      payment.paymentTime ||
      "-"
    );
  };

  // =====================================================
  // BILL NUMBER
  // =====================================================

  const getBillNumber = (payment) => {
    return (
      payment.billNo ||
      payment.billNumber ||
      payment.invoiceNo ||
      payment.invoiceNumber ||
      payment.billId ||
      "-"
    );
  };

  // =====================================================
  // CUSTOMER SEARCH + FILTER
  // =====================================================

  const filteredPayments = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return payments.filter((payment) => {
      const customer = String(
        payment.customer ||
          payment.customerName ||
          ""
      ).toLowerCase();

      const mobile = String(
        payment.mobile ||
          payment.customerMobile ||
          ""
      ).toLowerCase();

      const billNumber = String(
        getBillNumber(payment)
      ).toLowerCase();

      const paymentMode = String(
        getPaymentMode(payment)
      ).toLowerCase();

      const paymentType =
        getPaymentType(payment);

      const matchesSearch =
        !searchText ||
        customer.includes(searchText) ||
        mobile.includes(searchText) ||
        billNumber.includes(searchText) ||
        paymentMode.includes(searchText);

      const matchesType =
        typeFilter === "ALL" ||
        paymentType === typeFilter;

      const matchesMode =
        modeFilter === "ALL" ||
        String(
          getPaymentMode(payment)
        ).toUpperCase() ===
          modeFilter.toUpperCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesMode
      );
    });
  }, [
    payments,
    search,
    typeFilter,
    modeFilter,
  ]);

  // =====================================================
  // TOTAL RECEIVED
  // =====================================================

  const totalReceived =
    filteredPayments.reduce(
      (sum, payment) =>
        sum +
        toNumber(
          payment.amount ||
            payment.paidAmount ||
            payment.receivedAmount
        ),
      0
    );

  // =====================================================
  // TOTAL UDHARI PAYMENT
  // =====================================================

  const totalUdhari =
    filteredPayments
      .filter(
        (payment) =>
          getPaymentType(payment) ===
          "UDHARI"
      )
      .reduce(
        (sum, payment) =>
          sum +
          toNumber(
            payment.amount ||
              payment.paidAmount ||
              payment.receivedAmount
          ),
        0
      );

  // =====================================================
  // TOTAL PARTIAL PAYMENT
  // =====================================================

  const totalPartial =
    filteredPayments
      .filter(
        (payment) =>
          getPaymentType(payment) ===
          "PARTIAL"
      )
      .reduce(
        (sum, payment) =>
          sum +
          toNumber(
            payment.amount ||
              payment.paidAmount ||
              payment.receivedAmount
          ),
        0
      );

  // =====================================================
  // TOTAL ADVANCE
  // =====================================================

  const totalAdvance =
    filteredPayments
      .filter(
        (payment) =>
          getPaymentType(payment) ===
          "ADVANCE"
      )
      .reduce(
        (sum, payment) =>
          sum +
          toNumber(
            payment.amount ||
              payment.paidAmount ||
              payment.receivedAmount
          ),
        0
      );

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    setSearch("");
    setTypeFilter("ALL");
    setModeFilter("ALL");
  };

  // =====================================================
  // STYLES
  // =====================================================

  const pageStyle = {
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "15px",
    background: "#f4f6f8",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "15px",
    boxShadow:
      "0 3px 12px rgba(0,0,0,0.08)",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const thStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    background: "#f5f5f5",
    whiteSpace: "nowrap",
    textAlign: "left",
  };

  const tdStyle = {
    padding: "9px",
    border: "1px solid #ddd",
    verticalAlign: "middle",
  };

  // =====================================================
  // PAYMENT TYPE BADGE
  // =====================================================

  const renderType = (payment) => {
    const type = getPaymentType(payment);

    let background = "#eeeeee";
    let color = "#333333";
    let text = "💰 PAYMENT";

    if (type === "ADVANCE") {
      background = "#fff3e0";
      color = "#e65100";
      text = "💵 ADVANCE";
    }

    if (type === "PARTIAL") {
      background = "#e3f2fd";
      color = "#1565c0";
      text = "💳 PARTIAL";
    }

    if (type === "UDHARI") {
      background = "#e8f5e9";
      color = "#2e7d32";
      text = "📒 UDHARI";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "5px 8px",
          borderRadius: "6px",
          background,
          color,
          fontSize: "12px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    );
  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div style={pageStyle}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              💰 Payment History
            </h2>

            <div
              style={{
                marginTop: "5px",
                color: "#666",
                fontSize: "13px",
              }}
            >
              Customer के सभी payment records
            </div>
          </div>

          <button
            type="button"
            onClick={goBack}
            style={{
              ...buttonStyle,
              background: "#555",
              color: "white",
            }}
          >
            ⬅️ Back
          </button>
        </div>
      </div>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div style={cardStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "7px",
              }}
            >
              🔍 Search
            </label>

            <input
              type="text"
              placeholder="Customer / Mobile / Bill No"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "7px",
              }}
            >
              📌 Payment Type
            </label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Payments
              </option>

              <option value="UDHARI">
                Udhari Payment
              </option>

              <option value="PARTIAL">
                Partial Payment
              </option>

              <option value="ADVANCE">
                Advance Payment
              </option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "7px",
              }}
            >
              💳 Payment Mode
            </label>

            <select
              value={modeFilter}
              onChange={(e) =>
                setModeFilter(e.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Modes
              </option>

              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK">
                Bank
              </option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={clearSearch}
          style={{
            ...buttonStyle,
            marginTop: "12px",
            background: "#eeeeee",
            color: "#333",
          }}
        >
          🔄 Clear Filter
        </button>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            ...cardStyle,
            marginBottom: 0,
            borderLeft: "5px solid #2e7d32",
          }}
        >
          <div
            style={{
              color: "#666",
              fontSize: "13px",
            }}
          >
            💰 Total Received
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#2e7d32",
              marginTop: "5px",
            }}
          >
            ₹{totalReceived.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginBottom: 0,
            borderLeft: "5px solid #1565c0",
          }}
        >
          <div
            style={{
              color: "#666",
              fontSize: "13px",
            }}
          >
            📒 Udhari Payment
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#1565c0",
              marginTop: "5px",
            }}
          >
            ₹{totalUdhari.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginBottom: 0,
            borderLeft: "5px solid #e65100",
          }}
        >
          <div
            style={{
              color: "#666",
              fontSize: "13px",
            }}
          >
            💵 Advance
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#e65100",
              marginTop: "5px",
            }}
          >
            ₹{totalAdvance.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginBottom: 0,
            borderLeft: "5px solid #7b1fa2",
          }}
        >
          <div
            style={{
              color: "#666",
              fontSize: "13px",
            }}
          >
            💳 Partial Payment
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#7b1fa2",
              marginTop: "5px",
            }}
          >
            ₹{totalPartial.toFixed(2)}
          </div>
        </div>
      </div>

      {/* =================================================
          HISTORY TABLE
      ================================================= */}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
            }}
          >
            📋 Payment Records
          </h3>

          <strong
            style={{
              color: "#555",
            }}
          >
            {filteredPayments.length} Records
          </strong>
        </div>

        {filteredPayments.length === 0 ? (
          <div
            style={{
              padding: "35px 10px",
              textAlign: "center",
              color: "#777",
            }}
          >
            <div
              style={{
                fontSize: "35px",
              }}
            >
              📭
            </div>

            <h3>
              No Payment History
            </h3>

            <div>
              Search या filter बदलकर देखें।
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              width: "100%",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                minWidth: "950px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    #
                  </th>

                  <th style={thStyle}>
                    Customer
                  </th>

                  <th style={thStyle}>
                    Mobile
                  </th>

                  <th style={thStyle}>
                    Bill No
                  </th>

                  <th style={thStyle}>
                    Type
                  </th>

                  <th style={thStyle}>
                    Mode
                  </th>

                  <th style={thStyle}>
                    Amount
                  </th>

                  <th style={thStyle}>
                    Date
                  </th>

                  <th style={thStyle}>
                    Time
                  </th>

                  <th style={thStyle}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map(
                  (payment, index) => {
                    const amount =
                      toNumber(
                        payment.amount ||
                          payment.paidAmount ||
                          payment.receivedAmount
                      );

                    return (
                      <tr
                        key={
                          payment.id ||
                          payment.paymentId ||
                          `${getBillNumber(
                            payment
                          )}-${getDate(
                            payment
                          )}-${index}`
                        }
                      >
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {payment.customer ||
                            payment.customerName ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {payment.mobile ||
                            payment.customerMobile ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {getBillNumber(
                            payment
                          )}
                        </td>

                        <td style={tdStyle}>
                          {renderType(
                            payment
                          )}
                        </td>

                        <td style={tdStyle}>
                          {getPaymentMode(
                            payment
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                            color:
                              "#2e7d32",
                          }}
                        >
                          ₹
                          {amount.toFixed(
                            2
                          )}
                        </td>

                        <td style={tdStyle}>
                          {getDate(
                            payment
                          )}
                        </td>

                        <td style={tdStyle}>
                          {getTime(
                            payment
                          )}
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              deletePayment(
                                payment
                              )
                            }
                            style={{
                              ...buttonStyle,
                              background:
                                "#ffebee",
                              color:
                                "#d32f2f",
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
          </div>
        )}
      </div>

      {/* =================================================
          BACK BUTTON
      ================================================= */}

      <button
        type="button"
        onClick={goBack}
        style={{
          width: "100%",
          padding: "13px",
          background: "#555",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ⬅️ Back To Dashboard
      </button>
    </div>
  );
}

export default PaymentHistory;