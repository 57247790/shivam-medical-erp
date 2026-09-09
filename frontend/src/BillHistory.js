import React from "react";

function BillHistory({ goBack }) {
  // ========================================
  // LOAD BILLS
  // ========================================

  let bills = [];

  try {
    const savedBills = JSON.parse(
      localStorage.getItem("bills") || "[]"
    );

    bills = Array.isArray(savedBills)
      ? savedBills
      : [];
  } catch (error) {
    bills = [];
  }

  // ========================================
  // DATE + TIME SORT
  // LATEST BILL FIRST
  // ========================================

  const getBillDateTime = (bill) => {
    // अगर timestamp मौजूद है तो उसे प्राथमिकता
    if (bill.createdAt) {
      const timestamp = new Date(
        bill.createdAt
      ).getTime();

      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }

    // Date + Time से sorting
    const dateTime = new Date(
      `${bill.date || ""} ${bill.time || ""}`
    ).getTime();

    if (!isNaN(dateTime)) {
      return dateTime;
    }

    return 0;
  };

  const latestBills = [...bills].sort(
    (a, b) => {
      return (
        getBillDateTime(b) -
        getBillDateTime(a)
      );
    }
  );

  // ========================================
  // PRINT BILL
  // ========================================

  const printBill = (bill) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );

    if (!printWindow) {
      alert(
        "❌ Print window नहीं खुल रही। Browser में pop-up allow करें।"
      );
      return;
    }

    const items = Array.isArray(
      bill.items
    )
      ? bill.items
      : [];

    const itemsHTML = items
      .map(
        (item) => `
          <tr>
            <td>${item.medicine || "-"}</td>

            <td>
              ${Number(
                item.quantity || 0
              )}
            </td>

            <td>
              ₹${Number(
                item.saleRate || 0
              ).toFixed(2)}
            </td>

            <td>
              ₹${Number(
                item.total || 0
              ).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
      <head>

        <title>
          ${bill.billNumber || "Bill"}
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 25px;
            color: #000;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }

          .header h1 {
            margin: 0;
          }

          .header p {
            margin: 5px 0;
          }

          .details {
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          th {
            background: #eee;
          }

          .summary {
            margin-top: 20px;
            text-align: right;
          }

          .summary h2 {
            margin: 8px 0;
          }

          .footer {
            text-align: center;
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 15px;
          }

          @media print {
            button {
              display: none;
            }
          }

        </style>

      </head>

      <body>

        <div class="header">

          <h1>
            🏥 Shivam Medical
          </h1>

          <p>
            Medical Store
          </p>

          <p>
            Bill / Invoice
          </p>

        </div>

        <div class="details">

          <p>
            <b>Bill No:</b>
            ${bill.billNumber || "-"}
          </p>

          <p>
            <b>Customer:</b>
            ${bill.customer || "-"}
          </p>

          <p>
            <b>Mobile:</b>
            ${bill.mobile || "-"}
          </p>

          <p>
            <b>Date:</b>
            ${bill.date || "-"}
          </p>

          <p>
            <b>Time:</b>
            ${bill.time || "-"}
          </p>

        </div>

        <table>

          <thead>

            <tr>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Sale Rate</th>
              <th>Total</th>
            </tr>

          </thead>

          <tbody>

            ${itemsHTML}

          </tbody>

        </table>

        <div class="summary">

          <h2>
            Total:
            ₹${Number(
              bill.total || 0
            ).toFixed(2)}
          </h2>

          <p>
            <b>Paid:</b>
            ₹${Number(
              bill.paidAmount || 0
            ).toFixed(2)}
          </p>

          <p>
            <b>Pending:</b>
            ₹${Number(
              bill.pendingAmount || 0
            ).toFixed(2)}
          </p>

        </div>

        <div class="footer">

          <p>
            धन्यवाद 🙏
          </p>

          <p>
            Shivam Medical
          </p>

        </div>

        <script>

          window.onload = function() {
            window.print();
          };

        </script>

      </body>

      </html>
    `);

    printWindow.document.close();
  };

  // ========================================
  // DELETE BILL
  // ========================================

  const deleteBill = (billIndex) => {
    const bill = latestBills[billIndex];

    const confirmDelete =
      window.confirm(
        `क्या आप Bill ${
          bill.billNumber || ""
        } delete करना चाहते हैं?`
      );

    if (!confirmDelete) {
      return;
    }

    const originalIndex =
      bills.findIndex(
        (item) => item === bill
      );

    if (originalIndex === -1) {
      return;
    }

    const newBills = [...bills];

    newBills.splice(
      originalIndex,
      1
    );

    localStorage.setItem(
      "bills",
      JSON.stringify(newBills)
    );

    window.location.reload();
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ====================================
          BACK
      ==================================== */}

      <button
        onClick={goBack}
        style={{
          padding: "12px 25px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "15px",
          border: "none",
          borderRadius: "7px",
          background: "#1976d2",
          color: "white",
        }}
      >
        ⬅️ Back to Dashboard
      </button>

      {/* ====================================
          HEADER
      ==================================== */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.08)",
        }}
      >

        <h2
          style={{
            marginTop: 0,
          }}
        >
          📋 Bill History
        </h2>

        <p
          style={{
            marginBottom: 0,
            color: "#666",
          }}
        >
          कुल Bills:{" "}
          <b>{latestBills.length}</b>
        </p>

      </div>

      {/* ====================================
          NO BILL
      ==================================== */}

      {latestBills.length === 0 ? (

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h3>
            अभी कोई Bill नहीं है।
          </h3>
        </div>

      ) : (

        latestBills.map(
          (bill, index) => (

            <div
              key={
                bill.createdAt ||
                bill.billNumber ||
                index
              }
              style={{
                border:
                  index === 0
                    ? "2px solid #1976d2"
                    : "1px solid #ccc",

                borderRadius: "12px",

                padding: "18px",

                marginBottom: "20px",

                background: "white",

                boxShadow:
                  "0 3px 10px rgba(0,0,0,0.08)",
              }}
            >

              {/* =================================
                  LATEST LABEL
              ================================= */}

              {index === 0 && (

                <div
                  style={{
                    display: "inline-block",
                    background: "#1976d2",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  🆕 LATEST BILL
                </div>

              )}

              {/* =================================
                  BILL HEADER
              ================================= */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >

                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  🧾{" "}
                  {bill.billNumber ||
                    "Bill"}
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    onClick={() =>
                      printBill(bill)
                    }
                    style={{
                      padding:
                        "10px 18px",
                      fontSize:
                        "15px",
                      cursor:
                        "pointer",
                      border:
                        "none",
                      borderRadius:
                        "6px",
                      background:
                        "#1976d2",
                      color:
                        "white",
                    }}
                  >
                    🖨️ Print Bill
                  </button>

                  <button
                    onClick={() =>
                      deleteBill(index)
                    }
                    style={{
                      padding:
                        "10px 18px",
                      fontSize:
                        "15px",
                      cursor:
                        "pointer",
                      border:
                        "none",
                      borderRadius:
                        "6px",
                      background:
                        "#d32f2f",
                      color:
                        "white",
                    }}
                  >
                    🗑️ Delete
                  </button>

                </div>

              </div>

              {/* =================================
                  CUSTOMER
              ================================= */}

              <div
                style={{
                  marginTop: "15px",
                }}
              >

                <p>
                  <b>Customer:</b>{" "}
                  {bill.customer || "-"}
                </p>

                <p>
                  <b>Mobile:</b>{" "}
                  {bill.mobile || "-"}
                </p>

                <p>
                  <b>Date:</b>{" "}
                  {bill.date || "-"}
                </p>

                <p>
                  <b>Time:</b>{" "}
                  {bill.time || "-"}
                </p>

              </div>

              <hr />

              {/* =================================
                  MEDICINES
              ================================= */}

              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  border="1"
                  cellPadding="8"
                  style={{
                    borderCollapse:
                      "collapse",
                    width: "100%",
                    minWidth:
                      "650px",
                  }}
                >

                  <thead>

                    <tr>

                      <th>
                        Medicine
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Sale Rate
                      </th>

                      <th>
                        Total
                      </th>

                      <th>
                        Profit
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {(Array.isArray(
                      bill.items
                    )
                      ? bill.items
                      : []
                    ).map(
                      (
                        item,
                        itemIndex
                      ) => (

                        <tr
                          key={
                            itemIndex
                          }
                        >

                          <td>
                            {item.medicine ||
                              "-"}
                          </td>

                          <td>
                            {Number(
                              item.quantity ||
                                0
                            )}
                          </td>

                          <td>
                            ₹
                            {Number(
                              item.saleRate ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                          <td>
                            ₹
                            {Number(
                              item.total ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "green",
                              fontWeight:
                                "bold",
                            }}
                          >
                            ₹
                            {Number(
                              item.profit ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

              <hr />

              {/* =================================
                  SUMMARY
              ================================= */}

              <div
                style={{
                  background:
                    "#f8f9fa",
                  padding: "15px",
                  borderRadius:
                    "8px",
                  marginTop:
                    "15px",
                }}
              >

                <h3>
                  💰 Total: ₹
                  {Number(
                    bill.total || 0
                  ).toFixed(2)}
                </h3>

                <p>
                  <b>Paid:</b>{" "}
                  ₹
                  {Number(
                    bill.paidAmount ||
                      0
                  ).toFixed(2)}
                </p>

                <p
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
                  💳 Pending: ₹
                  {Number(
                    bill.pendingAmount ||
                      0
                  ).toFixed(2)}
                </p>

                <p
                  style={{
                    color: "green",
                    fontWeight:
                      "bold",
                  }}
                >
                  📈 Profit: ₹
                  {Number(
                    bill.profit || 0
                  ).toFixed(2)}
                </p>

              </div>

            </div>

          )
        )

      )}

    </div>
  );
}

export default BillHistory;