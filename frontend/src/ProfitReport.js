import { useState } from "react";

function ProfitReport({ goBack }) {
  const [sales] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("sales")
        ) || []
      );
    } catch (error) {
      return [];
    }
  });

  const [search, setSearch] = useState("");

  // =====================================
  // TOTAL SALE
  // =====================================

  const totalSale = sales.reduce(
    (sum, sale) =>
      sum +
      Number(
        sale.saleAmount || 0
      ),
    0
  );

  // =====================================
  // TOTAL PURCHASE COST
  // =====================================

  const totalPurchase = sales.reduce(
    (sum, sale) =>
      sum +
      Number(
        sale.purchaseAmount || 0
      ),
    0
  );

  // =====================================
  // TOTAL PROFIT
  // =====================================

  const totalProfit = sales.reduce(
    (sum, sale) =>
      sum +
      Number(
        sale.profit || 0
      ),
    0
  );

  // =====================================
  // TODAY
  // =====================================

  const today =
    new Date().toLocaleDateString();

  const todaySales = sales
    .filter(
      (sale) =>
        sale.date === today
    )
    .reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.saleAmount || 0
        ),
      0
    );

  const todayPurchase = sales
    .filter(
      (sale) =>
        sale.date === today
    )
    .reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.purchaseAmount || 0
        ),
      0
    );

  const todayProfit = sales
    .filter(
      (sale) =>
        sale.date === today
    )
    .reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.profit || 0
        ),
      0
    );

  // =====================================
  // SEARCH
  // =====================================

  const filteredSales =
    sales.filter((sale) => {
      const medicine =
        String(
          sale.medicine || ""
        ).toLowerCase();

      const company =
        String(
          sale.company || ""
        ).toLowerCase();

      const customer =
        String(
          sale.customer || ""
        ).toLowerCase();

      const searchText =
        search.toLowerCase();

      return (
        medicine.includes(
          searchText
        ) ||
        company.includes(
          searchText
        ) ||
        customer.includes(
          searchText
        )
      );
    });

  // =====================================
  // LATEST FIRST
  // =====================================

  const latestSales =
    [...filteredSales].reverse();

  // =====================================
  // PRINT REPORT
  // =====================================

  const printReport = () => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

    if (!printWindow) {
      alert(
        "Print window open nahi hui. Browser popup allow kare."
      );
      return;
    }

    printWindow.document.write(`
      <html>

        <head>

          <title>
            Shivam Medical Profit Report
          </title>

          <style>

            body {
              font-family: Arial;
              padding: 20px;
            }

            h1,
            h2 {
              text-align: center;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #eee;
            }

          </style>

        </head>

        <body>

          <h1>
            Shivam Medical Store
          </h1>

          <p class="center">
            Hatuniya, District Mandsaur
            <br />
            Mo. 9617122217
          </p>

          <h2>
            📈 Profit Report
          </h2>

          <hr />

          <h3>
            Total Sale:
            ₹${totalSale.toFixed(2)}
          </h3>

          <h3>
            Total Purchase Cost:
            ₹${totalPurchase.toFixed(2)}
          </h3>

          <h2>
            Total Profit:
            ₹${totalProfit.toFixed(2)}
          </h2>

          <hr />

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Purchase Rate</th>
                <th>Sale Rate</th>
                <th>Sale Amount</th>
                <th>Purchase Cost</th>
                <th>Profit</th>
              </tr>

            </thead>

            <tbody>

              ${latestSales
                .map(
                  (sale) => `
                    <tr>

                      <td>
                        ${
                          sale.date ||
                          "-"
                        }
                      </td>

                      <td>
                        ${
                          sale.medicine ||
                          "-"
                        }
                      </td>

                      <td>
                        ${
                          sale.quantity ||
                          0
                        }
                      </td>

                      <td>
                        ₹${
                          sale.purchaseRate ||
                          0
                        }
                      </td>

                      <td>
                        ₹${
                          sale.saleRate ||
                          0
                        }
                      </td>

                      <td>
                        ₹${
                          sale.saleAmount ||
                          0
                        }
                      </td>

                      <td>
                        ₹${
                          sale.purchaseAmount ||
                          0
                        }
                      </td>

                      <td>
                        ₹${
                          sale.profit ||
                          0
                        }
                      </td>

                    </tr>
                  `
                )
                .join("")}

            </tbody>

          </table>

          <br />

          <h2>
            Total Profit:
            ₹${totalProfit.toFixed(2)}
          </h2>

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // =====================================
  // SCREEN
  // =====================================

  return (
    <div
      style={{
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      <h2>
        📈 Profit Report
      </h2>

      <button
        onClick={goBack}
        style={{
          padding:
            "8px 15px",
          marginBottom:
            "15px",
        }}
      >
        ⬅️ Back
      </button>

      <button
        onClick={printReport}
        style={{
          padding:
            "8px 15px",
          marginLeft:
            "10px",
          marginBottom:
            "15px",
        }}
      >
        🖨️ Print Report
      </button>

      <hr />

      {/* =================================
          SUMMARY
      ================================= */}

      <h2>
        📊 Overall Summary
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >

        <div
          style={{
            padding: "20px",
            border:
              "2px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <h3>
            💰 Total Sale
          </h3>

          <h2>
            ₹
            {totalSale.toFixed(
              2
            )}
          </h2>
        </div>

        <div
          style={{
            padding: "20px",
            border:
              "2px solid #ddd",
            borderRadius:
              "10px",
          }}
        >
          <h3>
            🛒 Purchase Cost
          </h3>

          <h2>
            ₹
            {totalPurchase.toFixed(
              2
            )}
          </h2>
        </div>

        <div
          style={{
            padding: "20px",
            border:
              "2px solid #ddd",
            borderRadius:
              "10px",
            background:
              "#e8f5e9",
          }}
        >
          <h3>
            📈 Total Profit
          </h3>

          <h2
            style={{
              color: "green",
            }}
          >
            ₹
            {totalProfit.toFixed(
              2
            )}
          </h2>
        </div>

      </div>

      <hr />

      {/* =================================
          TODAY
      ================================= */}

      <h2>
        📅 Today's Report
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
          }}
        >
          <b>
            Today's Sale
          </b>

          <h3>
            ₹
            {todaySales.toFixed(
              2
            )}
          </h3>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
          }}
        >
          <b>
            Today's Purchase
          </b>

          <h3>
            ₹
            {todayPurchase.toFixed(
              2
            )}
          </h3>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
            background:
              "#e8f5e9",
          }}
        >
          <b>
            Today's Profit
          </b>

          <h3
            style={{
              color: "green",
            }}
          >
            ₹
            {todayProfit.toFixed(
              2
            )}
          </h3>
        </div>

      </div>

      <hr />

      {/* =================================
          SEARCH
      ================================= */}

      <input
        type="text"
        placeholder="🔍 Search Medicine / Company / Customer"
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        style={{
          padding: "10px",
          width: "320px",
          maxWidth: "100%",
        }}
      />

      <hr />

      {/* =================================
          TABLE
      ================================= */}

      {latestSales.length === 0 ? (
        <h3>
          No Profit Records Found
        </h3>
      ) : (
        <div
          style={{
            overflowX:
              "auto",
          }}
        >

          <table
            border="1"
            cellPadding="8"
            style={{
              borderCollapse:
                "collapse",
              width: "100%",
            }}
          >

            <thead>

              <tr>

                <th>
                  Date
                </th>

                <th>
                  Time
                </th>

                <th>
                  Medicine
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Purchase Rate
                </th>

                <th>
                  Sale Rate
                </th>

                <th>
                  Sale Amount
                </th>

                <th>
                  Purchase Cost
                </th>

                <th>
                  Profit
                </th>

              </tr>

            </thead>

            <tbody>

              {latestSales.map(
                (
                  sale,
                  index
                ) => (
                  <tr
                    key={index}
                  >

                    <td>
                      {
                        sale.date ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        sale.time ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        sale.medicine ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        sale.quantity ||
                        0
                      }
                    </td>

                    <td>
                      ₹
                      {
                        sale.purchaseRate ||
                        0
                      }
                    </td>

                    <td>
                      ₹
                      {
                        sale.saleRate ||
                        0
                      }
                    </td>

                    <td>
                      ₹
                      {
                        Number(
                          sale.saleAmount ||
                            0
                        ).toFixed(
                          2
                        )
                      }
                    </td>

                    <td>
                      ₹
                      {
                        Number(
                          sale.purchaseAmount ||
                            0
                        ).toFixed(
                          2
                        )
                      }
                    </td>

                    <td
                      style={{
                        color:
                          Number(
                            sale.profit ||
                              0
                          ) >= 0
                            ? "green"
                            : "red",
                        fontWeight:
                          "bold",
                      }}
                    >
                      ₹
                      {
                        Number(
                          sale.profit ||
                            0
                        ).toFixed(
                          2
                        )
                      }
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

export default ProfitReport;