function PrintBill({ bill, goBack }) {
  if (!bill) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>❌ Bill नहीं मिला</h3>

        <button onClick={goBack}>
          ⬅️ Back
        </button>
      </div>
    );
  }

  const printBill = () => {
    window.print();
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      {/* BUTTONS */}

      <div
        className="no-print"
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          onClick={goBack}
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ⬅️ Back
        </button>

        <button
          onClick={printBill}
          style={{
            padding: "12px 25px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          🖨️ Print Bill
        </button>
      </div>

      {/* BILL */}

      <div
        id="print-bill"
        style={{
          border: "1px solid #333",
          padding: "20px",
          background: "white",
        }}
      >
        {/* SHOP HEADER */}

        <div
          style={{
            textAlign: "center",
            borderBottom:
              "2px solid #000",
            paddingBottom: "10px",
          }}
        >
          <h1
            style={{
              margin: "0",
            }}
          >
            🏥 SHIVAM MEDICAL
          </h1>

          <p
            style={{
              margin: "5px 0",
            }}
          >
            Hatuniya
          </p>

          <p
            style={{
              margin: "5px 0",
            }}
          >
            Medical Store
          </p>
        </div>

        <br />

        {/* BILL DETAILS */}

        <div>
          <p>
            <b>Bill No:</b>{" "}
            {bill.billNumber || "-"}
          </p>

          <p>
            <b>Date:</b>{" "}
            {bill.date || "-"}
          </p>

          <p>
            <b>Time:</b>{" "}
            {bill.time || "-"}
          </p>

          <p>
            <b>Customer:</b>{" "}
            {bill.customer || "-"}
          </p>

          <p>
            <b>Mobile:</b>{" "}
            {bill.mobile || "-"}
          </p>
        </div>

        <hr />

        {/* MEDICINES */}

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
                #
              </th>

              <th>
                Medicine
              </th>

              <th>
                Qty
              </th>

              <th>
                Rate
              </th>

              <th>
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {(bill.items || []).map(
              (item, index) => (
                <tr
                  key={index}
                >
                  <td>
                    {index + 1}
                  </td>

                  <td>
                    {item.medicine ||
                      "-"}
                  </td>

                  <td>
                    {item.quantity ||
                      0}
                  </td>

                  <td>
                    ₹
                    {Number(
                      item.saleRate ||
                        0
                    ).toFixed(2)}
                  </td>

                  <td>
                    ₹
                    {Number(
                      item.total ||
                        0
                    ).toFixed(2)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <hr />

        {/* SUMMARY */}

        <div
          style={{
            textAlign: "right",
          }}
        >
          <h3>
            Total: ₹
            {Number(
              bill.total || 0
            ).toFixed(2)}
          </h3>

          <p>
            <b>Paid:</b>{" "}
            ₹
            {Number(
              bill.paidAmount || 0
            ).toFixed(2)}
          </p>

          <p>
            <b>Pending:</b>{" "}
            ₹
            {Number(
              bill.pendingAmount || 0
            ).toFixed(2)}
          </p>
        </div>

        <hr />

        <div
          style={{
            textAlign: "center",
          }}
        >
          <p>
            Thank You 🙏
          </p>

          <p>
            Visit Again
          </p>
        </div>
      </div>

      {/* PRINT CSS */}

      <style>
        {`
          @media print {

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            .no-print {
              display: none !important;
            }

            #print-bill {
              border: none !important;
              width: 100%;
              padding: 5px;
            }

            @page {
              margin: 5mm;
            }

          }
        `}
      </style>
    </div>
  );
}

export default PrintBill;