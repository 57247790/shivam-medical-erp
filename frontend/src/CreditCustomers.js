import { useState } from "react";

function CreditCustomers({ goBack }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const bills =
    JSON.parse(localStorage.getItem("bills")) || [];

  const creditBills = bills.filter(
    (bill) => bill.credit
  );

  // =========================
  // CUSTOMER DATA
  // =========================

  const customers = {};

  creditBills.forEach((bill) => {
    const name = bill.customer || "Unknown";

    if (!customers[name]) {
      customers[name] = {
        customer: name,
        mobile: bill.mobile || "",
        total: 0,
        paid: 0,
      };
    }

    customers[name].total += Number(
      bill.total || 0
    );

    customers[name].paid += Number(
      bill.paidAmount || 0
    );
  });

  const customerList = Object.values(customers);

  // =========================
  // TOTALS
  // =========================

  const totalCredit = customerList.reduce(
    (sum, customer) =>
      sum + customer.total,
    0
  );

  const totalPaid = customerList.reduce(
    (sum, customer) =>
      sum + customer.paid,
    0
  );

  const totalPending =
    totalCredit - totalPaid;

  // =========================
  // PRINT RECEIPT
  // =========================

  const printReceipt = (data) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=600,height=700"
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
          <title>Payment Receipt</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
            }

            .receipt {
              max-width: 500px;
              margin: auto;
              border: 1px solid #333;
              padding: 25px;
            }

            h1 {
              text-align: center;
              margin-bottom: 5px;
            }

            h2 {
              text-align: center;
            }

            .center {
              text-align: center;
            }

            .line {
              border-top: 1px solid #333;
              margin: 15px 0;
            }

            .row {
              display: flex;
              justify-content: space-between;
              margin: 12px 0;
              font-size: 16px;
            }

            .total {
              font-weight: bold;
              font-size: 18px;
            }

            .thank {
              text-align: center;
              margin-top: 25px;
            }
          </style>
        </head>

        <body>

          <div class="receipt">

            <h1>Shivam Medical Store</h1>

            <div class="center">
              Hatuniya, District Mandsaur
              <br />
              Mo. 9617122217
            </div>

            <div class="line"></div>

            <h2>💰 Udhari Payment Receipt</h2>

            <div class="line"></div>

            <div class="row">
              <span><b>Customer:</b></span>
              <span>${data.customer}</span>
            </div>

            <div class="row">
              <span><b>Mobile:</b></span>
              <span>${data.mobile || "-"}</span>
            </div>

            <div class="row">
              <span><b>Date:</b></span>
              <span>${data.date}</span>
            </div>

            <div class="row">
              <span><b>Time:</b></span>
              <span>${data.time}</span>
            </div>

            <div class="line"></div>

            <div class="row">
              <span><b>Previous Udhari:</b></span>
              <span>₹${data.previousPending}</span>
            </div>

            <div class="row">
              <span><b>Payment Received:</b></span>
              <span>₹${data.payment}</span>
            </div>

            <div class="row total">
              <span>Remaining Udhari:</span>
              <span>₹${data.remainingPending}</span>
            </div>

            <div class="line"></div>

            <div class="thank">
              <b>Payment Received Successfully</b>
              <br /><br />
              Thank You 🙏
            </div>

          </div>

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

  // =========================
  // RECEIVE PAYMENT
  // =========================

  const receivePayment = (customerName) => {
    const customer = customerList.find(
      (c) => c.customer === customerName
    );

    if (!customer) return;

    const previousPending =
      customer.total - customer.paid;

    const amount = prompt(
      "Customer: " +
        customerName +
        "\nPending: ₹" +
        previousPending +
        "\n\nPayment amount:"
    );

    if (amount === null) return;

    const payment = Number(amount);

    if (
      isNaN(payment) ||
      payment <= 0
    ) {
      alert("Please enter a valid amount");
      return;
    }

    if (payment > previousPending) {
      alert(
        "Payment pending amount se jyada nahi ho sakti."
      );
      return;
    }

    // =========================
    // PAYMENT HISTORY
    // =========================

    const now = new Date();

    const paymentHistory =
      JSON.parse(
        localStorage.getItem(
          "paymentHistory"
        )
      ) || [];

    paymentHistory.push({
      customer: customerName,
      mobile: customer.mobile || "",
      amount: payment,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    });

    localStorage.setItem(
      "paymentHistory",
      JSON.stringify(paymentHistory)
    );

    // =========================
    // UPDATE BILLS
    // =========================

    let remaining = payment;

    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];

      if (
        bill.credit &&
        (bill.customer || "Unknown") ===
          customerName
      ) {
        const billTotal =
          Number(bill.total || 0);

        const alreadyPaid =
          Number(
            bill.paidAmount || 0
          );

        const billPending =
          billTotal - alreadyPaid;

        if (
          billPending > 0 &&
          remaining > 0
        ) {
          const payNow = Math.min(
            remaining,
            billPending
          );

          bill.paidAmount =
            alreadyPaid + payNow;

          remaining =
            remaining - payNow;
        }
      }
    }

    localStorage.setItem(
      "bills",
      JSON.stringify(bills)
    );

    const remainingPending =
      previousPending - payment;

    // =========================
    // SHOW RECEIPT
    // =========================

    const receiptData = {
      customer: customerName,
      mobile: customer.mobile || "",
      previousPending,
      payment,
      remainingPending,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };

    setReceipt(receiptData);

    alert(
      "₹" +
        payment +
        " Payment Received Successfully"
    );
  };

  // =========================
  // RETURN
  // =========================

  return (
    <div style={{ padding: "20px" }}>

      <h2>💳 Credit Customers</h2>

      {/* =========================
          PAYMENT RECEIPT
      ========================= */}

      {receipt && (
        <div
          style={{
            border: "2px solid green",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3>
            🧾 Payment Receipt Ready
          </h3>

          <p>
            <b>Customer:</b>{" "}
            {receipt.customer}
          </p>

          <p>
            <b>Mobile:</b>{" "}
            {receipt.mobile || "-"}
          </p>

          <p>
            <b>Previous Udhari:</b>{" "}
            ₹{receipt.previousPending}
          </p>

          <p>
            <b>Payment Received:</b>{" "}
            ₹{receipt.payment}
          </p>

          <p>
            <b>Remaining Udhari:</b>{" "}
            ₹{receipt.remainingPending}
          </p>

          <button
            onClick={() =>
              printReceipt(receipt)
            }
            style={{
              background: "green",
              color: "white",
              padding: "10px 15px",
              border: "none",
              cursor: "pointer",
            }}
          >
            🖨️ Print Receipt
          </button>

          <button
            onClick={() =>
              setReceipt(null)
            }
            style={{
              marginLeft: "10px",
              padding: "10px 15px",
            }}
          >
            ❌ Close
          </button>
        </div>
      )}

      {/* =========================
          TOTALS
      ========================= */}

      <h3>
        💰 Total Udhari: ₹{totalCredit}
      </h3>

      <h3>
        ✅ Received: ₹{totalPaid}
      </h3>

      <h3>
        ❌ Pending: ₹{totalPending}
      </h3>

      <hr />

      <button onClick={goBack}>
        ⬅️ Back
      </button>

      <hr />

      {/* =========================
          CUSTOMER TABLE
      ========================= */}

      {customerList.length === 0 ? (
        <h3>
          No Credit Customers
        </h3>
      ) : (
        <table
          border="1"
          cellPadding="10"
        >
          <thead>
            <tr>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Total Udhari</th>
              <th>Received</th>
              <th>Pending</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {customerList.map(
              (customer, index) => {

                const pending =
                  customer.total -
                  customer.paid;

                return (
                  <tr key={index}>

                    {/* CUSTOMER */}

                    <td>
                      <button
                        onClick={() =>
                          setSelectedCustomer(
                            customer.customer
                          )
                        }
                        style={{
                          border: "none",
                          background: "none",
                          color: "blue",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {customer.customer}
                      </button>
                    </td>

                    {/* MOBILE */}

                    <td>
                      {customer.mobile ||
                        "-"}
                    </td>

                    {/* TOTAL */}

                    <td>
                      ₹{customer.total}
                    </td>

                    {/* RECEIVED */}

                    <td>
                      ₹{customer.paid}
                    </td>

                    {/* PENDING */}

                    <td>
                      ₹{pending}
                    </td>

                    {/* ACTION */}

                    <td>
                      {pending > 0 && (
                        <button
                          onClick={() =>
                            receivePayment(
                              customer.customer
                            )
                          }
                        >
                          💰 Payment जमा करें
                        </button>
                      )}
                    </td>

                  </tr>
                );
              }
            )}

          </tbody>
        </table>
      )}

      {/* =========================
          CUSTOMER LEDGER
      ========================= */}

      {selectedCustomer && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "2px solid #333",
          }}
        >

          <h2>
            📋 Customer Ledger
          </h2>

          <h3>
            👤 {selectedCustomer}
          </h3>

          {creditBills
            .filter(
              (bill) =>
                (bill.customer ||
                  "Unknown") ===
                selectedCustomer
            )
            .map((bill, index) => {

              const billPending =
                Number(
                  bill.total || 0
                ) -
                Number(
                  bill.paidAmount || 0
                );

              return (
                <div
                  key={index}
                  style={{
                    border:
                      "1px solid #ccc",
                    padding: "10px",
                    marginBottom:
                      "10px",
                  }}
                >

                  <p>
                    <b>Bill No:</b>{" "}
                    {bill.billNo}
                  </p>

                  <p>
                    <b>Date:</b>{" "}
                    {bill.date}
                  </p>

                  <p>
                    <b>Total:</b>{" "}
                    ₹{bill.total}
                  </p>

                  <p>
                    <b>Received:</b>{" "}
                    ₹
                    {bill.paidAmount ||
                      0}
                  </p>

                  <p>
                    <b>Pending:</b>{" "}
                    ₹{billPending}
                  </p>

                </div>
              );
            })}

          <button
            onClick={() =>
              setSelectedCustomer(null)
            }
          >
            ❌ Close Ledger
          </button>

        </div>
      )}

    </div>
  );
}

export default CreditCustomers;