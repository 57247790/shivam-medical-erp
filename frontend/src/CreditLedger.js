import { useState } from "react";

function CreditLedger({ goBack }) {
  const [refresh, setRefresh] = useState(0);
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [search, setSearch] = useState("");

  const [customerFilter, setCustomerFilter] =
    useState("all");

  // =========================
  // NORMALIZE CUSTOMER NAME
  // =========================

  const normalizeCustomer = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  // =========================
  // BILL HISTORY
  // =========================

  let bills = [];

  try {
    bills = JSON.parse(
      localStorage.getItem("bills") || "[]"
    );

    if (!Array.isArray(bills)) {
      bills = [];
    }
  } catch (error) {
    bills = [];
  }

  // =========================
  // CUSTOMER MASTER
  // =========================
  // अलग-अलग possible customer storage
  // को support किया गया है।
  // =========================

  let customerMaster = [];

  const customerStorageKeys = [
    "customers",
    "customerList",
    "customerMaster",
  ];

  for (
    let i = 0;
    i < customerStorageKeys.length;
    i++
  ) {
    try {
      const raw = localStorage.getItem(
        customerStorageKeys[i]
      );

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        customerMaster = [
          ...customerMaster,
          ...parsed,
        ];
      }
    } catch (error) {
      // ignore invalid customer storage
    }
  }

  // =========================
  // CUSTOMER LIST
  // NAME + MOBILE
  // =========================

  const customerMap = {};

  // -------------------------
  // FROM BILLS
  // -------------------------

  bills
    .filter((bill) => bill.credit)
    .forEach((bill) => {
      const customerName = String(
        bill.customer ||
          bill.customerName ||
          "Unknown Customer"
      ).trim();

      if (!customerName) {
        return;
      }

      const mobile = String(
        bill.customerMobile ||
          bill.customerPhone ||
          bill.mobile ||
          bill.phone ||
          bill.customerNo ||
          bill.mobileNo ||
          ""
      ).trim();

      const key =
        normalizeCustomer(customerName);

      if (!customerMap[key]) {
        customerMap[key] = {
          name: customerName,
          mobile: mobile,
        };
      } else if (
        !customerMap[key].mobile &&
        mobile
      ) {
        customerMap[key].mobile = mobile;
      }
    });

  // -------------------------
  // FROM CUSTOMER MASTER
  // -------------------------

  customerMaster.forEach((item) => {
    const customerName = String(
      item?.name ||
        item?.customer ||
        item?.customerName ||
        item?.customer_name ||
        ""
    ).trim();

    if (!customerName) {
      return;
    }

    const mobile = String(
      item?.mobile ||
        item?.mobileNo ||
        item?.phone ||
        item?.phoneNo ||
        item?.customerMobile ||
        item?.customerPhone ||
        ""
    ).trim();

    const key =
      normalizeCustomer(customerName);

    if (!customerMap[key]) {
      customerMap[key] = {
        name: customerName,
        mobile: mobile,
      };
    } else if (
      !customerMap[key].mobile &&
      mobile
    ) {
      customerMap[key].mobile = mobile;
    }
  });

  const customers =
    Object.values(customerMap);

  // =========================
  // CUSTOMER BILLS
  // =========================

  const getCustomerBills = (
    customerName
  ) => {
    const customerKey =
      normalizeCustomer(customerName);

    return bills.filter((bill) => {
      if (!bill.credit) {
        return false;
      }

      const billCustomer =
        String(
          bill.customer ||
            bill.customerName ||
            "Unknown Customer"
        ).trim();

      return (
        normalizeCustomer(
          billCustomer
        ) === customerKey
      );
    });
  };

  // =========================
  // TOTAL CREDIT
  // =========================

  const getCustomerTotal = (
    customerName
  ) => {
    return getCustomerBills(
      customerName
    ).reduce(
      (sum, bill) =>
        sum + Number(bill.total || 0),
      0
    );
  };

  // =========================
  // TOTAL PAID
  // =========================

  const getCustomerPaid = (
    customerName
  ) => {
    return getCustomerBills(
      customerName
    ).reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.paidAmount || 0
        ),
      0
    );
  };

  // =========================
  // PENDING
  // =========================

  const getCustomerPending = (
    customerName
  ) => {
    const total =
      getCustomerTotal(
        customerName
      );

    const paid =
      getCustomerPaid(
        customerName
      );

    return Math.max(
      total - paid,
      0
    );
  };

  // =========================
  // SEARCH + FILTER
  // =========================

  const filteredCustomers =
    customers.filter(
      (customer) => {
        const searchText =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          !searchText ||
          customer.name
            .toLowerCase()
            .includes(searchText) ||
          customer.mobile
            .toLowerCase()
            .includes(searchText);

        const pending =
          getCustomerPending(
            customer.name
          );

        let matchesFilter = true;

        if (
          customerFilter ===
          "pending"
        ) {
          matchesFilter =
            pending > 0;
        }

        if (
          customerFilter ===
          "paid"
        ) {
          matchesFilter =
            pending <= 0;
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  // =========================
  // GRAND TOTAL
  // =========================

  const grandCredit =
    filteredCustomers.reduce(
      (sum, customer) =>
        sum +
        getCustomerTotal(
          customer.name
        ),
      0
    );

  const grandPaid =
    filteredCustomers.reduce(
      (sum, customer) =>
        sum +
        getCustomerPaid(
          customer.name
        ),
      0
    );

  const grandPending =
    filteredCustomers.reduce(
      (sum, customer) =>
        sum +
        getCustomerPending(
          customer.name
        ),
      0
    );

  // =========================
  // SELECTED CUSTOMER LEDGER
  // =========================

  const selectedBills =
    selectedCustomer
      ? getCustomerBills(
          selectedCustomer
        )
      : [];

  const selectedTotal =
    selectedCustomer
      ? getCustomerTotal(
          selectedCustomer
        )
      : 0;

  const selectedPaid =
    selectedCustomer
      ? getCustomerPaid(
          selectedCustomer
        )
      : 0;

  const selectedPending =
    selectedCustomer
      ? getCustomerPending(
          selectedCustomer
        )
      : 0;

  // =========================
  // RECEIVE PAYMENT
  // =========================

  const receivePayment = (
    customerName
  ) => {
    const pending =
      getCustomerPending(
        customerName
      );

    if (pending <= 0) {
      alert(
        "इस customer की कोई pending udhari नहीं है।"
      );

      return;
    }

    const amount =
      window.prompt(
        "Customer: " +
          customerName +
          "\nPending Udhari: ₹" +
          pending.toFixed(2) +
          "\n\nPayment Amount:"
      );

    if (amount === null) {
      return;
    }

    const payment =
      Number(amount);

    if (
      isNaN(payment) ||
      payment <= 0
    ) {
      alert(
        "❌ सही payment amount डालें।"
      );

      return;
    }

    if (payment > pending) {
      alert(
        "❌ Payment pending amount से ज्यादा नहीं हो सकती।"
      );

      return;
    }

    // =========================
    // CURRENT BILLS
    // =========================

    const allBills = [
      ...bills,
    ];

    const customerBillIndexes =
      [];

    allBills.forEach(
      (bill, index) => {
        if (
          bill.credit &&
          normalizeCustomer(
            bill.customer ||
              bill.customerName ||
              "Unknown Customer"
          ) ===
            normalizeCustomer(
              customerName
            ) &&
          Number(
            bill.pendingAmount || 0
          ) > 0
        ) {
          customerBillIndexes.push(
            index
          );
        }
      }
    );

    let remainingPayment =
      payment;

    // =========================
    // OLDEST BILL FIRST
    // =========================

    for (
      let i = 0;
      i <
      customerBillIndexes.length;
      i++
    ) {
      if (
        remainingPayment <= 0
      ) {
        break;
      }

      const billIndex =
        customerBillIndexes[i];

      const bill =
        allBills[
          billIndex
        ];

      const billPending =
        Number(
          bill.pendingAmount || 0
        );

      const paymentForBill =
        Math.min(
          remainingPayment,
          billPending
        );

      allBills[
        billIndex
      ] = {
        ...bill,

        paidAmount:
          Number(
            bill.paidAmount || 0
          ) +
          paymentForBill,

        pendingAmount:
          billPending -
          paymentForBill,
      };

      remainingPayment -=
        paymentForBill;
    }

    // =========================
    // SAVE BILLS
    // =========================

    localStorage.setItem(
      "bills",
      JSON.stringify(allBills)
    );

    // =========================
    // PAYMENT HISTORY
    // =========================

    let paymentHistory = [];

    try {
      paymentHistory =
        JSON.parse(
          localStorage.getItem(
            "creditPayments"
          ) || "[]"
        );

      if (
        !Array.isArray(
          paymentHistory
        )
      ) {
        paymentHistory = [];
      }
    } catch (error) {
      paymentHistory = [];
    }

    paymentHistory.push({
      customer:
        customerName,

      amount:
        payment,

      date:
        new Date().toLocaleDateString(),

      time:
        new Date().toLocaleTimeString(),
    });

    localStorage.setItem(
      "creditPayments",
      JSON.stringify(
        paymentHistory
      )
    );

    alert(
      "✅ Payment Successfully Saved\n\n" +
        "Customer: " +
        customerName +
        "\n" +
        "Payment: ₹" +
        payment.toFixed(2)
    );

    // React state update
    setRefresh(
      (value) => value + 1
    );
  };

  // Prevent unused-state warning
  void refresh;

  // =========================
  // SCREEN
  // =========================

  return (
    <div
      style={{
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      {/* =========================
          BACK
      ========================= */}

      <button
        onClick={goBack}
        style={{
          padding:
            "12px 25px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom:
            "15px",
        }}
      >
        ⬅️ Back to Dashboard
      </button>

      <h2>
        💳 Customer Udhari Ledger
      </h2>

      <hr />

      {/* =========================
          SEARCH + FILTER
      ========================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems:
            "center",
          flexWrap: "wrap",
          marginBottom:
            "20px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search Customer Name / Mobile"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            width: "320px",
            maxWidth:
              "100%",
            fontSize:
              "16px",
            border:
              "1px solid #aaa",
            borderRadius:
              "5px",
            boxSizing:
              "border-box",
          }}
        />

        <select
          value={
            customerFilter
          }
          onChange={(e) =>
            setCustomerFilter(
              e.target.value
            )
          }
          style={{
            padding: "10px",
            fontSize:
              "16px",
            border:
              "1px solid #aaa",
            borderRadius:
              "5px",
            cursor:
              "pointer",
          }}
        >
          <option value="all">
            🔽 All Customers
          </option>

          <option value="pending">
            🔴 Pending
          </option>

          <option value="paid">
            ✅ Fully Paid
          </option>
        </select>

        {search ||
        customerFilter !==
          "all" ? (
          <button
            onClick={() => {
              setSearch("");
              setCustomerFilter(
                "all"
              );
            }}
            style={{
              padding:
                "10px 15px",
              fontSize:
                "15px",
              cursor:
                "pointer",
            }}
          >
            ❌ Clear
          </button>
        ) : null}
      </div>

      {/* =========================
          SUMMARY
      ========================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "15px",
          marginBottom:
            "25px",
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
          <h3>
            👥 Customers
          </h3>

          <h2>
            {
              filteredCustomers.length
            }
          </h2>
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
          <h3>
            💰 Total Udhari
          </h3>

          <h2>
            ₹
            {grandCredit.toFixed(
              2
            )}
          </h2>
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
          <h3>
            ✅ Total Paid
          </h3>

          <h2
            style={{
              color: "green",
            }}
          >
            ₹
            {grandPaid.toFixed(
              2
            )}
          </h2>
        </div>

        <div
          style={{
            padding: "15px",
            border:
              "1px solid #ccc",
            borderRadius:
              "8px",
            background:
              grandPending > 0
                ? "#ffe5e5"
                : "#e8f5e9",
          }}
        >
          <h3>
            🔴 Total Pending
          </h3>

          <h2
            style={{
              color:
                grandPending >
                0
                  ? "red"
                  : "green",
            }}
          >
            ₹
            {grandPending.toFixed(
              2
            )}
          </h2>
        </div>
      </div>

      <hr />

      {/* =========================
          CUSTOMER TABLE
      ========================= */}

      <h2>
        👥 Customer List
      </h2>

      {filteredCustomers.length ===
      0 ? (
        <div
          style={{
            padding: "20px",
            border:
              "1px solid #ddd",
            borderRadius:
              "8px",
            background:
              "#fafafa",
          }}
        >
          <h3>
            अभी कोई Customer नहीं मिला।
          </h3>

          <p>
            Search या Filter बदलकर फिर देखें।
          </p>
        </div>
      ) : (
        <div
          style={{
            overflowX:
              "auto",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse:
                "collapse",
              width: "100%",
              minWidth:
                "1000px",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#f2f2f2",
                }}
              >
                <th>
                  #
                </th>

                <th>
                  Customer Name
                </th>

                <th>
                  Mobile No.
                </th>

                <th>
                  Total Udhari
                </th>

                <th>
                  Paid
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
              {filteredCustomers.map(
                (
                  customer,
                  index
                ) => {
                  const total =
                    getCustomerTotal(
                      customer.name
                    );

                  const paid =
                    getCustomerPaid(
                      customer.name
                    );

                  const pending =
                    getCustomerPending(
                      customer.name
                    );

                  return (
                    <tr
                      key={
                        normalizeCustomer(
                          customer.name
                        )
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      {/* CUSTOMER NAME */}

                      <td>
                        <button
                          onClick={() =>
                            setSelectedCustomer(
                              customer.name
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
                            fontSize:
                              "16px",
                          }}
                        >
                          {customer.name}
                        </button>
                      </td>

                      {/* MOBILE */}

                      <td
                        style={{
                          fontWeight:
                            "bold",
                        }}
                      >
                        {customer.mobile ||
                          "-"}
                      </td>

                      {/* TOTAL */}

                      <td>
                        ₹
                        {total.toFixed(
                          2
                        )}
                      </td>

                      {/* PAID */}

                      <td
                        style={{
                          color:
                            "green",
                          fontWeight:
                            "bold",
                        }}
                      >
                        ₹
                        {paid.toFixed(
                          2
                        )}
                      </td>

                      {/* PENDING */}

                      <td
                        style={{
                          color:
                            pending >
                            0
                              ? "red"
                              : "green",
                          fontWeight:
                            "bold",
                        }}
                      >
                        ₹
                        {pending.toFixed(
                          2
                        )}
                      </td>

                      {/* ACTION */}

                      <td>
                        {pending >
                        0 ? (
                          <button
                            onClick={() =>
                              receivePayment(
                                customer.name
                              )
                            }
                            style={{
                              padding:
                                "8px 12px",
                              cursor:
                                "pointer",
                            }}
                          >
                            💰 Payment जमा करें
                          </button>
                        ) : (
                          <span
                            style={{
                              color:
                                "green",
                              fontWeight:
                                "bold",
                            }}
                          >
                            ✅ Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================
          SELECTED CUSTOMER LEDGER
      ========================= */}

      {selectedCustomer && (
        <div
          style={{
            marginTop:
              "30px",
            padding: "20px",
            border:
              "2px solid #333",
            borderRadius:
              "10px",
          }}
        >
          <h2>
            📋 Customer Ledger
          </h2>

          {/* CUSTOMER NAME + MOBILE */}

          <div
            style={{
              display:
                "flex",
              gap: "20px",
              flexWrap:
                "wrap",
              alignItems:
                "center",
            }}
          >
            <h3>
              👤{" "}
              {selectedCustomer}
            </h3>

            <h3>
              📱{" "}
              {(() => {
                const found =
                  customers.find(
                    (item) =>
                      normalizeCustomer(
                        item.name
                      ) ===
                      normalizeCustomer(
                        selectedCustomer
                      )
                  );

                return (
                  found?.mobile ||
                  "-"
                );
              })()}
            </h3>
          </div>

          <hr />

          <h3>
            💰 Total Udhari: ₹
            {selectedTotal.toFixed(
              2
            )}
          </h3>

          <h3
            style={{
              color: "green",
            }}
          >
            ✅ Paid: ₹
            {selectedPaid.toFixed(
              2
            )}
          </h3>

          <h3
            style={{
              color:
                selectedPending >
                0
                  ? "red"
                  : "green",
            }}
          >
            🔴 Pending: ₹
            {selectedPending.toFixed(
              2
            )}
          </h3>

          <hr />

          {/* =========================
              BILL HISTORY
          ========================= */}

          <h3>
            🧾 Udhari Bill History
          </h3>

          {selectedBills.length ===
          0 ? (
            <p>
              No Bill Found
            </p>
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
                  minWidth:
                    "750px",
                }}
              >
                <thead>
                  <tr>
                    <th>
                      Bill No
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Paid
                    </th>

                    <th>
                      Pending
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    ...selectedBills,
                  ]
                    .reverse()
                    .map(
                      (
                        bill,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            {
                              bill.billNumber
                            }
                          </td>

                          <td>
                            {
                              bill.date
                            }

                            <br />

                            {
                              bill.time
                            }
                          </td>

                          <td>
                            ₹
                            {Number(
                              bill.total ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "green",
                            }}
                          >
                            ₹
                            {Number(
                              bill.paidAmount ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                Number(
                                  bill.pendingAmount ||
                                    0
                                ) >
                                0
                                  ? "red"
                                  : "green",
                            }}
                          >
                            ₹
                            {Number(
                              bill.pendingAmount ||
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
          )}

          <hr />

          {/* =========================
              PAYMENT HISTORY
          ========================= */}

          <h3>
            💵 Payment History
          </h3>

          {(() => {
            let creditPayments =
              [];

            try {
              creditPayments =
                JSON.parse(
                  localStorage.getItem(
                    "creditPayments"
                  ) || "[]"
                );

              if (
                !Array.isArray(
                  creditPayments
                )
              ) {
                creditPayments =
                  [];
              }
            } catch (error) {
              creditPayments =
                [];
            }

            const customerPayments =
              creditPayments
                .filter(
                  (payment) =>
                    normalizeCustomer(
                      payment.customer
                    ) ===
                    normalizeCustomer(
                      selectedCustomer
                    )
                )
                .reverse();

            if (
              customerPayments.length ===
              0
            ) {
              return (
                <p>
                  अभी कोई payment नहीं है।
                </p>
              );
            }

            return (
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
                        Amount
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {customerPayments.map(
                      (
                        payment,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
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
                              payment.amount ||
                                0
                            ).toFixed(
                              2
                            )}
                          </td>

                          <td>
                            {
                              payment.date
                            }
                          </td>

                          <td>
                            {
                              payment.time
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <br />

          <button
            onClick={() =>
              setSelectedCustomer(
                null
              )
            }
            style={{
              padding:
                "10px 18px",
              cursor:
                "pointer",
            }}
          >
            ❌ Close Ledger
          </button>
        </div>
      )}
    </div>
  );
}

export default CreditLedger;