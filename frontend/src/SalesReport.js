import React, { useMemo, useState } from "react";

function SalesReport({ goBack }) {
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // =====================================================
  // SALES DATA
  // =====================================================

  const sales = useMemo(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("sales") || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }, [refresh]);

  // =====================================================
  // FILTER SALES
  // =====================================================

  const filteredSales = useMemo(() => {
    const text = search.trim().toLowerCase();

    return sales
      .filter((sale) => {
        if (!text) return true;

        return (
          String(sale.billNumber || "")
            .toLowerCase()
            .includes(text) ||
          String(sale.customer || "")
            .toLowerCase()
            .includes(text) ||
          String(sale.mobile || "")
            .toLowerCase()
            .includes(text) ||
          String(sale.medicine || "")
            .toLowerCase()
            .includes(text) ||
          String(sale.barcode || "")
            .toLowerCase()
            .includes(text)
        );
      })
      .filter((sale) => {
        if (!fromDate) return true;

        return String(sale.date || "") >= fromDate;
      })
      .filter((sale) => {
        if (!toDate) return true;

        return String(sale.date || "") <= toDate;
      })
      .sort((a, b) => {
        const aTime = Number(
          a.createdAt || a.id || 0
        );

        const bTime = Number(
          b.createdAt || b.id || 0
        );

        return bTime - aTime;
      });
  }, [
    sales,
    search,
    fromDate,
    toDate,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalUdhari = 0;
    let totalProfit = 0;
    let totalQty = 0;

    filteredSales.forEach((sale) => {
      totalSales += Number(
        sale.saleAmount ||
          sale.amount ||
          sale.total ||
          0
      );

      totalPaid += Number(
        sale.paidAmount || 0
      );

      totalUdhari += Number(
        sale.pendingAmount ||
          sale.udhari ||
          0
      );

      totalProfit += Number(
        sale.profit || 0
      );

      totalQty += Number(
        sale.quantity || 0
      );
    });

    return {
      totalSales,
      totalPaid,
      totalUdhari,
      totalProfit,
      totalQty,
    };
  }, [filteredSales]);

  // =====================================================
  // CLEAR FILTER
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  // =====================================================
  // PRINT REPORT
  // =====================================================

  const printReport = () => {
    if (filteredSales.length === 0) {
      alert(
        "⚠️ Print करने के लिए कोई Sales Record नहीं है।"
      );
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=700"
    );

    if (!printWindow) {
      alert(
        "⚠️ Print Window नहीं खुली। Browser में Popup Allow करें।"
      );
      return;
    }

    const rows = filteredSales
      .map(
        (sale, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${sale.billNumber || "-"}</td>
            <td>${sale.date || "-"}</td>
            <td>${sale.time || "-"}</td>
            <td>${sale.customer || "-"}</td>
            <td>${sale.medicine || "-"}</td>
            <td>${sale.quantity || 0}</td>
            <td>₹${Number(
              sale.saleAmount ||
                sale.amount ||
                sale.total ||
                0
            ).toFixed(2)}</td>
            <td>₹${Number(
              sale.paidAmount || 0
            ).toFixed(2)}</td>
            <td>₹${Number(
              sale.pendingAmount ||
                sale.udhari ||
                0
            ).toFixed(2)}</td>
            <td>${
              sale.paymentMode ||
              (sale.paymentType === "cash"
                ? "नकद"
                : "उधारी")
            }</td>
            <td>₹${Number(
              sale.profit || 0
            ).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Shivam Medical - Sales Report</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #111;
            }

            h1 {
              text-align: center;
              margin: 0;
            }

            .sub {
              text-align: center;
              margin-top: 5px;
              color: #555;
            }

            .summary {
              display: grid;
              grid-template-columns:
                repeat(4, 1fr);
              gap: 10px;
              margin: 20px 0;
            }

            .card {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: center;
              border-radius: 6px;
            }

            .card b {
              display: block;
              font-size: 17px;
              margin-top: 5px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th,
            td {
              border: 1px solid #bbb;
              padding: 5px;
              text-align: left;
            }

            th {
              background: #eeeeee;
            }

            .right {
              text-align: right;
            }

            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 11px;
            }

            @media print {
              body {
                margin: 8px;
              }

              table {
                font-size: 8px;
              }
            }
          </style>
        </head>

        <body>

          <h1>SHIVAM MEDICAL STORE</h1>

          <div class="sub">
            Sales Report
          </div>

          <div class="sub">
            ${
              fromDate || toDate
                ? `Date: ${
                    fromDate || "Start"
                  } to ${
                    toDate || "Today"
                  }`
                : "All Sales"
            }
          </div>

          <div class="summary">

            <div class="card">
              Total Sales
              <b>
                ₹${summary.totalSales.toFixed(2)}
              </b>
            </div>

            <div class="card">
              Paid
              <b>
                ₹${summary.totalPaid.toFixed(2)}
              </b>
            </div>

            <div class="card">
              Udhari
              <b>
                ₹${summary.totalUdhari.toFixed(2)}
              </b>
            </div>

            <div class="card">
              Profit
              <b>
                ₹${summary.totalProfit.toFixed(2)}
              </b>
            </div>

          </div>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Sale</th>
                <th>Paid</th>
                <th>Udhari</th>
                <th>Payment</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <div class="footer">
            Shivam Medical Store • Sales Report
          </div>

          <script>
            window.onload = function() {
              window.print();
            };

            window.onafterprint = function() {
              window.close();
            };
          </script>

        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // =====================================================
  // DELETE ALL SALES
  // =====================================================

  const deleteAllSales = () => {
    const confirmDelete = window.confirm(
      "⚠️ क्या आप सभी Sales Reports Delete करना चाहते हैं?\n\nयह Data वापस नहीं आएगा।"
    );

    if (!confirmDelete) return;

    localStorage.removeItem("sales");

    setRefresh((value) => value + 1);

    alert(
      "✅ सभी Sales Records Delete हो गए।"
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="salesReportPage">

      {/* HEADER */}

      <div className="reportHeader">

        <div>
          <h1>📊 Sales Report</h1>

          <span>
            Shivam Medical ERP
          </span>
        </div>

        <button
          type="button"
          onClick={goBack}
          className="backButton"
        >
          ⬅️ Dashboard
        </button>

      </div>

      {/* SEARCH */}

      <div className="filterBox">

        <div className="filterTitle">
          🔎 Search Sales
        </div>

        <div className="filterGrid">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Bill No / Customer / Medicine / Mobile / Barcode"
            className="filterInput"
          />

          <div>
            <label>
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              className="filterInput"
            />
          </div>

          <div>
            <label>
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              className="filterInput"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="clearButton"
          >
            ✖ Clear
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="summaryGrid">

        <div className="summaryCard salesCard">
          <span>
            💰 Total Sales
          </span>

          <strong>
            ₹{summary.totalSales.toFixed(2)}
          </strong>
        </div>

        <div className="summaryCard paidCard">
          <span>
            💵 Total Paid
          </span>

          <strong>
            ₹{summary.totalPaid.toFixed(2)}
          </strong>
        </div>

        <div className="summaryCard udhariCard">
          <span>
            ⚠️ Total Udhari
          </span>

          <strong>
            ₹{summary.totalUdhari.toFixed(2)}
          </strong>
        </div>

        <div className="summaryCard profitCard">
          <span>
            📈 Total Profit
          </span>

          <strong>
            ₹{summary.totalProfit.toFixed(2)}
          </strong>
        </div>

        <div className="summaryCard qtyCard">
          <span>
            📦 Total Quantity
          </span>

          <strong>
            {summary.totalQty}
          </strong>
        </div>

        <div className="summaryCard billCard">
          <span>
            🧾 Total Bills
          </span>

          <strong>
            {filteredSales.length}
          </strong>
        </div>

      </div>

      {/* ACTIONS */}

      <div className="reportActions">

        <button
          type="button"
          onClick={printReport}
          className="printReportButton"
        >
          🖨️ Print Sales Report
        </button>

        <button
          type="button"
          onClick={() =>
            setRefresh((value) => value + 1)
          }
          className="refreshButton"
        >
          🔄 Refresh
        </button>

      </div>

      {/* TABLE */}

      <div className="tableBox">

        <div className="tableHeader">

          <h2>
            🧾 Sales Records
          </h2>

          <span>
            {filteredSales.length} Records
          </span>

        </div>

        {filteredSales.length === 0 ? (

          <div className="emptyBox">
            <div>
              📭
            </div>

            <h3>
              कोई Sales Record नहीं मिला
            </h3>

            <p>
              Billing से Bill Generate करने के बाद
              यहाँ Sales दिखाई देगी।
            </p>
          </div>

        ) : (

          <div className="tableScroll">

            <table className="salesTable">

              <thead>
                <tr>

                  <th>#</th>

                  <th>
                    🧾 Bill No.
                  </th>

                  <th>
                    📅 Date
                  </th>

                  <th>
                    ⏰ Time
                  </th>

                  <th>
                    👤 Customer
                  </th>

                  <th>
                    📱 Mobile
                  </th>

                  <th>
                    💊 Medicine
                  </th>

                  <th>
                    📦 Qty
                  </th>

                  <th>
                    💰 Sale
                  </th>

                  <th>
                    💵 Paid
                  </th>

                  <th>
                    ⚠️ Udhari
                  </th>

                  <th>
                    💳 Payment
                  </th>

                  <th>
                    📈 Profit
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredSales.map(
                  (sale, index) => {

                    const saleAmount =
                      Number(
                        sale.saleAmount ||
                          sale.amount ||
                          sale.total ||
                          0
                      );

                    const paid =
                      Number(
                        sale.paidAmount ||
                          0
                      );

                    const udhari =
                      Number(
                        sale.pendingAmount ||
                          sale.udhari ||
                          0
                      );

                    const profit =
                      Number(
                        sale.profit ||
                          0
                      );

                    return (

                      <tr
                        key={
                          sale.id ||
                          index
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <b className="billNumber">
                            {sale.billNumber ||
                              "-"}
                          </b>
                        </td>

                        <td>
                          {sale.date ||
                            "-"}
                        </td>

                        <td>
                          <span className="timeText">
                            {sale.time ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          <b>
                            {sale.customer ||
                              "Cash Customer"}
                          </b>
                        </td>

                        <td>
                          {sale.mobile ||
                            "-"}
                        </td>

                        <td>
                          {sale.medicine ||
                            "-"}
                        </td>

                        <td>
                          {sale.quantity ||
                            0}
                        </td>

                        <td>
                          <b>
                            ₹
                            {saleAmount.toFixed(
                              2
                            )}
                          </b>
                        </td>

                        <td className="paidText">
                          ₹
                          {paid.toFixed(2)}
                        </td>

                        <td
                          className={
                            udhari > 0
                              ? "udhariText"
                              : "paidText"
                          }
                        >
                          ₹
                          {udhari.toFixed(2)}
                        </td>

                        <td>

                          <span
                            className={
                              sale.paymentType ===
                                "cash"
                                ? "cashBadge"
                                : "creditBadge"
                            }
                          >
                            {sale.paymentMode ||
                              (sale.paymentType ===
                              "cash"
                                ? "नकद"
                                : "उधारी")}
                          </span>

                        </td>

                        <td
                          className={
                            profit >= 0
                              ? "profitText"
                              : "lossText"
                          }
                        >
                          ₹
                          {profit.toFixed(2)}
                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

              {/* TOTAL */}

              <tfoot>

                <tr>

                  <td
                    colSpan="7"
                    className="footerTotal"
                  >
                    TOTAL
                  </td>

                  <td>
                    <b>
                      {summary.totalQty}
                    </b>
                  </td>

                  <td>
                    <b>
                      ₹
                      {summary.totalSales.toFixed(
                        2
                      )}
                    </b>
                  </td>

                  <td>
                    <b>
                      ₹
                      {summary.totalPaid.toFixed(
                        2
                      )}
                    </b>
                  </td>

                  <td className="udhariText">
                    <b>
                      ₹
                      {summary.totalUdhari.toFixed(
                        2
                      )}
                    </b>
                  </td>

                  <td>
                    —
                  </td>

                  <td className="profitText">
                    <b>
                      ₹
                      {summary.totalProfit.toFixed(
                        2
                      )}
                    </b>
                  </td>

                </tr>

              </tfoot>

            </table>

          </div>

        )}

      </div>

      {/* DELETE */}

      {sales.length > 0 && (

        <div className="dangerBox">

          <button
            type="button"
            onClick={deleteAllSales}
            className="deleteButton"
          >
            🗑️ Delete All Sales Data
          </button>

        </div>

      )}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .salesReportPage {
          min-height: 100vh;
          padding: 12px;
          background: #f2f5f9;
          font-family: Arial, sans-serif;
        }

        .reportHeader {
          background:
            linear-gradient(
              135deg,
              #1565c0,
              #42a5f5
            );

          color: white;
          padding: 14px 16px;
          border-radius: 10px;
          margin-bottom: 10px;

          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .reportHeader h1 {
          margin: 0;
          font-size: 21px;
        }

        .reportHeader span {
          font-size: 11px;
          opacity: .9;
        }

        .backButton {
          border: none;
          background: white;
          color: #1565c0;
          padding: 8px 12px;
          border-radius: 7px;
          font-weight: bold;
          cursor: pointer;
        }

        .filterBox {
          background: white;
          padding: 12px;
          border-radius: 9px;
          margin-bottom: 10px;

          box-shadow:
            0 2px 6px
            rgba(0,0,0,.06);
        }

        .filterTitle {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }

        .filterGrid {
          display: grid;

          grid-template-columns:
            2fr
            1fr
            1fr
            auto;

          gap: 8px;

          align-items: end;
        }

        .filterGrid label {
          display: block;
          font-size: 11px;
          color: #666;
          margin-bottom: 3px;
        }

        .filterInput {
          width: 100%;
          padding: 9px;

          border:
            1px solid #ccc;

          border-radius: 7px;

          font-size: 13px;
          outline: none;
        }

        .filterInput:focus {
          border-color: #1565c0;
        }

        .clearButton {
          border: none;
          background: #757575;
          color: white;
          padding: 10px 14px;
          border-radius: 7px;
          font-weight: bold;
          cursor: pointer;
        }

        .summaryGrid {
          display: grid;

          grid-template-columns:
            repeat(6, 1fr);

          gap: 8px;

          margin-bottom: 10px;
        }

        .summaryCard {
          background: white;
          border-radius: 8px;
          padding: 10px;
          text-align: center;

          box-shadow:
            0 2px 6px
            rgba(0,0,0,.05);
        }

        .summaryCard span {
          display: block;
          font-size: 10px;
          color: #777;
          margin-bottom: 4px;
        }

        .summaryCard strong {
          font-size: 16px;
        }

        .salesCard strong {
          color: #1565c0;
        }

        .paidCard strong {
          color: #2e7d32;
        }

        .udhariCard strong {
          color: #d32f2f;
        }

        .profitCard strong {
          color: #00897b;
        }

        .qtyCard strong {
          color: #6a1b9a;
        }

        .billCard strong {
          color: #ef6c00;
        }

        .reportActions {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .printReportButton,
        .refreshButton {
          border: none;
          padding: 10px 15px;
          border-radius: 7px;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .printReportButton {
          background: #1565c0;
        }

        .refreshButton {
          background: #2e7d32;
        }

        .tableBox {
          background: white;
          border-radius: 9px;
          overflow: hidden;

          box-shadow:
            0 2px 7px
            rgba(0,0,0,.07);
        }

        .tableHeader {
          padding: 10px 12px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          background: #e3f2fd;
        }

        .tableHeader h2 {
          margin: 0;
          font-size: 15px;
          color: #1565c0;
        }

        .tableHeader span {
          font-size: 11px;
          color: #555;
        }

        .tableScroll {
          width: 100%;
          overflow-x: auto;
        }

        .salesTable {
          width: 100%;
          min-width: 1200px;
          border-collapse: collapse;
          font-size: 11px;
        }

        .salesTable th {
          background: #1565c0;
          color: white;
          padding: 8px 6px;
          text-align: left;
          white-space: nowrap;
        }

        .salesTable td {
          padding: 7px 6px;
          border-bottom:
            1px solid #eee;
          white-space: nowrap;
        }

        .salesTable tbody tr:hover {
          background: #f5f9ff;
        }

        .salesTable tfoot td {
          background: #e8f5e9;
          padding: 9px 6px;
        }

        .billNumber {
          color: #1565c0;
        }

        .timeText {
          color: #555;
        }

        .paidText {
          color: #2e7d32;
        }

        .udhariText {
          color: #d32f2f;
        }

        .profitText {
          color: #00897b;
        }

        .lossText {
          color: #d32f2f;
        }

        .cashBadge,
        .creditBadge {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }

        .cashBadge {
          color: #2e7d32;
          background: #e8f5e9;
        }

        .creditBadge {
          color: #d32f2f;
          background: #ffebee;
        }

        .footerTotal {
          text-align: right;
          color: #1565c0;
        }

        .emptyBox {
          padding: 45px 20px;
          text-align: center;
          color: #777;
        }

        .emptyBox div {
          font-size: 45px;
        }

        .emptyBox h3 {
          margin: 8px 0;
          color: #555;
        }

        .emptyBox p {
          margin: 0;
          font-size: 12px;
        }

        .dangerBox {
          margin-top: 10px;
          padding: 10px;
          text-align: right;
        }

        .deleteButton {
          border: none;
          background: #c62828;
          color: white;
          padding: 9px 12px;
          border-radius: 7px;
          font-weight: bold;
          cursor: pointer;
          font-size: 11px;
        }

        @media (max-width: 900px) {

          .summaryGrid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .filterGrid {
            grid-template-columns:
              1fr 1fr;
          }

          .filterGrid > input {
            grid-column: 1 / -1;
          }

        }

        @media (max-width: 600px) {

          .salesReportPage {
            padding: 8px;
          }

          .reportHeader {
            padding: 11px;
          }

          .reportHeader h1 {
            font-size: 18px;
          }

          .summaryGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .filterGrid {
            grid-template-columns: 1fr;
          }

          .filterGrid > input {
            grid-column: auto;
          }

          .reportActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .printReportButton,
          .refreshButton {
            width: 100%;
          }

        }

      `}</style>

    </div>
  );
}

export default SalesReport;