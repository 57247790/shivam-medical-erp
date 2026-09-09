import React from "react";

function TodaySummary({ type, goBack }) {
  const today = new Date().toLocaleDateString();

  const getData = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  };

  const bills = getData("bills");
  const sales = getData("sales");
  const purchases = getData("purchaseHistory");

  const todayBills = bills.filter(
    (item) => item.date === today
  );

  const todaySales = sales.filter(
    (item) => item.date === today
  );

  const todayPurchases = purchases.filter(
    (item) => item.date === today
  );

  const saleAmount = todaySales.reduce(
    (sum, item) =>
      sum + Number(item.saleAmount || 0),
    0
  );

  const profit = todaySales.reduce(
    (sum, item) =>
      sum + Number(item.profit || 0),
    0
  );

  const credit = todayBills.reduce(
    (sum, item) =>
      sum + Number(item.pendingAmount || 0),
    0
  );

  const purchaseAmount = todayPurchases.reduce(
    (sum, item) => {
      const amount =
        Number(item.purchaseAmount || 0);

      if (amount > 0) {
        return sum + amount;
      }

      return (
        sum +
        Number(item.quantity || 0) *
          Number(
            item.purchaseRate ||
              item.rate ||
              0
          )
      );
    },
    0
  );

  const saleQty = todaySales.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  // =====================================
  // TITLE
  // =====================================

  let title = "";

  if (type === "bills") {
    title = "🧾 आज के Bills";
  }

  if (type === "sale") {
    title = "💰 आज की Sale";
  }

  if (type === "profit") {
    title = "📈 आज का Profit";
  }

  if (type === "credit") {
    title = "💳 आज की Udhari";
  }

  if (type === "purchase") {
    title = "🛒 आज की Purchase";
  }

  if (type === "saleQty") {
    title = "📦 आज की Sale Quantity";
  }

  // =====================================
  // BILL DETAILS
  // =====================================

  if (type === "bills") {
    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <p>
          📅 Date: <b>{today}</b>
        </p>

        <h3>
          Total Bills: {todayBills.length}
        </h3>

        {todayBills.length === 0 ? (
          <p>आज कोई Bill नहीं है।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Pending</th>
                </tr>
              </thead>

              <tbody>
                {todayBills.map((bill, index) => (
                  <tr key={index}>
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

                    <td style={{ color: "red" }}>
                      ₹
                      {Number(
                        bill.pendingAmount || 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // SALE DETAILS
  // =====================================

  if (type === "sale") {
    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <p>
          📅 Date: <b>{today}</b>
        </p>

        <h3>
          💰 Total Sale: ₹
          {saleAmount.toFixed(2)}
        </h3>

        {todaySales.length === 0 ? (
          <p>आज कोई Sale नहीं हुई।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Medicine</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Sale Rate</th>
                  <th>Sale Amount</th>
                </tr>
              </thead>

              <tbody>
                {todaySales.map((sale, index) => (
                  <tr key={index}>
                    <td>
                      {sale.billNumber || "-"}
                    </td>

                    <td>
                      {sale.medicine || "-"}
                    </td>

                    <td>
                      {sale.customer || "-"}
                    </td>

                    <td>
                      {sale.quantity || 0}
                    </td>

                    <td>
                      ₹
                      {Number(
                        sale.saleRate || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        sale.saleAmount || 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // PROFIT DETAILS
  // =====================================

  if (type === "profit") {
    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <h3 style={{ color: "green" }}>
          📈 Total Profit: ₹
          {profit.toFixed(2)}
        </h3>

        {todaySales.length === 0 ? (
          <p>आज कोई Sale नहीं हुई।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Purchase Rate</th>
                  <th>Sale Rate</th>
                  <th>Profit</th>
                </tr>
              </thead>

              <tbody>
                {todaySales.map((sale, index) => (
                  <tr key={index}>
                    <td>
                      {sale.medicine || "-"}
                    </td>

                    <td>
                      {sale.quantity || 0}
                    </td>

                    <td>
                      ₹
                      {Number(
                        sale.purchaseRate || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        sale.saleRate || 0
                      ).toFixed(2)}
                    </td>

                    <td
                      style={{
                        color: "green",
                        fontWeight: "bold",
                      }}
                    >
                      ₹
                      {Number(
                        sale.profit || 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // CREDIT DETAILS
  // =====================================

  if (type === "credit") {
    const creditBills = todayBills.filter(
      (bill) =>
        Number(
          bill.pendingAmount || 0
        ) > 0
    );

    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <h3 style={{ color: "red" }}>
          💳 Total Udhari: ₹
          {credit.toFixed(2)}
        </h3>

        {creditBills.length === 0 ? (
          <p>आज कोई Udhari नहीं है।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Pending</th>
                </tr>
              </thead>

              <tbody>
                {creditBills.map((bill, index) => (
                  <tr key={index}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // PURCHASE DETAILS
  // =====================================

  if (type === "purchase") {
    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <h3>
          🛒 Total Purchase: ₹
          {purchaseAmount.toFixed(2)}
        </h3>

        {todayPurchases.length === 0 ? (
          <p>आज कोई Purchase नहीं है।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Purchase Amount</th>
                </tr>
              </thead>

              <tbody>
                {todayPurchases.map(
                  (purchase, index) => (
                    <tr key={index}>
                      <td>
                        {purchase.medicine || "-"}
                      </td>

                      <td>
                        {purchase.supplier ||
                          purchase.company ||
                          "-"}
                      </td>

                      <td>
                        {purchase.quantity || 0}
                      </td>

                      <td>
                        ₹
                        {Number(
                          purchase.purchaseRate ||
                            purchase.rate ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td>
                        ₹
                        {Number(
                          purchase.purchaseAmount ||
                            Number(
                              purchase.quantity || 0
                            ) *
                              Number(
                                purchase.purchaseRate ||
                                  purchase.rate ||
                                  0
                              )
                        ).toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // SALE QUANTITY
  // =====================================

  if (type === "saleQty") {
    return (
      <div style={pageStyle}>
        <button onClick={goBack} style={backButton}>
          ⬅️ Dashboard
        </button>

        <h2>{title}</h2>

        <h3>
          📦 आज की Sale Qty: {saleQty}
        </h3>

        {todaySales.length === 0 ? (
          <p>आज कोई medicine नहीं बिकी।</p>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Company</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>
                {todaySales.map((sale, index) => (
                  <tr key={index}>
                    <td>
                      {sale.medicine || "-"}
                    </td>

                    <td>
                      {sale.company || "-"}
                    </td>

                    <td>
                      {sale.quantity || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={goBack} style={backButton}>
        ⬅️ Dashboard
      </button>

      <h2>Data नहीं मिली</h2>
    </div>
  );
}

// =====================================
// STYLES
// =====================================

const pageStyle = {
  minHeight: "100vh",
  padding: "20px",
  background: "#f2f5f9",
  fontFamily: "Arial, sans-serif",
};

const backButton = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  marginBottom: "20px",
};

const tableContainer = {
  overflowX: "auto",
};

const tableStyle = {
  borderCollapse: "collapse",
  width: "100%",
  minWidth: "700px",
};

export default TodaySummary;