import React, { useMemo, useState } from "react";

function BarcodeReport({ stock, goBack }) {
  const currentStock = Array.isArray(stock) ? stock : [];

  const [search, setSearch] = useState("");

  const report = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return currentStock;
    }

    return currentStock.filter((item) => {
      return (
        String(item.barcode || "")
          .toLowerCase()
          .includes(text) ||
        String(item.medicine || "")
          .toLowerCase()
          .includes(text) ||
        String(item.company || "")
          .toLowerCase()
          .includes(text) ||
        String(item.batch || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [currentStock, search]);

  const totalItems = report.length;

  const totalQuantity = report.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const totalStockValue = report.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(
          item.purchaseRate ||
            item.rate ||
            0
        ),
    0
  );

  const totalSaleValue = report.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(
          item.saleRate ||
            item.mrp ||
            0
        ),
    0
  );

  const money = (value) =>
    `₹${Number(value || 0).toFixed(2)}`;

  const printReport = () => {
    const rows = report
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.medicine || "-"}</td>
            <td>${item.company || "-"}</td>
            <td>${item.batch || "-"}</td>
            <td>${item.barcode || "-"}</td>
            <td>${item.quantity || 0}</td>
            <td>₹${Number(
              item.purchaseRate ||
                item.rate ||
                0
            ).toFixed(2)}</td>
            <td>₹${Number(
              item.saleRate ||
                item.mrp ||
                0
            ).toFixed(2)}</td>
            <td>${item.expiry || "-"}</td>
          </tr>
        `
      )
      .join("");

    const win = window.open(
      "",
      "_blank",
      "width=1000,height=800"
    );

    if (!win) {
      alert(
        "⚠️ Popup blocked है। Browser में popup allow करें।"
      );
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shivam Medical Barcode Report</title>

        <style>
          body {
            font-family: Arial;
            padding: 20px;
          }

          h1 {
            text-align: center;
          }

          .summary {
            display: flex;
            gap: 15px;
            margin: 20px 0;
          }

          .box {
            border: 1px solid #ddd;
            padding: 12px;
            flex: 1;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #444;
            padding: 7px;
            font-size: 12px;
          }

          th {
            background: #eee;
          }
        </style>
      </head>

      <body>

        <h1>
          SHIVAM MEDICAL STORE
        </h1>

        <h3>
          Barcode Stock Report
        </h3>

        <div class="summary">

          <div class="box">
            <b>Total Medicines</b>
            <br/>
            ${totalItems}
          </div>

          <div class="box">
            <b>Total Quantity</b>
            <br/>
            ${totalQuantity}
          </div>

          <div class="box">
            <b>Purchase Value</b>
            <br/>
            ${money(totalStockValue)}
          </div>

          <div class="box">
            <b>Sale Value</b>
            <br/>
            ${money(totalSaleValue)}
          </div>

        </div>

        <table>

          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Company</th>
              <th>Batch</th>
              <th>Barcode</th>
              <th>Qty</th>
              <th>Purchase Rate</th>
              <th>Sale Rate</th>
              <th>Expiry</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>

      </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >

      <div
        style={{
          background:
            "linear-gradient(135deg,#1565c0,#42a5f5)",
          color: "white",
          padding: "18px",
          borderRadius: "12px",
          marginBottom: "15px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          📊 Barcode Stock Report
        </h1>

        <div
          style={{
            marginTop: "5px",
            fontSize: "13px",
          }}
        >
          Shivam Medical ERP
        </div>
      </div>

      {/* SEARCH */}

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "15px",
        }}
      >
        <input
          type="text"
          placeholder="🔎 Barcode / Medicine / Company / Batch search करें"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            fontSize: "15px",
            border: "1px solid #ccc",
            borderRadius: "7px",
          }}
        />
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "10px",
          marginBottom: "15px",
        }}
      >

        <Summary
          title="Medicines"
          value={totalItems}
          color="#1565c0"
        />

        <Summary
          title="Quantity"
          value={totalQuantity}
          color="#2e7d32"
        />

        <Summary
          title="Purchase Value"
          value={money(totalStockValue)}
          color="#ef6c00"
        />

        <Summary
          title="Sale Value"
          value={money(totalSaleValue)}
          color="#6a1b9a"
        />

      </div>

      {/* TABLE */}

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >

          <thead>
            <tr>

              {[
                "#",
                "Medicine",
                "Company",
                "Batch",
                "Barcode",
                "Qty",
                "Purchase",
                "Sale",
                "Expiry",
              ].map((title) => (
                <th
                  key={title}
                  style={{
                    border:
                      "1px solid #ddd",
                    padding: "8px",
                    background:
                      "#e3f2fd",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {title}
                </th>
              ))}

            </tr>
          </thead>

          <tbody>

            {report.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#777",
                  }}
                >
                  📭 कोई Stock नहीं मिला।
                </td>
              </tr>
            ) : (
              report.map(
                (item, index) => (
                  <tr key={item.id || index}>

                    <td style={tdStyle}>
                      {index + 1}
                    </td>

                    <td style={tdStyle}>
                      <b>
                        {item.medicine ||
                          "-"}
                      </b>
                    </td>

                    <td style={tdStyle}>
                      {item.company ||
                        "-"}
                    </td>

                    <td style={tdStyle}>
                      {item.batch ||
                        "-"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#1565c0",
                      }}
                    >
                      {item.barcode ||
                        "-"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                      }}
                    >
                      {item.quantity ||
                        0}
                    </td>

                    <td style={tdStyle}>
                      {money(
                        item.purchaseRate ||
                          item.rate
                      )}
                    </td>

                    <td style={tdStyle}>
                      {money(
                        item.saleRate ||
                          item.mrp
                      )}
                    </td>

                    <td style={tdStyle}>
                      {item.expiry ||
                        "-"}
                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* BUTTONS */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
          flexWrap: "wrap",
        }}
      >

        <button
          type="button"
          onClick={printReport}
          style={{
            flex: 1,
            minWidth: "180px",
            padding: "12px",
            background: "#6a1b9a",
            color: "white",
            border: "none",
            borderRadius: "7px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🖨️ Print Barcode Report
        </button>

        <button
          type="button"
          onClick={goBack}
          style={{
            flex: 1,
            minWidth: "180px",
            padding: "12px",
            background: "#555",
            color: "white",
            border: "none",
            borderRadius: "7px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⬅️ Dashboard
        </button>

      </div>

    </div>
  );
}

function Summary({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "12px",
        borderRadius: "8px",
        borderLeft:
          `4px solid ${color}`,
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#666",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontSize: "18px",
          fontWeight: "bold",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  whiteSpace: "nowrap",
};

export default BarcodeReport;