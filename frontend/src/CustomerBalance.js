import React, { useEffect, useMemo, useState } from "react";

function CustomerLedger({ setPage, goBack }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [showBills, setShowBills] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // LOCAL STORAGE
  // =====================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  // =====================================================
  // DATA
  // =====================================================

  const bills = useMemo(() => {
    return loadArray("bills");
  }, [refresh]);

  const payments = useMemo(() => {
    return loadArray("customerPayments");
  }, [refresh]);

  // =====================================================
  // EVENTS
  // =====================================================

  useEffect(() => {
    const refreshLedger = () => {
      setRefresh((v) => v + 1);
    };

    window.addEventListener(
      "customerPaymentUpdated",
      refreshLedger
    );

    window.addEventListener(
      "customerLedgerUpdated",
      refreshLedger
    );

    window.addEventListener(
      "storage",
      refreshLedger
    );

    return () => {
      window.removeEventListener(
        "customerPaymentUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "customerLedgerUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "storage",
        refreshLedger
      );
    };
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const money = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  const getCustomerName = (item) => {
    return String(
      item?.customer ||
        item?.customerName ||
        item?.name ||
        ""
    ).trim();
  };

  const getCustomerMobile = (item) => {
    return String(
      item?.mobile ||
        item?.phone ||
        item?.customerMobile ||
        ""
    ).trim();
  };

  // =====================================================
  // BILL TOTAL
  // =====================================================

  const getBillTotal = (bill) => {
    const values = [
      bill?.total,
      bill?.grandTotal,
      bill?.totalAmount,
      bill?.billTotal,
      bill?.amount,
    ];

    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const number = Number(value);

        if (
          Number.isFinite(number) &&
          number >= 0
        ) {
          return number;
        }
      }
    }

    // -----------------------------------------------
    // ITEMS SE TOTAL
    // -----------------------------------------------

    if (Array.isArray(bill?.items)) {
      return bill.items.reduce(
        (sum, item) => {
          const qty = Number(
            item?.quantity ||
              item?.qty ||
              0
          );

          const rate = Number(
            item?.saleRate ||
              item?.sellingRate ||
              item?.mrp ||
              item?.rate ||
              0
          );

          return sum + qty * rate;
        },
        0
      );
    }

    return 0;
  };

  // =====================================================
  // BILL PAID
  //
  // IMPORTANT:
  // केवल BILL में मौजूद cumulative paid लिया जाएगा.
  //
  // customerPayments को यहाँ minus नहीं करना है.
  // =====================================================

  const getBillPaid = (bill) => {
    const values = [
      bill?.paidAmount,
      bill?.receivedAmount,
      bill?.paid,
    ];

    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const number = Number(value);

        if (
          Number.isFinite(number) &&
          number >= 0
        ) {
          return number;
        }
      }
    }

    return 0;
  };

  // =====================================================
  // BILL UDHARI
  //
  // ONLY:
  //
  // TOTAL - CUMULATIVE PAID
  //
  // Payment history यहाँ दोबारा minus नहीं होगी.
  // =====================================================

  const getBillUdhari = (bill) => {
    const total = Number(
      getBillTotal(bill) || 0
    );

    const paid = Number(
      getBillPaid(bill) || 0
    );

    return Number(
      Math.max(
        total - paid,
        0
      ).toFixed(2)
    );
  };

  // =====================================================
  // PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (payment) => {
    return Number(
      payment?.amount ||
        payment?.paidAmount ||
        payment?.payment ||
        0
    );
  };

  // =====================================================
  // CUSTOMER KEY
  // =====================================================

  const getCustomerKey = (name, mobile) => {
    return `${String(name || "")
      .trim()
      .toLowerCase()}__${String(
      mobile || ""
    ).trim()}`;
  };

  // =====================================================
  // CUSTOMER MATCH
  // =====================================================

  const sameCustomer = (
    item,
    customer
  ) => {
    if (!customer) return false;

    const itemName =
      getCustomerName(item).toLowerCase();

    const itemMobile =
      getCustomerMobile(item);

    const customerName =
      getCustomerName(customer).toLowerCase();

    const customerMobile =
      getCustomerMobile(customer);

    if (
      customerMobile &&
      itemMobile
    ) {
      return (
        itemName === customerName &&
        itemMobile === customerMobile
      );
    }

    return itemName === customerName;
  };

  // =====================================================
  // CUSTOMER LIST
  // =====================================================

  const customers = useMemo(() => {
    const map = new Map();

    bills.forEach((bill) => {
      const name =
        getCustomerName(bill);

      if (!name) return;

      const mobile =
        getCustomerMobile(bill);

      const key =
        getCustomerKey(
          name,
          mobile
        );

      if (!map.has(key)) {
        map.set(key, {
          name,
          mobile,
        });
      }
    });

    payments.forEach((payment) => {
      const name =
        getCustomerName(payment);

      if (!name) return;

      const mobile =
        getCustomerMobile(payment);

      const key =
        getCustomerKey(
          name,
          mobile
        );

      if (!map.has(key)) {
        map.set(key, {
          name,
          mobile,
        });
      }
    });

    return Array.from(
      map.values()
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name
      )
    );
  }, [bills, payments]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCustomers =
    useMemo(() => {
      const text =
        search.trim().toLowerCase();

      if (!text) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            .toLowerCase()
            .includes(text) ||
          customer.mobile
            .includes(text)
      );
    }, [
      customers,
      search,
    ]);

  // =====================================================
  // SELECTED CUSTOMER BILLS
  // =====================================================

  const customerBills =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return bills
        .map((bill, index) => ({
          bill,
          index,
        }))
        .filter(({ bill }) =>
          sameCustomer(
            bill,
            selectedCustomer
          )
        );
    }, [
      bills,
      selectedCustomer,
    ]);

  // =====================================================
  // CUSTOMER PAYMENTS
  //
  // सिर्फ HISTORY दिखाने के लिए.
  //
  // UDHARI CALCULATION में इन्हें दोबारा
  // minus नहीं किया जाएगा.
  // =====================================================

  const customerPayments =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return payments
        .filter((payment) =>
          sameCustomer(
            payment,
            selectedCustomer
          )
        )
        .slice()
        .reverse();
    }, [
      payments,
      selectedCustomer,
    ]);

  // =====================================================
  // TOTAL BILL
  // =====================================================

  const totalBill = useMemo(() => {
    return Number(
      customerBills
        .reduce(
          (sum, item) =>
            sum +
            getBillTotal(
              item.bill
            ),
          0
        )
        .toFixed(2)
    );
  }, [customerBills]);

  // =====================================================
  // TOTAL PAID
  //
  // IMPORTANT:
  // Bill में saved cumulative paid.
  // =====================================================

  const totalPaid = useMemo(() => {
    return Number(
      customerBills
        .reduce(
          (sum, item) =>
            sum +
            getBillPaid(
              item.bill
            ),
          0
        )
        .toFixed(2)
    );
  }, [customerBills]);

  // =====================================================
  // CURRENT UDHARI
  //
  // TOTAL BILL - TOTAL BILL PAID
  //
  // customerPayments को यहाँ minus नहीं करना.
  // =====================================================

  const currentUdhari = useMemo(() => {
    return Number(
      customerBills
        .reduce(
          (sum, item) =>
            sum +
            getBillUdhari(
              item.bill
            ),
          0
        )
        .toFixed(2)
    );
  }, [customerBills]);

  // =====================================================
  // TOTAL PAYMENT HISTORY
  //
  // केवल information/report.
  // Current Udhari calculation में use नहीं होगा.
  // =====================================================

  const totalPaymentHistory =
    useMemo(() => {
      return Number(
        customerPayments
          .reduce(
            (sum, payment) =>
              sum +
              getPaymentAmount(
                payment
              ),
            0
          )
          .toFixed(2)
      );
    }, [
      customerPayments,
    ]);

  // =====================================================
  // CURRENT ADVANCE
  //
  // Advance तभी माना जाएगा जब payment Udhari से
  // ज्यादा हो.
  //
  // लेकिन अगर पुराने generatedAdvance को पहले ही
  // किसी bill में adjust कर दिया गया है, तो वह
  // Current Advance नहीं रहेगा.
  // =====================================================

  const currentAdvance =
    useMemo(() => {
      if (!selectedCustomer) {
        return 0;
      }

      let advance = 0;

      customerPayments.forEach(
        (payment) => {
          const generated =
            Number(
              payment?.generatedAdvance ||
                0
            );

          const adjusted =
            Number(
              payment?.adjustedToUdhari ||
                0
            );

          advance +=
            generated;

          // अगर इस payment का advance
          // बाद में adjust हुआ है तो उसे
          // कम करें.
          const paymentAdvanceUsed =
            Number(
              payment?.advanceAdjusted ||
                payment?.usedAdvance ||
                0
            );

          advance -=
            paymentAdvanceUsed;

          // Safety
          if (advance < 0) {
            advance = 0;
          }

          // adjustedToUdhari को यहाँ minus
          // नहीं करेंगे क्योंकि वह Udhari payment
          // है, Advance नहीं.
          void adjusted;
        }
      );

      return Number(
        Math.max(
          advance,
          0
        ).toFixed(2)
      );
    }, [
      customerPayments,
      selectedCustomer,
    ]);

  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  const selectCustomer = (
    customer
  ) => {
    setSelectedCustomer(
      customer
    );

    setShowBills(true);

    try {
      localStorage.setItem(
        "selectedCustomerForPayment",
        JSON.stringify(
          customer
        )
      );
    } catch {
      // ignore
    }
  };

  // =====================================================
  // PAYMENT PAGE
  // =====================================================

  const openPayment = () => {
    if (!selectedCustomer) {
      alert(
        "पहले Customer select करें।"
      );
      return;
    }

    try {
      localStorage.setItem(
        "selectedCustomerForPayment",
        JSON.stringify(
          selectedCustomer
        )
      );
    } catch {
      // ignore
    }

    if (
      typeof setPage ===
      "function"
    ) {
      setPage(
        "customerPayment"
      );
      return;
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const backToDashboard =
    () => {
      if (
        typeof setPage ===
        "function"
      ) {
        setPage(
          "dashboard"
        );
        return;
      }

      if (
        typeof goBack ===
        "function"
      ) {
        goBack();
      }
    };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={pageStyle}
    >
      {/* HEADER */}

      <div
        style={headerStyle}
      >
        <div>
          <h1
            style={headerTitle}
          >
            📒 Customer Ledger
          </h1>

          <div
            style={subtitle}
          >
            Customer Udhari एवं Payment
          </div>
        </div>

        <button
          type="button"
          onClick={
            backToDashboard
          }
          style={backButton}
        >
          ⬅️ Dashboard
        </button>
      </div>

      {/* SEARCH */}

      <div
        style={cardStyle}
      >
        <input
          type="text"
          placeholder="🔍 Customer Name / Mobile Search"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={searchInput}
        />
      </div>

      {/* CUSTOMER LIST */}

      {!selectedCustomer && (
        <div
          style={cardStyle}
        >
          <h2
            style={sectionTitle}
          >
            👥 Customers
          </h2>

          {filteredCustomers.length ===
          0 ? (
            <div
              style={emptyBox}
            >
              कोई Customer नहीं मिला।
            </div>
          ) : (
            <div
              style={customerGrid}
            >
              {filteredCustomers.map(
                (
                  customer,
                  index
                ) => (
                  <button
                    type="button"
                    key={
                      `${customer.name}-${customer.mobile}-${index}`
                    }
                    onClick={() =>
                      selectCustomer(
                        customer
                      )
                    }
                    style={
                      customerButton
                    }
                  >
                    <div
                      style={
                        customerButtonName
                      }
                    >
                      👤{" "}
                      {
                        customer.name
                      }
                    </div>

                    <div
                      style={
                        customerButtonMobile
                      }
                    >
                      📱{" "}
                      {
                        customer.mobile ||
                        "-"
                      }
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* SELECTED CUSTOMER */}

      {selectedCustomer && (
        <>
          <div
            style={cardStyle}
          >
            <div
              style={
                selectedHeader
              }
            >
              <div>
                <div
                  style={
                    selectedName
                  }
                >
                  👤{" "}
                  {
                    selectedCustomer.name
                  }
                </div>

                <div
                  style={
                    selectedMobile
                  }
                >
                  📱{" "}
                  {
                    selectedCustomer.mobile ||
                    "-"
                  }
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(
                    null
                  );
                  setShowBills(false);
                }}
                style={
                  changeButton
                }
              >
                Change Customer
              </button>
            </div>
          </div>

          {/* BALANCE */}

          <div
            style={balanceGrid}
          >
            <div
              style={{
                ...balanceCard,
                borderLeft:
                  "5px solid #1565c0",
              }}
            >
              <div
                style={balanceTitle}
              >
                Total Bills
              </div>

              <div
                style={{
                  ...balanceValue,
                  color:
                    "#1565c0",
                }}
              >
                {money(
                  totalBill
                )}
              </div>
            </div>

            <div
              style={{
                ...balanceCard,
                borderLeft:
                  "5px solid #2e7d32",
              }}
            >
              <div
                style={balanceTitle}
              >
                Total Paid
              </div>

              <div
                style={{
                  ...balanceValue,
                  color:
                    "#2e7d32",
                }}
              >
                {money(
                  totalPaid
                )}
              </div>
            </div>

            <div
              style={{
                ...balanceCard,
                borderLeft:
                  "5px solid #d32f2f",
              }}
            >
              <div
                style={balanceTitle}
              >
                Current Udhari
              </div>

              <div
                style={{
                  ...balanceValue,
                  color:
                    "#d32f2f",
                }}
              >
                {money(
                  currentUdhari
                )}
              </div>
            </div>

            <div
              style={{
                ...balanceCard,
                borderLeft:
                  "5px solid #6a1b9a",
              }}
            >
              <div
                style={balanceTitle}
              >
                Current Advance
              </div>

              <div
                style={{
                  ...balanceValue,
                  color:
                    "#6a1b9a",
                }}
              >
                {money(
                  currentAdvance
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT BUTTON */}

          <div
            style={cardStyle}
          >
            <button
              type="button"
              onClick={
                openPayment
              }
              style={
                paymentButton
              }
            >
              💳 Udhari Payment जमा करें
            </button>
          </div>

          {/* BILL LIST */}

          <div
            style={cardStyle}
          >
            <div
              style={
                billHeader
              }
            >
              <h2
                style={
                  sectionTitle
                }
              >
                🧾 Customer Bills
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowBills(
                    (v) => !v
                  )
                }
                style={
                  smallButton
                }
              >
                {showBills
                  ? "Hide Bills"
                  : "Show Bills"}
              </button>
            </div>

            {showBills && (
              <>
                {customerBills.length ===
                0 ? (
                  <div
                    style={
                      emptyBox
                    }
                  >
                    इस Customer का कोई Bill नहीं है।
                  </div>
                ) : (
                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >
                    <table
                      style={
                        tableStyle
                      }
                    >
                      <thead>
                        <tr>
                          <th
                            style={
                              thStyle
                            }
                          >
                            #
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Date
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Bill Total
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Paid
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Udhari
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {customerBills.map(
                          (
                            item,
                            index
                          ) => {
                            const bill =
                              item.bill;

                            const total =
                              getBillTotal(
                                bill
                              );

                            const paid =
                              getBillPaid(
                                bill
                              );

                            const udhari =
                              getBillUdhari(
                                bill
                              );

                            return (
                              <tr
                                key={
                                  bill?.id ||
                                  item.index ||
                                  index
                                }
                              >
                                <td
                                  style={
                                    tdStyle
                                  }
                                >
                                  {index +
                                    1}
                                </td>

                                <td
                                  style={
                                    tdStyle
                                  }
                                >
                                  {bill?.date ||
                                    bill?.createdAt ||
                                    "-"}
                                </td>

                                <td
                                  style={
                                    tdStyle
                                  }
                                >
                                  {money(
                                    total
                                  )}
                                </td>

                                <td
                                  style={{
                                    ...tdStyle,
                                    color:
                                      "#2e7d32",
                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  {money(
                                    paid
                                  )}
                                </td>

                                <td
                                  style={{
                                    ...tdStyle,
                                    color:
                                      udhari >
                                      0
                                        ? "#d32f2f"
                                        : "#2e7d32",
                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  {money(
                                    udhari
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>

                      <tfoot>
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                            }}
                          >
                            TOTAL
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              totalBill
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              totalPaid
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                "#d32f2f",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              currentUdhari
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PAYMENT HISTORY */}

          <div
            style={cardStyle}
          >
            <h2
              style={
                sectionTitle
              }
            >
              💳 Payment History
            </h2>

            <div
              style={
                historySummary
              }
            >
              Total Payment History:{" "}
              <b>
                {money(
                  totalPaymentHistory
                )}
              </b>
            </div>

            {customerPayments.length ===
            0 ? (
              <div
                style={
                  emptyBox
                }
              >
                अभी कोई Payment नहीं है।
              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={
                    tableStyle
                  }
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          thStyle
                        }
                      >
                        Date
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        Mode
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        Payment
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        Udhari Adjust
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        Advance
                      </th>

                      <th
                        style={
                          thStyle
                        }
                      >
                        Note
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
                            payment?.id ||
                            index
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment?.date ||
                              "-"}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment?.mode ||
                              payment?.paymentMode ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                "#1565c0",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              getPaymentAmount(
                                payment
                              )
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                "#d32f2f",
                            }}
                          >
                            {money(
                              payment?.adjustedToUdhari ||
                                0
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                "#6a1b9a",
                            }}
                          >
                            {money(
                              payment?.generatedAdvance ||
                                0
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment?.note ||
                              "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  padding: "12px",
  background: "#f2f5f9",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#1565c0,#1976d2,#42a5f5)",
  color: "white",
  padding: "17px",
  borderRadius: "11px",
  marginBottom: "13px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.12)",
};

const headerTitle = {
  margin: 0,
  fontSize: "24px",
};

const subtitle = {
  marginTop: "4px",
  fontSize: "13px",
};

const backButton = {
  padding: "9px 14px",
  background:
    "rgba(255,255,255,0.18)",
  color: "white",
  border:
    "1px solid rgba(255,255,255,0.4)",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold",
};

const cardStyle = {
  background: "white",
  padding: "14px",
  borderRadius: "10px",
  marginBottom: "13px",
  boxShadow:
    "0 2px 7px rgba(0,0,0,0.06)",
};

const sectionTitle = {
  margin: "0 0 12px",
  fontSize: "18px",
};

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "15px",
};

const customerGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "10px",
};

const customerButton = {
  textAlign: "left",
  padding: "13px",
  background: "#f8fafc",
  border: "1px solid #dbe3ec",
  borderRadius: "8px",
  cursor: "pointer",
};

const customerButtonName = {
  fontWeight: "bold",
  color: "#1565c0",
  fontSize: "16px",
};

const customerButtonMobile = {
  marginTop: "5px",
  fontSize: "12px",
  color: "#777",
};

const selectedHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const selectedName = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1565c0",
};

const selectedMobile = {
  marginTop: "5px",
  color: "#666",
};

const changeButton = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  background: "white",
  borderRadius: "7px",
  cursor: "pointer",
};

const balanceGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(190px,1fr))",
  gap: "10px",
  marginBottom: "13px",
};

const balanceCard = {
  background: "white",
  padding: "15px",
  borderRadius: "9px",
  boxShadow:
    "0 2px 7px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};

const balanceTitle = {
  fontSize: "12px",
  color: "#777",
};

const balanceValue = {
  marginTop: "5px",
  fontSize: "22px",
  fontWeight: "bold",
};

const paymentButton = {
  width: "100%",
  padding: "13px",
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
};

const billHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const smallButton = {
  padding: "7px 10px",
  border: "1px solid #ccc",
  background: "#f8fafc",
  borderRadius: "6px",
  cursor: "pointer",
};

const historySummary = {
  background: "#eef5ff",
  padding: "10px",
  borderRadius: "7px",
  marginBottom: "10px",
  color: "#1565c0",
};

const emptyBox = {
  padding: "20px",
  textAlign: "center",
  color: "#777",
  background: "#f7f8fa",
  borderRadius: "7px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
};

const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  background: "#f1f5f9",
  whiteSpace: "nowrap",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  whiteSpace: "nowrap",
};

export default CustomerLedger;