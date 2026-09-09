import React, { useState } from "react";

function TodayUdhari({ goBack }) {
  const [refresh, setRefresh] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // =========================================
  // TODAY DATE
  // =========================================

  const getTodayKey = () => {
    const now = new Date();

    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  };

  const todayKey = getTodayKey();

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN");
  };

  // =========================================
  // CHECK TODAY
  // Handles old + new date formats
  // =========================================

  const isToday = (record) => {
    if (!record) return false;

    // createdAt सबसे reliable
    if (record.createdAt) {
      const date = new Date(record.createdAt);

      if (!isNaN(date.getTime())) {
        const key =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(date.getDate()).padStart(2, "0");

        if (key === todayKey) {
          return true;
        }
      }
    }

    // Existing date field
    const dateValue = String(
      record.date || ""
    ).trim();

    if (!dateValue) {
      return false;
    }

    // YYYY-MM-DD
    if (dateValue === todayKey) {
      return true;
    }

    // DD/MM/YYYY
    const partsSlash = dateValue.split("/");

    if (partsSlash.length === 3) {
      const normalized =
        partsSlash[2] +
        "-" +
        String(partsSlash[1]).padStart(2, "0") +
        "-" +
        String(partsSlash[0]).padStart(2, "0");

      if (normalized === todayKey) {
        return true;
      }
    }

    // DD-MM-YYYY
    const partsDash = dateValue.split("-");

    if (partsDash.length === 3) {
      if (partsDash[0].length === 2) {
        const normalized =
          partsDash[2] +
          "-" +
          String(partsDash[1]).padStart(2, "0") +
          "-" +
          String(partsDash[0]).padStart(2, "0");

        if (normalized === todayKey) {
          return true;
        }
      }
    }

    // toLocaleDateString comparison
    const todayDisplay =
      new Date().toLocaleDateString("en-IN");

    if (dateValue === todayDisplay) {
      return true;
    }

    return false;
  };

  // =========================================
  // LOAD BILLS
  // =========================================

  const loadBills = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem("bills") || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  };

  // =========================================
  // LOAD CUSTOMER PAYMENTS
  // =========================================

  const loadPayments = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem(
          "customerPayments"
        ) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  };

  // refresh state intentionally used
  void refresh;

  const bills = loadBills();
  const payments = loadPayments();

  // =========================================
  // CUSTOMER KEY
  // =========================================

  const getCustomerKey = (
    customer,
    mobile
  ) => {
    return (
      String(customer || "")
        .trim()
        .toLowerCase() +
      "|" +
      String(mobile || "").trim()
    );
  };

  // =========================================
  // CUSTOMER DISPLAY
  // =========================================

  const getCustomerName = (bill) => {
    return (
      String(
        bill.customer || "Unknown Customer"
      ).trim() || "Unknown Customer"
    );
  };

  // =========================================
  // ALL CREDIT BILLS
  // =========================================

  const creditBills = bills
    .map((bill, index) => ({
      ...bill,
      originalIndex: index,
    }))
    .filter(
      (bill) =>
        Boolean(bill.credit) === true &&
        Number(
          bill.pendingAmount || 0
        ) > 0
    );

  // =========================================
  // SORT BILL - LATEST FIRST
  // =========================================

  creditBills.sort((a, b) => {
    const createdA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const createdB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    if (
      createdA &&
      createdB &&
      createdA !== createdB
    ) {
      return createdB - createdA;
    }

    const idA = Number(a.id || 0);
    const idB = Number(b.id || 0);

    if (idA !== idB) {
      return idB - idA;
    }

    return (
      Number(b.originalIndex || 0) -
      Number(a.originalIndex || 0)
    );
  });

  // =========================================
  // TODAY CREDIT BILLS
  // =========================================

  const todayCreditBills =
    creditBills.filter(isToday);

  // =========================================
  // TODAY PAYMENTS
  // =========================================

  const todayPayments =
    payments.filter(isToday);

  // =========================================
  // PAYMENT MAP
  // =========================================

  const paymentMap = {};

  todayPayments.forEach((payment) => {
    const key = getCustomerKey(
      payment.customer,
      payment.mobile
    );

    if (!paymentMap[key]) {
      paymentMap[key] = 0;
    }

    paymentMap[key] += Number(
      payment.amount || 0
    );
  });

  // =========================================
  // CUSTOMER BILLS
  // =========================================

  const customerBills = {};

  todayCreditBills.forEach((bill) => {
    const key = getCustomerKey(
      bill.customer,
      bill.mobile
    );

    if (!customerBills[key]) {
      customerBills[key] = [];
    }

    customerBills[key].push(bill);
  });

  // =========================================
  // UDHARI LIST
  // =========================================

  const udhariList = [];

  Object.keys(customerBills).forEach(
    (customerKey) => {
      const list = customerBills[
        customerKey
      ];

      // Oldest bill first for payment adjustment
      list.sort((a, b) => {
        return (
          Number(a.originalIndex || 0) -
          Number(b.originalIndex || 0)
        );
      });

      let remainingPayment = Number(
        paymentMap[customerKey] || 0
      );

      list.forEach((bill) => {
        const billPending = Number(
          bill.pendingAmount || 0
        );

        const paymentForBill = Math.min(
          remainingPayment,
          billPending
        );

        remainingPayment -=
          paymentForBill;

        const actualPending = Math.max(
          billPending -
            paymentForBill,
          0
        );

        if (actualPending > 0) {
          const items =
            Array.isArray(
              bill.items
            )
              ? bill.items
              : [];

          const totalQuantity =
            items.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.quantity || 0
                ),
              0
            );

          udhariList.push({
            ...bill,

            remainingPending:
              actualPending,

            paymentAdjusted:
              paymentForBill,

            totalQuantity,
          });
        }
      });
    }
  );

  // =========================================
  // LATEST FIRST
  // =========================================

  udhariList.sort((a, b) => {
    const createdA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const createdB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    if (
      createdA &&
      createdB &&
      createdA !== createdB
    ) {
      return createdB - createdA;
    }

    return (
      Number(b.originalIndex || 0) -
      Number(a.originalIndex || 0)
    );
  });

  // =========================================
  // CUSTOMER SUMMARY
  // =========================================

  const customerSummary = {};

  udhariList.forEach((bill) => {
    const key = getCustomerKey(
      bill.customer,
      bill.mobile
    );

    if (!customerSummary[key]) {
      customerSummary[key] = {
        customer:
          getCustomerName(bill),

        mobile:
          String(
            bill.mobile || ""
          ).trim(),

        total: 0,

        bills: 0,

        quantity: 0,

        latestBill: bill,
      };
    }

    customerSummary[key].total +=
      Number(
        bill.remainingPending || 0
      );

    customerSummary[key].bills += 1;

    customerSummary[key].quantity +=
      Number(
        bill.totalQuantity || 0
      );

    const currentTime =
      bill.createdAt
        ? new Date(
            bill.createdAt
          ).getTime()
        : Number(
            bill.id || 0
          );

    const latestTime =
      customerSummary[key]
        .latestBill.createdAt
        ? new Date(
            customerSummary[key]
              .latestBill.createdAt
          ).getTime()
        : Number(
            customerSummary[key]
              .latestBill.id || 0
          );

    if (currentTime > latestTime) {
      customerSummary[key].latestBill =
        bill;
    }
  });

  const customerList =
    Object.entries(
      customerSummary
    )
      .map(([key, value]) => ({
        key,
        ...value,
      }))
      .sort((a, b) => {
        const timeA =
          a.latestBill.createdAt
            ? new Date(
                a.latestBill.createdAt
              ).getTime()
            : Number(
                a.latestBill.id || 0
              );

        const timeB =
          b.latestBill.createdAt
            ? new Date(
                b.latestBill.createdAt
              ).getTime()
            : Number(
                b.latestBill.id || 0
              );

        return timeB - timeA;
      });

  // =========================================
  // TOTAL UDHARI
  // =========================================

  const totalUdhari =
    udhariList.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.remainingPending || 0
        ),
      0
    );

  // =========================================
  // TOTAL QUANTITY
  // =========================================

  const totalQuantity =
    udhariList.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.totalQuantity || 0
        ),
      0
    );

  // =========================================
  // TOTAL CUSTOMERS
  // =========================================

  const totalCustomers =
    customerList.length;

  // =========================================
  // SELECTED CUSTOMER
  // =========================================

  const selectedCustomerData =
    selectedCustomer
      ? customerList.find(
          (customer) =>
            customer.key ===
            selectedCustomer
        )
      : null;

  const selectedBills =
    selectedCustomer
      ? udhariList.filter(
          (bill) =>
            getCustomerKey(
              bill.customer,
              bill.mobile
            ) === selectedCustomer
        )
      : [];

  const selectedCustomerPayments =
    selectedCustomer
      ? payments
          .filter(
            (payment) =>
              getCustomerKey(
                payment.customer,
                payment.mobile
              ) ===
              selectedCustomer
          )
          .sort((a, b) => {
            const timeA =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : Number(
                    a.id || 0
                  );

            const timeB =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : Number(
                    b.id || 0
                  );

            return timeB - timeA;
          })
      : [];

  const selectedTotalUdhari =
    selectedBills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.remainingPending || 0
        ),
      0
    );

  const selectedTotalQuantity =
    selectedBills.reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.totalQuantity || 0
        ),
      0
    );

  // =========================================
  // REFRESH
  // =========================================

  const refreshData = () => {
    setRefresh(
      (value) => value + 1
    );
  };

  // =========================================
  // SCREEN
  // =========================================

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
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#d32f2f,#ef5350)",
          color: "white",
          padding: "22px",
          borderRadius: "14px",
          marginBottom: "20px",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.12)",
        }}
      >
        <h1
          style={{
            margin: 0,
          }}
        >
          💳 आज की Udhari
        </h1>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          📅{" "}
          {new Date().toLocaleDateString(
            "en-IN"
          )}
        </p>
      </div>

      {/* BUTTONS */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={goBack}
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            fontSize: "16px",
            cursor: "pointer",
            border: "none",
            borderRadius: "7px",
            background: "#1976d2",
            color: "white",
          }}
        >
          ⬅️ Dashboard
        </button>

        <button
          type="button"
          onClick={refreshData}
          style={{
            padding: "12px 20px",
            fontSize: "16px",
            cursor: "pointer",
            border: "none",
            borderRadius: "7px",
            background: "#455a64",
            color: "white",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Summary
          icon="👥"
          title="Customers"
          value={totalCustomers}
        />

        <Summary
          icon="🧾"
          title="Udhari Bills"
          value={udhariList.length}
        />

        <Summary
          icon="📦"
          title="Total Qty"
          value={totalQuantity}
        />

        <Summary
          icon="💳"
          title="आज की Udhari"
          value={
            "₹" +
            totalUdhari.toFixed(2)
          }
          red
        />
      </div>

      {/* CUSTOMER LIST */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "14px",
          overflowX: "auto",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          👥 Customer-wise Udhari
        </h2>

        {customerList.length ===
        0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              background: "#e8f5e9",
              borderRadius: "10px",
            }}
          >
            <h2
              style={{
                color: "green",
              }}
            >
              ✅ आज कोई बाकी Udhari नहीं है
            </h2>

            <p>
              आज की सभी Udhari bills जमा हो चुकी हैं।
            </p>
          </div>
        ) : (
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse:
                "collapse",
              width: "100%",
              minWidth: "850px",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#eeeeee",
                }}
              >
                <th>#</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Bills</th>
                <th>Total Qty</th>
                <th>Remaining Udhari</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {customerList.map(
                (
                  customer,
                  index
                ) => (
                  <tr
                    key={
                      customer.key
                    }
                  >
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <b>
                        {
                          customer.customer
                        }
                      </b>
                    </td>

                    <td>
                      {
                        customer.mobile ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        customer.bills
                      }
                    </td>

                    <td>
                      {
                        customer.quantity
                      }
                    </td>

                    <td
                      style={{
                        color:
                          "red",
                        fontWeight:
                          "bold",
                      }}
                    >
                      ₹
                      {customer.total.toFixed(
                        2
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCustomer(
                            customer.key
                          )
                        }
                        style={{
                          padding:
                            "9px 14px",
                          background:
                            "#1976d2",
                          color:
                            "white",
                          border:
                            "none",
                          borderRadius:
                            "6px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        📒 पूरा हिसाब
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* =====================================
          SELECTED CUSTOMER DETAIL
      ===================================== */}

      {selectedCustomerData && (
        <div
          style={{
            marginTop: "25px",
            background: "white",
            padding: "25px",
            borderRadius: "14px",
            boxShadow:
              "0 3px 10px rgba(0,0,0,0.08)",
          }}
        >
          {/* CUSTOMER HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              flexWrap:
                "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                📒 Customer Ledger
              </h2>

              <h3
                style={{
                  marginBottom: "5px",
                }}
              >
                👤{" "}
                {
                  selectedCustomerData.customer
                }
              </h3>

              <p>
                📱{" "}
                {
                  selectedCustomerData.mobile ||
                  "-"
                }
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedCustomer(
                  null
                )
              }
              style={{
                padding:
                  "10px 16px",
                background:
                  "#555",
                color:
                  "white",
                border:
                  "none",
                borderRadius:
                  "6px",
                cursor:
                  "pointer",
              }}
            >
              ❌ Close
            </button>
          </div>

          <hr />

          {/* SELECTED SUMMARY */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: "15px",
              marginTop:
                "20px",
              marginBottom:
                "25px",
            }}
          >
            <div
              style={{
                background:
                  "#ffebee",
                padding:
                  "18px",
                borderRadius:
                  "10px",
              }}
            >
              <b>
                💳 Remaining Udhari
              </b>

              <h2
                style={{
                  color:
                    "#d32f2f",
                }}
              >
                ₹
                {selectedTotalUdhari.toFixed(
                  2
                )}
              </h2>
            </div>

            <div
              style={{
                background:
                  "#e3f2fd",
                padding:
                  "18px",
                borderRadius:
                  "10px",
              }}
            >
              <b>
                🧾 Udhari Bills
              </b>

              <h2>
                {
                  selectedBills.length
                }
              </h2>
            </div>

            <div
              style={{
                background:
                  "#fff8e1",
                padding:
                  "18px",
                borderRadius:
                  "10px",
              }}
            >
              <b>
                📦 Total Qty
              </b>

              <h2>
                {
                  selectedTotalQuantity
                }
              </h2>
            </div>
          </div>

          {/* =================================
              BILL HISTORY
          ================================= */}

          <h2>
            🧾 Udhari Bill History
          </h2>

          {selectedBills.length ===
          0 ? (
            <p>
              इस customer की कोई pending bill नहीं है।
            </p>
          ) : (
            selectedBills.map(
              (bill, billIndex) => {
                const items =
                  Array.isArray(
                    bill.items
                  )
                    ? bill.items
                    : [];

                return (
                  <div
                    key={
                      bill.billNumber ||
                      bill.id ||
                      billIndex
                    }
                    style={{
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "10px",
                      marginBottom:
                        "20px",
                      overflow:
                        "hidden",
                    }}
                  >
                    {/* BILL HEADER */}

                    <div
                      style={{
                        background:
                          "#f5f5f5",
                        padding:
                          "15px",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        flexWrap:
                          "wrap",
                        gap:
                          "10px",
                      }}
                    >
                      <div>
                        <b>
                          🧾 Bill No:{" "}
                          {
                            bill.billNumber
                          }
                        </b>

                        <br />

                        📅{" "}
                        {bill.date ||
                          formatDate(
                            bill.createdAt
                          )}

                        {"  "}

                        ⏰{" "}
                        {bill.time ||
                          "-"}
                      </div>

                      <div
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        <b>
                          Bill Total: ₹
                          {Number(
                            bill.total ||
                              0
                          ).toFixed(
                            2
                          )}
                        </b>

                        <br />

                        <span
                          style={{
                            color:
                              "red",
                            fontWeight:
                              "bold",
                          }}
                        >
                          Remaining: ₹
                          {Number(
                            bill.remainingPending ||
                              0
                          ).toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS */}

                    <div
                      style={{
                        overflowX:
                          "auto",
                      }}
                    >
                      <table
                        border="1"
                        cellPadding="9"
                        style={{
                          borderCollapse:
                            "collapse",
                          width:
                            "100%",
                          minWidth:
                            "800px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background:
                                "#e3f2fd",
                            }}
                          >
                            <th>
                              #
                            </th>
                            <th>
                              Medicine
                            </th>
                            <th>
                              Company
                            </th>
                            <th>
                              Batch
                            </th>
                            <th>
                              Qty
                            </th>
                            <th>
                              Sale Rate
                            </th>
                            <th>
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {items.length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan="7"
                                style={{
                                  textAlign:
                                    "center",
                                }}
                              >
                                Medicine detail नहीं मिली।
                              </td>
                            </tr>
                          ) : (
                            items.map(
                              (
                                item,
                                index
                              ) => (
                                <tr
                                  key={
                                    index
                                  }
                                >
                                  <td>
                                    {index +
                                      1}
                                  </td>

                                  <td>
                                    <b>
                                      {
                                        item.medicine ||
                                        "-"
                                      }
                                    </b>
                                  </td>

                                  <td>
                                    {
                                      item.company ||
                                      "-"
                                    }
                                  </td>

                                  <td>
                                    {
                                      item.batch ||
                                      "-"
                                    }
                                  </td>

                                  <td
                                    style={{
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    {
                                      item.quantity ||
                                      0
                                    }
                                  </td>

                                  <td>
                                    ₹
                                    {Number(
                                      item.saleRate ||
                                        item.mrp ||
                                        0
                                    ).toFixed(
                                      2
                                    )}
                                  </td>

                                  <td>
                                    ₹
                                    {Number(
                                      item.amount ||
                                        0
                                    ).toFixed(
                                      2
                                    )}
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* BILL FOOTER */}

                    <div
                      style={{
                        padding:
                          "15px",
                        background:
                          "#fff8e1",
                        display:
                          "flex",
                        justifyContent:
                          "flex-end",
                        gap:
                          "25px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <b>
                        Paid: ₹
                        {Number(
                          bill.paidAmount ||
                            0
                        ).toFixed(
                          2
                        )}
                      </b>

                      <b
                        style={{
                          color:
                            "red",
                        }}
                      >
                        Udhari: ₹
                        {Number(
                          bill.remainingPending ||
                            0
                        ).toFixed(
                          2
                        )}
                      </b>
                    </div>
                  </div>
                );
              }
            )
          )}

          {/* =================================
              PAYMENT HISTORY
          ================================= */}

          <hr
            style={{
              margin:
                "30px 0",
            }}
          />

          <h2>
            💵 Customer Payment History
          </h2>

          {selectedCustomerPayments.length ===
          0 ? (
            <p>
              इस customer की कोई payment history नहीं मिली।
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
                cellPadding="10"
                style={{
                  borderCollapse:
                    "collapse",
                  width:
                    "100%",
                  minWidth:
                    "600px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#e8f5e9",
                    }}
                  >
                    <th>
                      #
                    </th>
                    <th>
                      Bill No.
                    </th>
                    <th>
                      Payment
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
                  {selectedCustomerPayments.map(
                    (
                      payment,
                      index
                    ) => (
                      <tr
                        key={
                          payment.id ||
                          index
                        }
                      >
                        <td>
                          {index +
                            1}
                        </td>

                        <td>
                          {
                            payment.billNumber ||
                            "-"
                          }
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
                            payment.amount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td>
                          {payment.date ||
                            formatDate(
                              payment.createdAt
                            )}
                        </td>

                        <td>
                          {
                            payment.time ||
                            "-"
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CUSTOMER FINAL TOTAL */}

          <div
            style={{
              marginTop:
                "25px",
              background:
                "#ffebee",
              padding:
                "20px",
              borderRadius:
                "10px",
              textAlign:
                "right",
            }}
          >
            <h2
              style={{
                margin: 0,
                color:
                  "#d32f2f",
              }}
            >
              💳 Customer की कुल बाकी Udhari: ₹
              {selectedTotalUdhari.toFixed(
                2
              )}
            </h2>

            <p>
              📦 Total Quantity:{" "}
              <b>
                {
                  selectedTotalQuantity
                }
              </b>
            </p>

            <p>
              🧾 Pending Bills:{" "}
              <b>
                {
                  selectedBills.length
                }
              </b>
            </p>
          </div>
        </div>
      )}

      {/* =====================================
          FINAL TOTAL
      ===================================== */}

      {udhariList.length > 0 && (
        <div
          style={{
            marginTop:
              "20px",
            background:
              "#ffebee",
            padding:
              "20px",
            borderRadius:
              "12px",
            textAlign:
              "right",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              margin: 0,
              color:
                "#d32f2f",
            }}
          >
            💳 कुल बाकी Udhari: ₹
            {totalUdhari.toFixed(
              2
            )}
          </h2>

          <p>
            📦 कुल Quantity:{" "}
            <b>
              {totalQuantity}
            </b>
          </p>

          <p>
            👥 कुल Customers:{" "}
            <b>
              {totalCustomers}
            </b>
          </p>
        </div>
      )}
    </div>
  );
}

// =========================================
// SUMMARY COMPONENT
// =========================================

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
        padding:
          "18px",
        borderRadius:
          "12px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <h2
        style={{
          color: red
            ? "#d32f2f"
            : "#222",
          margin: 0,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default TodayUdhari;