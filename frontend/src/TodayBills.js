function TodayBills({ goBack }) {
  const today = new Date().toLocaleDateString();

  let bills = [];

  try {
    bills =
      JSON.parse(
        localStorage.getItem("bills") || "[]"
      ) || [];
  } catch (error) {
    bills = [];
  }

  const todayBills = bills.filter(
    (bill) => bill.date === today
  );

  // ================================
  // TOTAL QTY
  // ================================

  const totalQuantity = todayBills.reduce(
    (sum, bill) => {
      const items = Array.isArray(bill.items)
        ? bill.items
        : [];

      return (
        sum +
        items.reduce(
          (itemSum, item) =>
            itemSum +
            Number(item.quantity || 0),
          0
        )
      );
    },
    0
  );

  // ================================
  // TOTAL AMOUNT
  // ================================

  const totalAmount = todayBills.reduce(
    (sum, bill) =>
      sum + Number(bill.total || 0),
    0
  );

  // ================================
  // PAID
  // ================================

  const totalPaid = todayBills.reduce(
    (sum, bill) =>
      sum + Number(bill.paidAmount || 0),
    0
  );

  // ================================
  // PENDING
  // ================================

  const totalPending = todayBills.reduce(
    (sum, bill) =>
      sum + Number(bill.pendingAmount || 0),
    0
  );

  // ================================
  // PROFIT
  // ================================

  const totalProfit = todayBills.reduce(
    (sum, bill) =>
      sum + Number(bill.profit || 0),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background: "#1976d2",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          🧾 आज के Bills
        </h1>

        <p>
          📅 {today}
        </p>
      </div>

      {/* BACK */}

      <button
        onClick={goBack}
        style={{
          padding: "12px 20px",
          marginBottom: "20px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        ⬅️ Dashboard
      </button>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Summary
          icon="🧾"
          title="Bills"
          value={todayBills.length}
        />

        <Summary
          icon="📦"
          title="Total Qty"
          value={totalQuantity}
        />

        <Summary
          icon="💰"
          title="Total"
          value={
            "₹" + totalAmount.toFixed(2)
          }
        />

        <Summary
          icon="✅"
          title="Paid"
          value={
            "₹" + totalPaid.toFixed(2)
          }
          green
        />

        <Summary
          icon="💳"
          title="Udhari"
          value={
            "₹" + totalPending.toFixed(2)
          }
          red={totalPending > 0}
        />

        <Summary
          icon="📈"
          title="Profit"
          value={
            "₹" + totalProfit.toFixed(2)
          }
          green
        />
      </div>

      {/* BILL LIST */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <h2>
          📋 आज के सभी Bills
        </h2>

        {todayBills.length === 0 ? (
          <p>
            आज अभी कोई bill नहीं बना है।
          </p>
        ) : (
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "1100px",
            }}
          >
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Time</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Sale Rate</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Udhari</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {todayBills.map(
                (bill, billIndex) => {
                  const items =
                    Array.isArray(bill.items)
                      ? bill.items
                      : [];

                  /*
                   * पुराने bill में items नहीं हैं
                   */

                  if (items.length === 0) {
                    return (
                      <tr key={billIndex}>
                        <td>
                          {bill.billNumber || "-"}
                        </td>

                        <td>
                          {bill.customer || "-"}
                        </td>

                        <td>
                          {bill.mobile || "-"}
                        </td>

                        <td>
                          {bill.time || "-"}
                        </td>

                        <td>-</td>

                        <td>0</td>

                        <td>-</td>

                        <td>
                          ₹
                          {Number(
                            bill.total || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          ₹
                          {Number(
                            bill.paidAmount || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          ₹
                          {Number(
                            bill.pendingAmount || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          ₹
                          {Number(
                            bill.profit || 0
                          ).toFixed(2)}
                        </td>
                      </tr>
                    );
                  }

                  return items.map(
                    (item, itemIndex) => (
                      <tr
                        key={
                          billIndex +
                          "-" +
                          itemIndex
                        }
                      >
                        {/* BILL DETAILS */}

                        {itemIndex === 0 && (
                          <>
                            <td
                              rowSpan={
                                items.length
                              }
                            >
                              {bill.billNumber ||
                                "-"}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                            >
                              {bill.customer ||
                                "-"}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                            >
                              {bill.mobile ||
                                "-"}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                            >
                              {bill.time ||
                                "-"}
                            </td>
                          </>
                        )}

                        {/* MEDICINE */}

                        <td>
                          <b>
                            {item.medicine ||
                              "-"}
                          </b>
                        </td>

                        {/* QTY */}

                        <td
                          style={{
                            fontWeight: "bold",
                            fontSize: "17px",
                            color: "#1976d2",
                          }}
                        >
                          {Number(
                            item.quantity || 0
                          )}
                        </td>

                        {/* SALE RATE */}

                        <td>
                          ₹
                          {Number(
                            item.saleRate ||
                              item.mrp ||
                              0
                          ).toFixed(2)}
                        </td>

                        {/* BILL TOTAL */}

                        {itemIndex === 0 && (
                          <>
                            <td
                              rowSpan={
                                items.length
                              }
                            >
                              ₹
                              {Number(
                                bill.total || 0
                              ).toFixed(2)}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                              style={{
                                color: "green",
                                fontWeight:
                                  "bold",
                              }}
                            >
                              ₹
                              {Number(
                                bill.paidAmount ||
                                  0
                              ).toFixed(2)}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                              style={{
                                color:
                                  Number(
                                    bill.pendingAmount ||
                                      0
                                  ) > 0
                                    ? "red"
                                    : "green",
                                fontWeight:
                                  "bold",
                              }}
                            >
                              ₹
                              {Number(
                                bill.pendingAmount ||
                                  0
                              ).toFixed(2)}
                            </td>

                            <td
                              rowSpan={
                                items.length
                              }
                              style={{
                                color: "green",
                                fontWeight:
                                  "bold",
                              }}
                            >
                              ₹
                              {Number(
                                bill.profit || 0
                              ).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =====================================
// SUMMARY
// =====================================

function Summary({
  icon,
  title,
  value,
  green,
  red,
}) {
  return (
    <div
      style={{
        background: green
          ? "#e8f5e9"
          : red
          ? "#ffebee"
          : "white",
        padding: "18px",
        borderRadius: "10px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <h2
        style={{
          color: green
            ? "green"
            : red
            ? "red"
            : "#222",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default TodayBills;