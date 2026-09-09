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
  // CUSTOMER SUMMARY
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

  const customerList =
    Object.values(customers);

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
  // RECEIVE PAYMENT
  // =========================

  const receivePayment = (customerName) => {
    const customer = customerList.find(
      (c) => c.customer === customerName
    );

    if (!customer) return;

    const pending =
      customer.total - customer.paid;

    const amount = prompt(
      "Customer: " +
        customerName +
        "\nPending: ₹" +
        pending +
        "\n\nPayment amount:"
    );

    if (amount === null) return;

    const payment = Number(amount);

    if (
      isNaN(payment) ||
      payment <= 0
    ) {
      alert(
        "Please enter a valid amount"
      );
      return;
    }

    if (payment > pending) {
      alert(
        "Payment pending amount se jyada nahi ho sakti."
      );
      return;
    }

    // =========================
    // PAYMENT HISTORY
    // =========================

    const paymentDate =
      new Date().toLocaleDateString();

    const paymentTime =
      new Date().toLocaleTimeString();

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
      date: paymentDate,
      time: paymentTime,
    });

    localStorage.setItem(
      "paymentHistory",
      JSON.stringify(paymentHistory)
    );

    // =========================
    // UPDATE BILLS
    // =========================

    let remaining = payment;

    for (
      let i = 0;
      i < bills.length;
      i++
    ) {
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

    // =========================
    // NEW PENDING
    // =========================

    const newPending =
      pending - payment;

    // =========================
    // SAVE RECEIPT DATA
    // =========================

    setReceipt({
      customer: customerName,
      mobile: customer.mobile || "",
      previousPending: pending,
      payment: payment,
      remainingPending: newPending,
      date: paymentDate,
      time: paymentTime,
    });

    alert(
      "₹" +
        payment +
        " Payment Received Successfully"
    );

    // Refresh page data
    window.location.reload();
  };

  // =========================
  // PRINT RECEIPT
  // =========================

  const printReceipt = (data) => {
    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      alert(
        "Print window blocked. Browser me popup allow kare."
      );
      return;
    }

    printWindow.document.write(`
      <html>

        <head>

          <title>
            Payment Receipt
          </title>

        </head>

        <body
          style="
            font-family: Arial;
            padding: 20px;
          "
        >

          <h2
            style="
              text-align:center;
            "
          >
            Shivam Medical Store
          </h2>

          <p
            style="
              text-align:center;
            "
          >
            Hatuniya, District Mandsaur
            <br />
            Mo. 9617122217
          </p>

          <hr />

          <h3
            style="
              text-align:center;
            "
          >
            🧾 Udhari Payment Receipt
          </h3>

          <hr />

          <p>
            <b>Customer:</b>
            ${data.customer}
          </p>

          <p>
            <b>Mobile:</b>
            ${data.mobile || "-"}
          </p>

          <p>
            <b>Date:</b>
            ${data.date}
          </p>

          <p>
            <b>Time:</b>
            ${data.time}
          </p>

          <hr />

          <p>
            <b>
              Previous Pending:
            </b>
            ₹${data.previousPending}
          </p>

          <p>
            <b>
              Payment Received:
            </b>
            ₹${data.payment}
          </p>

          <h3>
            Remaining Pending:
            ₹${data.remainingPending}
          </h3>

          <hr />

          <p
            style="
              text-align:center;
              margin-top:30px;
            "
          >
            Thank You 🙏
          </p>

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.print();
  };

  return (
    <div
      style={{
        padding: "20px",
      }}
    >

      <h2>
        💳 Credit Customers
      </h2>

      <h3>
        💰 Total Udhari:
        ₹{totalCredit}
      </h3>

      <h3>
        ✅ Received:
        ₹{totalPaid}
      </h3>

      <h3>
        ❌ Pending:
        ₹{totalPending}
      </h3>

      <hr />

      <button onClick={goBack}>
        ⬅️ Back
      </button>

      <hr />

      {/* =========================
          RECEIPT
      ========================= */}

      {receipt && (
        <div
          style={{
            border:
              "2px solid green",
            padding: "15px",
            marginBottom: "20px",
          }}
        >

          <h3>
            🧾 Payment Receipt Ready
          </h3>

          <p>
            <b>
              Customer:
            </b>{" "}
            {receipt.customer}
          </p>

          <p>
            <b>
              Previous Pending:
            </b>{" "}
            ₹
            {receipt.previousPending}
          </p>

          <p>
            <b>
              Payment Received:
            </b>{" "}
            ₹{receipt.payment}
          </p>

          <p>
            <b>
              Remaining Pending:
            </b>{" "}
            ₹
            {receipt.remainingPending}
          </p>

          <button
            onClick={() =>
              printReceipt(receipt)
            }
          >
            🧾 Print Receipt
          </button>

        </div>
      )}

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

              <th>
                Customer
              </th>

              <th>
                Mobile
              </th>

              <th>
                Total Udhari
              </th>

              <th>
                Received
              </th>

              <th>
                Pending
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {customerList.map(
              (
                customer,
                index
              ) => {

                const pending =
                  customer.total -
                  customer.paid;

                return (
                  <tr
                    key={index}
                  >

                    {/* CUSTOMER */}

                    <td>

                      <button
                        onClick={() =>
                          setSelectedCustomer(
                            customer.customer
                          )
                        }
                        style={{
                          border:
                            "none",
                          background:
                            "none",
                          color:
                            "blue",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >

                        {
                          customer.customer
                        }

                      </button>

                    </td>

                    {/* MOBILE */}

                    <td>
                      {
                        customer.mobile ||
                        "-"
                      }
                    </td>

                    {/* TOTAL */}

                    <td>
                      ₹
                      {
                        customer.total
                      }
                    </td>

                    {/* PAID */}

                    <td>
                      ₹
                      {
                        customer.paid
                      }
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
            marginTop:
              "30px",
            padding:
              "20px",
            border:
              "2px solid #333",
          }}
        >

          <h2>
            📋 Customer Ledger
          </h2>

          <h3>
            👤{" "}
            {selectedCustomer}
          </h3>

          {creditBills
            .filter(
              (bill) =>
                (bill.customer ||
                  "Unknown") ===
                selectedCustomer
            )
            .map(
              (
                bill,
                index
              ) => {

                const billPending =
                  Number(
                    bill.total ||
                      0
                  ) -
                  Number(
                    bill.paidAmount ||
                      0
                  );

                return (
                  <div
                    key={index}
                    style={{
                      border:
                        "1px solid #ccc",
                      padding:
                        "10px",
                      marginBottom:
                        "10px",
                    }}
                  >

                    <p>
                      <b>
                        Bill No:
                      </b>{" "}
                      {
                        bill.billNo
                      }
                    </p>

                    <p>
                      <b>
                        Date:
                      </b>{" "}
                      {
                        bill.date
                      }
                    </p>

                    <p>
                      <b>
                        Total:
                      </b>{" "}
                      ₹
                      {
                        bill.total
                      }
                    </p>

                    <p>
                      <b>
                        Received:
                      </b>{" "}
                      ₹
                      {
                        bill.paidAmount ||
                        0
                      }
                    </p>

                    <p>
                      <b>
                        Pending:
                      </b>{" "}
                      ₹
                      {
                        billPending
                      }
                    </p>

                  </div>
                );
              }
            )}

          <button
            onClick={() =>
              setSelectedCustomer(
                null
              )
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