function TodayCredit({ goBack }) {
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

  // आज के केवल उधारी वाले bills
  const todayCreditBills = bills.filter(
    (bill) =>
      bill.date === today &&
      Number(bill.pendingAmount || 0) > 0
  );

  // Total Udhari
  const totalPending = todayCreditBills.reduce(
    (sum, bill) =>
      sum + Number(bill.pendingAmount || 0),
    0
  );

  // Total Qty
  const totalQuantity = todayCreditBills.reduce(
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
          background: "#d32f2f",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          💳 आज की Udhari
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
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Summary
          icon="💳"
          title="Udhari Bills"
          value={todayCreditBills.length}
        />

        <Summary
          icon="📦"
          title="Total Qty"
          value={totalQuantity}
        />

        <Summary
          icon="💰"
          title="Total Udhari"
          value={
            "₹" + totalPending.toFixed(2)
          }
          red
        />
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <h2>
          📋 आज की सभी Udhari
        </h2>

        {todayCreditBills.length === 0 ? (
          <p
            style={{
              color: "green",
              fontWeight: "bold",
            }}
          >
            ✅ आज कोई Udhari नहीं है।
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
                <th>Total</th>
                <th>Paid</th>
                <th>Udhari</th>
              </tr>
            </thead>

            <tbody>
              {todayCreditBills.map(
                (bill, billIndex) => {
                  const items =
                    Array.isArray(bill.items)
                      ? bill.items
                      : [];

                  // पुराने bill में items नहीं हैं
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

                        <td
                          style={{
                            color: "red",
                            fontWeight: "bold",
                          }}
                        >
                          ₹
                          {Number(
                            bill.pendingAmount || 0
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
                        {itemIndex === 0 && (
                          <>
                            <td
                              rowSpan={items.length}
                            >
                              {bill.billNumber ||
                                "-"}
                            </td>

                            <td
                              rowSpan={items.length}
                            >
                              {bill.customer ||
                                "-"}
                            </td>

                            <td
                              rowSpan={items.length}
                            >
                              {bill.mobile ||
                                "-"}
                            </td>

                            <td
                              rowSpan={items.length}
                            >
                              {bill.time || "-"}
                            </td>
                          </>
                        )}

                        <td>
                          {item.medicine || "-"}
                        </td>

                        <td
                          style={{
                            fontWeight: "bold",
                          }}
                        >
                          {Number(
                            item.quantity || 0
                          )}
                        </td>

                        {itemIndex === 0 && (
                          <>
                            <td
                              rowSpan={items.length}
                            >
                              ₹
                              {Number(
                                bill.total || 0
                              ).toFixed(2)}
                            </td>

                            <td
                              rowSpan={items.length}
                            >
                              ₹
                              {Number(
                                bill.paidAmount || 0
                              ).toFixed(2)}
                            </td>

                            <td
                              rowSpan={items.length}
                              style={{
                                color: "red",
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
  red,
}) {
  return (
    <div
      style={{
        background: red
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
          color: red ? "red" : "#222",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default TodayCredit;