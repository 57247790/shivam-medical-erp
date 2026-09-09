
import React, {
  useEffect,
  useMemo,
  useState
} from "react";

function CustomerLedger({ setPage, goBack }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [showBills, setShowBills] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // AUTO REFRESH CUSTOMER LEDGER
  // =====================================================

  useEffect(() => {
    const refreshLedger = () => {
      setRefresh((prev) => prev + 1);
    };

    window.addEventListener("customerLedgerUpdated", refreshLedger);
    window.addEventListener("advanceUpdated", refreshLedger);
    window.addEventListener("billingUpdated", refreshLedger);
    window.addEventListener("storage", refreshLedger);
    window.addEventListener("focus", refreshLedger);

    return () => {
      window.removeEventListener("customerLedgerUpdated", refreshLedger);
      window.removeEventListener("advanceUpdated", refreshLedger);
      window.removeEventListener("billingUpdated", refreshLedger);
      window.removeEventListener("storage", refreshLedger);
      window.removeEventListener("focus", refreshLedger);
    };
  }, []);

  // =====================================================
  // SAFE LOCAL STORAGE
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

  const loadObject = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "{}"
      );

      return data && typeof data === "object"
        ? data
        : {};
    } catch {
      return {};
    }
  };

  // =====================================================
  // DATA
  // =====================================================

  const bills = useMemo(() => {
    return loadArray("bills");
  }, [refresh]);

  const customerPayments = useMemo(() => {
    return loadArray("customerPayments");
  }, [refresh]);

  const advances = useMemo(() => {
    return loadArray("advances");
  }, [refresh]);

  const customerAdvances = useMemo(() => {
    return loadObject("customerAdvances");
  }, [refresh]);

  // =====================================================
  // MONEY
  // =====================================================

  const roundMoney = (value) => {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Number(number.toFixed(2));
  };

  const money = (value) => {
    return `₹${roundMoney(value).toFixed(2)}`;
  };

  // =====================================================
  // CUSTOMER NAME
  // =====================================================

  const getCustomerName = (item) => {
    return String(
      item?.customer ||
        item?.customerName ||
        item?.name ||
        ""
    ).trim();
  };

  // =====================================================
  // CUSTOMER MOBILE
  // =====================================================

  const getCustomerMobile = (item) => {
    return String(
      item?.mobile ||
        item?.phone ||
        item?.customerMobile ||
        ""
    ).trim();
  };

  // =====================================================
  // NORMALIZE
  // =====================================================

  const normalizeName = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  const normalizeMobile = (value) => {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(-10);
  };

  // =====================================================
  // CUSTOMER KEY
  // =====================================================

  const makeCustomerKey = (name, mobile) => {
    const cleanName = normalizeName(name);
    const cleanMobile = normalizeMobile(mobile);

    if (cleanMobile) {
      return cleanMobile;
    }

    if (cleanName) {
      return cleanName;
    }

    return "cash customer";
  };

  // =====================================================
  // DATE / TIME HELPER
  // Latest activity के लिए
  // =====================================================

  const getActivityTime = (item) => {
    if (!item) {
      return 0;
    }

    const directFields = [
      item?.createdAt,
      item?.updatedAt,
      item?.timestamp,
      item?.createdDateTime,
      item?.billDateTime
    ];

    for (const value of directFields) {
      if (value) {
        const time = new Date(value).getTime();

        if (Number.isFinite(time)) {
          return time;
        }
      }
    }

    const date = item?.date ||
      item?.billDate ||
      item?.createdDate ||
      "";

    const time = item?.time || "";

    if (date || time) {
      const parsed = new Date(
        `${date} ${time}`
      ).getTime();

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return 0;
  };

  // =====================================================
  // BILL TOTAL
  // =====================================================

  const getBillTotal = (bill) => {
    const possibleValues = [
      bill?.total,
      bill?.grandTotal,
      bill?.totalAmount,
      bill?.billTotal,
      bill?.netTotal,
      bill?.amount
    ];

    for (const value of possibleValues) {
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
          return roundMoney(number);
        }
      }
    }

    if (Array.isArray(bill?.items)) {
      const total = bill.items.reduce(
        (sum, item) => {
          const qty = Number(
            item?.quantity ??
              item?.qty ??
              0
          );

          const rate = Number(
            item?.saleRate ??
              item?.sellingRate ??
              item?.mrp ??
              item?.rate ??
              0
          );

          if (
            !Number.isFinite(qty) ||
            !Number.isFinite(rate)
          ) {
            return sum;
          }

          return sum + qty * rate;
        },
        0
      );

      return roundMoney(total);
    }

    return 0;
  };

  // =====================================================
  // BILL PAID
  // =====================================================

  const getBillPaid = (bill) => {
    const billTimeFields = [
      bill?.billPaid,
      bill?.paidNow,
      bill?.jama,
      bill?.paidAtBill,
      bill?.receivedAtBill,
      bill?.paymentReceived
    ];

    for (const value of billTimeFields) {
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
          return roundMoney(number);
        }
      }
    }

    const oldPaidFields = [
      bill?.paidAmount,
      bill?.receivedAmount,
      bill?.paid
    ];

    for (const value of oldPaidFields) {
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
          return roundMoney(number);
        }
      }
    }

    const total = getBillTotal(bill);

    const pendingFields = [
      bill?.pendingAmount,
      bill?.udhari,
      bill?.creditAmount,
      bill?.pending
    ];

    for (const value of pendingFields) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const pending = Number(value);

        if (Number.isFinite(pending)) {
          return roundMoney(
            Math.max(
              total - pending,
              0
            )
          );
        }
      }
    }

    return 0;
  };

  // =====================================================
  // BILL ADVANCE ADJUSTED
  // =====================================================

  const getBillAdvanceAdjusted = (bill) => {
    const fields = [
      bill?.advanceAdjusted,
      bill?.advanceAdjustment,
      bill?.adjustedAdvance,
      bill?.advanceUsed,
      bill?.advanceUsedAmount,
      bill?.oldAdvanceAdjusted,
      bill?.advanceApplied
    ];

    for (const value of fields) {
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
          return roundMoney(number);
        }
      }
    }

    return 0;
  };

  // =====================================================
  // BILL UDHARI
  // =====================================================

  const getBillUdhari = (bill) => {
    const total = getBillTotal(bill);
    const paid = getBillPaid(bill);
    const advanceAdjusted =
      getBillAdvanceAdjusted(bill);

    return roundMoney(
      Math.max(
        total -
          paid -
          advanceAdjusted,
        0
      )
    );
  };

  // =====================================================
  // PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (payment) => {
    const values = [
      payment?.amount,
      payment?.paidAmount,
      payment?.payment
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
          return roundMoney(number);
        }
      }
    }

    return 0;
  };

  // =====================================================
  // SAVED UDHARI ADJUSTMENT
  // =====================================================

  const getSavedUdhariAdjustment = (payment) => {
    if (
      payment?.adjustedToUdhari !== undefined &&
      payment?.adjustedToUdhari !== null &&
      payment?.adjustedToUdhari !== ""
    ) {
      return roundMoney(
        Math.max(
          Number(
            payment.adjustedToUdhari
          ) || 0,
          0
        )
      );
    }

    return getPaymentAmount(payment);
  };

  // =====================================================
  // SAVED ADVANCE
  // =====================================================

  const getSavedAdvance = (payment) => {
    if (
      payment?.advanceAmount !== undefined &&
      payment?.advanceAmount !== null &&
      payment?.advanceAmount !== ""
    ) {
      return roundMoney(
        Math.max(
          Number(
            payment.advanceAmount
          ) || 0,
          0
        )
      );
    }

    if (
      payment?.adjustedToAdvance !== undefined &&
      payment?.adjustedToAdvance !== null &&
      payment?.adjustedToAdvance !== ""
    ) {
      return roundMoney(
        Math.max(
          Number(
            payment.adjustedToAdvance
          ) || 0,
          0
        )
      );
    }

    return 0;
  };

  // =====================================================
  // CUSTOMER MATCH
  // =====================================================

  const customerMatches = (
    item,
    customer
  ) => {
    const itemName =
      normalizeName(
        getCustomerName(item)
      );

    const itemMobile =
      normalizeMobile(
        getCustomerMobile(item)
      );

    const customerName =
      normalizeName(
        customer?.name
      );

    const customerMobile =
      normalizeMobile(
        customer?.mobile
      );

    if (
      customerMobile &&
      itemMobile &&
      customerMobile === itemMobile
    ) {
      return true;
    }

    if (
      customerName &&
      itemName &&
      customerName === itemName
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // CURRENT REMAINING ADVANCE
  // =====================================================

  const getCurrentAdvance = (customer) => {
    const totalAdvanceFromPayments =
      customerPayments
        .filter((payment) =>
          customerMatches(
            payment,
            customer
          )
        )
        .reduce(
          (sum, payment) => {
            const advance =
              getSavedAdvance(
                payment
              );

            return (
              sum +
              Math.max(
                Number(advance) || 0,
                0
              )
            );
          },
          0
        );

    const totalAdvanceUsedInBills =
      bills
        .filter((bill) =>
          customerMatches(
            bill,
            customer
          )
        )
        .reduce(
          (sum, bill) => {
            const used =
              getBillAdvanceAdjusted(
                bill
              );

            return (
              sum +
              Math.max(
                Number(used) || 0,
                0
              )
            );
          },
          0
        );

    return roundMoney(
      Math.max(
        totalAdvanceFromPayments -
          totalAdvanceUsedInBills,
        0
      )
    );
  };

  // =====================================================
  // ALL CUSTOMERS
  //
  // IMPORTANT:
  // Latest Bill / Payment / Advance activity
  // वाला Customer सबसे ऊपर
  // =====================================================

  const customers = useMemo(() => {
    const map = new Map();

    const addCustomer = (
      item,
      activityTime = 0
    ) => {
      const name =
        getCustomerName(item);

      const mobile =
        getCustomerMobile(item);

      if (
        !name ||
        normalizeName(name) ===
          "cash customer"
      ) {
        return;
      }

      const key =
        makeCustomerKey(
          name,
          mobile
        );

      if (!map.has(key)) {
        map.set(key, {
          name,
          mobile,
          latestActivity:
            activityTime || 0
        });
      } else {
        const existing =
          map.get(key);

        if (
          activityTime >
          (existing.latestActivity || 0)
        ) {
          existing.latestActivity =
            activityTime;
        }

        if (
          !existing.mobile &&
          mobile
        ) {
          existing.mobile = mobile;
        }
      }
    };

    // -------------------------------------------------
    // BILLS
    // -------------------------------------------------

    bills.forEach((bill) => {
      addCustomer(
        bill,
        getActivityTime(bill)
      );
    });

    // -------------------------------------------------
    // PAYMENTS
    // -------------------------------------------------

    customerPayments.forEach(
      (payment) => {
        addCustomer(
          payment,
          getActivityTime(
            payment
          )
        );
      }
    );

    // -------------------------------------------------
    // ADVANCE
    // -------------------------------------------------

    if (
      Array.isArray(advances)
    ) {
      advances.forEach(
        (record) => {
          addCustomer(
            record,
            getActivityTime(
              record
            )
          );
        }
      );
    }

    // -------------------------------------------------
    // SORT:
    // LATEST FIRST
    // -------------------------------------------------

    return Array.from(
      map.values()
    ).sort(
      (a, b) => {
        const timeA =
          Number(
            a.latestActivity || 0
          );

        const timeB =
          Number(
            b.latestActivity || 0
          );

        if (
          timeA !== timeB
        ) {
          return timeB - timeA;
        }

        return a.name.localeCompare(
          b.name
        );
      }
    );
  }, [
    bills,
    customerPayments,
    advances,
    refresh
  ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCustomers =
    customers.filter(
      (customer) => {
        const text =
          `${customer.name} ${customer.mobile}`
            .toLowerCase();

        return text.includes(
          search
            .trim()
            .toLowerCase()
        );
      }
    );

  // =====================================================
  // SELECTED CUSTOMER BILLS
  // =====================================================

  const selectedBills =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return bills
        .filter(
          (bill) =>
            customerMatches(
              bill,
              selectedCustomer
            )
        )
        .slice()
        .sort(
          (a, b) =>
            getActivityTime(b) -
            getActivityTime(a)
        );
    }, [
      bills,
      selectedCustomer
    ]);

  // =====================================================
  // SELECTED CUSTOMER PAYMENTS
  // =====================================================

  const selectedPayments =
    useMemo(() => {
      if (!selectedCustomer) {
        return [];
      }

      return customerPayments
        .filter(
          (payment) =>
            customerMatches(
              payment,
              selectedCustomer
            )
        )
        .slice()
        .sort(
          (a, b) =>
            getActivityTime(b) -
            getActivityTime(a)
        );
    }, [
      customerPayments,
      selectedCustomer
    ]);

  // =====================================================
  // FINAL CUSTOMER CALCULATION
  // =====================================================

  const customerCalculation =
    useMemo(() => {
      const totalBill =
        roundMoney(
          selectedBills.reduce(
            (sum, bill) =>
              sum +
              getBillTotal(
                bill
              ),
            0
          )
        );

      const billPaid =
        roundMoney(
          selectedBills.reduce(
            (sum, bill) =>
              sum +
              getBillPaid(
                bill
              ),
            0
          )
        );

      const advanceAdjustedInBills =
        roundMoney(
          selectedBills.reduce(
            (sum, bill) =>
              sum +
              getBillAdvanceAdjusted(
                bill
              ),
            0
          )
        );

      const originalUdhari =
        roundMoney(
          Math.max(
            totalBill -
              billPaid -
              advanceAdjustedInBills,
            0
          )
        );

      const laterPayment =
        roundMoney(
          selectedPayments.reduce(
            (sum, payment) =>
              sum +
              getPaymentAmount(
                payment
              ),
            0
          )
        );

      const savedUdhariPayment =
        roundMoney(
          selectedPayments.reduce(
            (sum, payment) =>
              sum +
              getSavedUdhariAdjustment(
                payment
              ),
            0
          )
        );

      const udhariPayment =
        roundMoney(
          Math.min(
            savedUdhariPayment,
            originalUdhari
          )
        );

      const advance =
        selectedCustomer
          ? getCurrentAdvance(
              selectedCustomer
            )
          : 0;

      const bakiUdhari =
        roundMoney(
          Math.max(
            originalUdhari -
              udhariPayment,
            0
          )
        );

      return {
        totalBill,
        billPaid,
        advanceAdjustedInBills,
        originalUdhari,
        laterPayment,
        udhariPayment,
        bakiUdhari,
        advance
      };
    }, [
      selectedBills,
      selectedPayments,
      selectedCustomer,
      advances,
      customerAdvances,
      refresh
    ]);

  // =====================================================
  // CUSTOMER LIST CALCULATION
  // =====================================================

  const getCustomerCalculation =
    (customer) => {
      const customerBills =
        bills.filter(
          (bill) =>
            customerMatches(
              bill,
              customer
            )
        );

      const customerPaymentList =
        customerPayments.filter(
          (payment) =>
            customerMatches(
              payment,
              customer
            )
        );

      const totalBill =
        roundMoney(
          customerBills.reduce(
            (sum, bill) =>
              sum +
              getBillTotal(
                bill
              ),
            0
          )
        );

      const billPaid =
        roundMoney(
          customerBills.reduce(
            (sum, bill) =>
              sum +
              getBillPaid(
                bill
              ),
            0
          )
        );

      const advanceAdjustedInBills =
        roundMoney(
          customerBills.reduce(
            (sum, bill) =>
              sum +
              getBillAdvanceAdjusted(
                bill
              ),
            0
          )
        );

      const originalUdhari =
        roundMoney(
          Math.max(
            totalBill -
              billPaid -
              advanceAdjustedInBills,
            0
          )
        );

      const laterPayment =
        roundMoney(
          customerPaymentList.reduce(
            (sum, payment) =>
              sum +
              getPaymentAmount(
                payment
              ),
            0
          )
        );

      const savedUdhariPayment =
        roundMoney(
          customerPaymentList.reduce(
            (sum, payment) =>
              sum +
              getSavedUdhariAdjustment(
                payment
              ),
            0
          )
        );

      const udhariPayment =
        roundMoney(
          Math.min(
            savedUdhariPayment,
            originalUdhari
          )
        );

      const advance =
        getCurrentAdvance(
          customer
        );

      const bakiUdhari =
        roundMoney(
          Math.max(
            originalUdhari -
              udhariPayment,
            0
          )
        );

      return {
        totalBill,
        billPaid,
        advanceAdjustedInBills,
        originalUdhari,
        laterPayment,
        udhariPayment,
        bakiUdhari,
        advance
      };
    };

  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  const openCustomer = (
    customer
  ) => {
    setSelectedCustomer(
      customer
    );

    setShowBills(false);

    localStorage.setItem(
      "selectedCustomerForPayment",
      JSON.stringify(
        customer
      )
    );
  };

  // =====================================================
  // CLOSE CUSTOMER
  // =====================================================

  const closeCustomer = () => {
    setSelectedCustomer(null);
    setShowBills(false);
  };

  // =====================================================
  // OPEN CUSTOMER PAYMENT
  // =====================================================

  const openPayment = () => {
    if (!selectedCustomer) {
      return;
    }

    localStorage.setItem(
      "selectedCustomerForPayment",
      JSON.stringify(
        selectedCustomer
      )
    );

    if (
      typeof setPage ===
      "function"
    ) {
      setPage(
        "customerPayment"
      );
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const refreshLedger = () => {
    setRefresh(
      (value) => value + 1
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={pageStyle}>

      {/* HEADER */}

      <div style={headerStyle}>

        <div>
          <h1 style={headerTitle}>
            👥 Customer Ledger
          </h1>

          <div style={subtitle}>
            Customer-wise Bill,
            Payment & Udhari हिसाब
          </div>
        </div>

        <button
          type="button"
          onClick={goBack}
          style={backButton}
        >
          ⬅️ Dashboard
        </button>

      </div>

      {/* SEARCH */}

      {!selectedCustomer && (
        <div style={cardStyle}>

          <input
            type="text"
            placeholder="🔎 Customer Name या Mobile Search करें..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={searchInput}
          />

        </div>
      )}

      {/* CUSTOMER TABLE */}

      {!selectedCustomer && (
        <div style={cardStyle}>

          <div style={customerListHeader}>

            <div>
              <h2 style={sectionTitle}>
                👥 Customers
              </h2>

              <div style={latestHint}>
                ⬇️ Latest Customer सबसे ऊपर
              </div>
            </div>

            <div style={customerCount}>
              Total:{" "}
              <b>
                {filteredCustomers.length}
              </b>
            </div>

          </div>

          {filteredCustomers.length === 0 ? (
            <div style={emptyBox}>
              ⚠️ कोई Customer
              उपलब्ध नहीं है।
              <br />
              <br />
              पहले Billing में
              Customer Name save
              करें।
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                width: "100%"
              }}
            >

              <table
                style={customerTableStyle}
              >

                <thead>
                  <tr>

                    <th style={customerThStyle}>
                      #
                    </th>

                    <th style={customerThStyle}>
                      Customer
                    </th>

                    <th style={customerThStyle}>
                      Mobile
                    </th>

                    <th style={customerThStyle}>
                      Total Bill
                    </th>

                    <th style={customerThStyle}>
                      Bill Paid
                    </th>

                    <th style={customerThStyle}>
                      Udhari
                    </th>

                    <th style={customerThStyle}>
                      बाकी Udhari
                    </th>

                    <th style={customerThStyle}>
                      Advance
                    </th>

                    <th style={customerThStyle}>
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

                      const calc =
                        getCustomerCalculation(
                          customer
                        );

                      return (
                        <tr
                          key={makeCustomerKey(
                            customer.name,
                            customer.mobile
                          )}
                          onClick={() =>
                            openCustomer(
                              customer
                            )
                          }
                          style={{
                            ...customerRowStyle,
                            background:
                              calc.bakiUdhari >
                              0
                                ? "#fffafa"
                                : "#fafffb"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "#e3f2fd";
                            e.currentTarget.style.cursor =
                              "pointer";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              calc.bakiUdhari >
                              0
                                ? "#fffafa"
                                : "#fafffb";
                          }}
                        >

                          <td
                            style={
                              customerTdStyle
                            }
                          >
                            <b>
                              {index + 1}
                            </b>
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              fontWeight:
                                "bold",
                              color:
                                "#1565c0"
                            }}
                          >
                            👤{" "}
                            {
                              customer.name
                            }
                          </td>

                          <td
                            style={
                              customerTdStyle
                            }
                          >
                            {customer.mobile
                              ? `📱 ${customer.mobile}`
                              : "-"}
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              color:
                                "#1565c0",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {money(
                              calc.totalBill
                            )}
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {money(
                              calc.billPaid
                            )}
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              color:
                                "#ef6c00",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {money(
                              calc.originalUdhari
                            )}
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              color:
                                calc.bakiUdhari >
                                0
                                  ? "#d32f2f"
                                  : "#2e7d32",
                              fontWeight:
                                "bold",
                              fontSize:
                                "13px"
                            }}
                          >
                            {money(
                              calc.bakiUdhari
                            )}
                          </td>

                          <td
                            style={{
                              ...customerTdStyle,
                              color:
                                "#6a1b9a",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {money(
                              calc.advance
                            )}
                          </td>

                          <td
                            style={
                              customerTdStyle
                            }
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCustomer(
                                  customer
                                );
                              }}
                              style={
                                openButton
                              }
                            >
                              Open →
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}

      {/* CUSTOMER DETAIL */}

      {selectedCustomer && (
        <div style={cardStyle}>

          {/* CUSTOMER HEADER */}

          <div style={customerHeader}>

            <div>

              <div
                style={{
                  fontSize: 12,
                  color: "#777"
                }}
              >
                Selected Customer
              </div>

              <h2
                style={{
                  margin: "3px 0"
                }}
              >
                👤{" "}
                {
                  selectedCustomer.name
                }
              </h2>

              {selectedCustomer.mobile && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#666"
                  }}
                >
                  📱{" "}
                  {
                    selectedCustomer.mobile
                  }
                </div>
              )}

            </div>

            <div
              style={{
                textAlign: "right"
              }}
            >

              <div
                style={{
                  color:
                    customerCalculation.bakiUdhari >
                    0
                      ? "#d32f2f"
                      : "#2e7d32",
                  fontSize: 21,
                  fontWeight: "bold"
                }}
              >
                {money(
                  customerCalculation.bakiUdhari
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#777"
                }}
              >
                बाकी Udhari
              </div>

            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div style={actionBox}>

            <button
              type="button"
              onClick={closeCustomer}
              style={grayButton}
            >
              ⬅️ All Customers
            </button>

            <button
              type="button"
              onClick={openPayment}
              style={paymentButton}
            >
              💳 Udhari Payment जमा करें
            </button>

            <button
              type="button"
              onClick={refreshLedger}
              style={refreshButton}
            >
              🔄 Refresh
            </button>

          </div>

          {/* SUMMARY */}

          <div style={summaryGrid}>

            <button
              type="button"
              onClick={() =>
                setShowBills(true)
              }
              style={
                clickableSummaryButton
              }
            >

              <SummaryCard
                title="Total Bill"
                value={money(
                  customerCalculation.totalBill
                )}
                color="#1565c0"
              />

              <div style={clickHint}>
                👆 Bills देखें
              </div>

            </button>

            <SummaryCard
              title="Bill Paid"
              value={money(
                customerCalculation.billPaid
              )}
              color="#2e7d32"
            />

            <SummaryCard
              title="Udhari"
              value={money(
                customerCalculation.originalUdhari
              )}
              color="#ef6c00"
            />

            <SummaryCard
              title="Udhari Payment"
              value={money(
                customerCalculation.udhariPayment
              )}
              color="#00838f"
            />

            <SummaryCard
              title="बाकी Udhari"
              value={money(
                customerCalculation.bakiUdhari
              )}
              color={
                customerCalculation.bakiUdhari >
                0
                  ? "#d32f2f"
                  : "#2e7d32"
              }
            />

            <SummaryCard
              title="Advance"
              value={money(
                customerCalculation.advance
              )}
              color="#6a1b9a"
            />

          </div>

          {/* PAYMENT RULE */}

          <div style={paymentRuleBox}>

            <b>
              💡 Final Payment Calculation
            </b>

            <div style={{ marginTop: 7 }}>
              <b>
                Total Bill − Bill Paid − Advance
                Adjust = Udhari
              </b>
            </div>

            <div style={{ marginTop: 5 }}>
              बाद में जमा हुई Payment पहले
              Udhari में Adjust होगी।
            </div>

            <div style={{ marginTop: 5 }}>
              Bill में इस्तेमाल हुआ Advance
              दोबारा Advance में नहीं गिना जाएगा।
            </div>

            <div style={{ marginTop: 5 }}>
              <b>
                Bill Paid में बाद की Payment
                नहीं जुड़ेगी।
              </b>
            </div>

          </div>

          {/* BILL DETAILS */}

          {showBills && (
            <div style={billDetailBox}>

              <div style={detailHeader}>

                <div>
                  <h3 style={{ margin: 0 }}>
                    🧾 Customer Bills
                  </h3>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#777",
                      marginTop: 3
                    }}
                  >
                    {
                      selectedCustomer.name
                    }
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowBills(false)
                  }
                  style={closeButton}
                >
                  ✖ Close
                </button>

              </div>

              {selectedBills.length === 0 ? (
                <div style={emptyBox}>
                  इस Customer का कोई Bill
                  नहीं मिला।
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto"
                  }}
                >

                  <table style={tableStyle}>

                    <thead>
                      <tr>

                        <th style={thStyle}>
                          Date
                        </th>

                        <th style={thStyle}>
                          Bill No.
                        </th>

                        <th style={thStyle}>
                          Total
                        </th>

                        <th style={thStyle}>
                          Bill Paid
                        </th>

                        <th style={thStyle}>
                          Advance Adjust
                        </th>

                        <th style={thStyle}>
                          Bill Udhari
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {selectedBills.map(
                        (
                          bill,
                          index
                        ) => {

                          const total =
                            getBillTotal(
                              bill
                            );

                          const paid =
                            getBillPaid(
                              bill
                            );

                          const advanceAdjusted =
                            getBillAdvanceAdjusted(
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
                                bill?.billNo ||
                                bill?.billNumber ||
                                index
                              }
                            >

                              <td style={tdStyle}>
                                {bill?.date ||
                                  bill?.billDate ||
                                  bill?.createdDate ||
                                  "-"}
                              </td>

                              <td style={tdStyle}>
                                {bill?.billNo ||
                                  bill?.billNumber ||
                                  bill?.invoiceNo ||
                                  bill?.invoiceNumber ||
                                  bill?.id ||
                                  "-"}
                              </td>

                              <td
                                style={{
                                  ...tdStyle,
                                  color: "#1565c0",
                                  fontWeight: "bold"
                                }}
                              >
                                {money(total)}
                              </td>

                              <td
                                style={{
                                  ...tdStyle,
                                  color: "#2e7d32",
                                  fontWeight: "bold"
                                }}
                              >
                                {money(paid)}
                              </td>

                              <td
                                style={{
                                  ...tdStyle,
                                  color: "#6a1b9a",
                                  fontWeight: "bold"
                                }}
                              >
                                {money(
                                  advanceAdjusted
                                )}
                              </td>

                              <td
                                style={{
                                  ...tdStyle,
                                  color:
                                    udhari > 0
                                      ? "#d32f2f"
                                      : "#2e7d32",
                                  fontWeight: "bold"
                                }}
                              >
                                {money(udhari)}
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
                            fontWeight: "bold",
                            background: "#f1f5f9"
                          }}
                        >
                          TOTAL
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color: "#1565c0",
                            background: "#f1f5f9"
                          }}
                        >
                          {money(
                            customerCalculation.totalBill
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color: "#2e7d32",
                            background: "#f1f5f9"
                          }}
                        >
                          {money(
                            customerCalculation.billPaid
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color: "#6a1b9a",
                            background: "#f1f5f9"
                          }}
                        >
                          {money(
                            customerCalculation.advanceAdjustedInBills
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color:
                              customerCalculation.originalUdhari >
                              0
                                ? "#d32f2f"
                                : "#2e7d32",
                            background: "#f1f5f9"
                          }}
                        >
                          {money(
                            customerCalculation.originalUdhari
                          )}
                        </td>

                      </tr>

                    </tfoot>

                  </table>

                </div>
              )}

            </div>
          )}

          {/* CUSTOMER PAYMENTS */}

          <h3 style={subHeading}>
            💳 Customer Payments
          </h3>

          {selectedPayments.length === 0 ? (
            <div style={emptyBox}>
              इस Customer से कोई Payment
              जमा नहीं हुआ है।
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto"
              }}
            >

              <table style={tableStyle}>

                <thead>

                  <tr>

                    <th style={thStyle}>
                      Date
                    </th>

                    <th style={thStyle}>
                      Time
                    </th>

                    <th style={thStyle}>
                      Mode
                    </th>

                    <th style={thStyle}>
                      Payment
                    </th>

                    <th style={thStyle}>
                      Udhari में Adjust
                    </th>

                    <th style={thStyle}>
                      Advance
                    </th>

                    <th style={thStyle}>
                      Note
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {selectedPayments.map(
                    (
                      payment,
                      index
                    ) => {

                      const amount =
                        getPaymentAmount(
                          payment
                        );

                      const adjusted =
                        roundMoney(
                          getSavedUdhariAdjustment(
                            payment
                          )
                        );

                      const advance =
                        roundMoney(
                          Math.max(
                            getSavedAdvance(
                              payment
                            ),
                            0
                          )
                        );

                      return (
                        <tr
                          key={
                            payment?.id ||
                            index
                          }
                        >

                          <td style={tdStyle}>
                            {payment?.date ||
                              "-"}
                          </td>

                          <td style={tdStyle}>
                            {payment?.time ||
                              "-"}
                          </td>

                          <td style={tdStyle}>
                            {payment?.mode ||
                              payment?.paymentMode ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color: "#2e7d32",
                              fontWeight: "bold"
                            }}
                          >
                            {money(amount)}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color: "#00838f",
                              fontWeight: "bold"
                            }}
                          >
                            {money(adjusted)}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color: "#6a1b9a",
                              fontWeight: "bold"
                            }}
                          >
                            {money(advance)}
                          </td>

                          <td style={tdStyle}>
                            {payment?.note ||
                              "-"}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

                <tfoot>

                  <tr>

                    <td
                      colSpan="3"
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        background: "#f1f5f9"
                      }}
                    >
                      TOTAL CUSTOMER PAYMENT
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#2e7d32",
                        background: "#f1f5f9"
                      }}
                    >
                      {money(
                        customerCalculation.laterPayment
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#00838f",
                        background: "#f1f5f9"
                      }}
                    >
                      {money(
                        customerCalculation.udhariPayment
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#6a1b9a",
                        background: "#f1f5f9"
                      }}
                    >
                      {money(
                        customerCalculation.advance
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        background: "#f1f5f9"
                      }}
                    >
                      -
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>
          )}

          {/* FINAL PAYMENT SUMMARY */}

          <div style={distributionBox}>

            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 16
              }}
            >
              💰 Final Payment हिसाब
            </h3>

            <div style={distributionRow}>
              <span>Total Bill</span>

              <b style={{ color: "#1565c0" }}>
                {money(
                  customerCalculation.totalBill
                )}
              </b>
            </div>

            <div style={distributionRow}>
              <span>Bill Paid</span>

              <b style={{ color: "#2e7d32" }}>
                {money(
                  customerCalculation.billPaid
                )}
              </b>
            </div>

            <div style={distributionRow}>
              <span>Advance Adjusted</span>

              <b style={{ color: "#6a1b9a" }}>
                {money(
                  customerCalculation.advanceAdjustedInBills
                )}
              </b>
            </div>

            <div style={distributionRow}>
              <span>Udhari</span>

              <b style={{ color: "#ef6c00" }}>
                {money(
                  customerCalculation.originalUdhari
                )}
              </b>
            </div>

            <div style={distributionRow}>
              <span>Udhari Payment</span>

              <b style={{ color: "#00838f" }}>
                {money(
                  customerCalculation.udhariPayment
                )}
              </b>
            </div>

            <div style={distributionRow}>
              <span>बाकी Udhari</span>

              <b
                style={{
                  color:
                    customerCalculation.bakiUdhari >
                    0
                      ? "#d32f2f"
                      : "#2e7d32"
                }}
              >
                {money(
                  customerCalculation.bakiUdhari
                )}
              </b>
            </div>

            <div
              style={{
                ...distributionRow,
                borderBottom: "none"
              }}
            >
              <span>Advance</span>

              <b style={{ color: "#6a1b9a" }}>
                {money(
                  customerCalculation.advance
                )}
              </b>
            </div>

          </div>

          {/* FINAL BALANCE */}

          <div
            style={{
              marginTop: 15,
              padding: 15,
              borderRadius: 9,

              background:
                customerCalculation.bakiUdhari >
                0
                  ? "#ffebee"
                  : "#e8f5e9",

              border:
                customerCalculation.bakiUdhari >
                0
                  ? "1px solid #ef9a9a"
                  : "1px solid #a5d6a7",

              textAlign: "center"
            }}
          >

            <div
              style={{
                fontSize: 13,
                color: "#666"
              }}
            >
              Customer का Final
              बाकी Udhari
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: "bold",

                color:
                  customerCalculation.bakiUdhari >
                  0
                    ? "#d32f2f"
                    : "#2e7d32",

                marginTop: 5
              }}
            >
              {money(
                customerCalculation.bakiUdhari
              )}
            </div>

            {customerCalculation.bakiUdhari <=
              0 && (
              <div
                style={{
                  marginTop: 5,
                  color: "#2e7d32",
                  fontWeight: "bold"
                }}
              >
                ✅ Udhari पूरी तरह Settled है।
              </div>
            )}

            {customerCalculation.advance >
              0 && (
              <div
                style={{
                  marginTop: 8,
                  color: "#6a1b9a",
                  fontWeight: "bold"
                }}
              >
                💜 Customer Advance:{" "}
                {money(
                  customerCalculation.advance
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  color
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "12px",
        borderRadius: "8px",
        borderLeft:
          `4px solid ${color}`,
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.05)",
        minHeight: "65px",
        boxSizing: "border-box"
      }}
    >

      <div
        style={{
          fontSize: "11px",
          color: "#777"
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "19px",
          fontWeight: "bold",
          color
        }}
      >
        {value}
      </div>

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
  boxSizing: "border-box"
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#0d47a1,#1976d2,#42a5f5)",
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
    "0 3px 10px rgba(0,0,0,0.12)"
};

const headerTitle = {
  margin: 0,
  fontSize: "24px"
};

const subtitle = {
  marginTop: "4px",
  fontSize: "13px"
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
  fontWeight: "bold"
};

const cardStyle = {
  background: "white",
  padding: "14px",
  borderRadius: "10px",
  marginBottom: "13px",
  boxShadow:
    "0 2px 7px rgba(0,0,0,0.06)"
};

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  fontSize: "14px"
};

const sectionTitle = {
  margin: 0,
  fontSize: "18px"
};

const customerListHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
  flexWrap: "wrap"
};

const latestHint = {
  marginTop: "3px",
  fontSize: "11px",
  color: "#777"
};

const customerCount = {
  padding: "7px 11px",
  background: "#e3f2fd",
  color: "#1565c0",
  borderRadius: "7px",
  fontSize: "12px"
};

// =====================================================
// CUSTOMER TABLE
// =====================================================

const customerTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
  minWidth: "850px"
};

const customerThStyle = {
  border: "1px solid #d5dbe2",
  padding: "10px 8px",
  background: "#e3f2fd",
  color: "#0d47a1",
  whiteSpace: "nowrap",
  textAlign: "left",
  fontWeight: "bold",
  position: "sticky",
  top: 0,
  zIndex: 1
};

const customerTdStyle = {
  border: "1px solid #e1e5e9",
  padding: "10px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle"
};

const customerRowStyle = {
  transition: "background 0.15s ease",
  borderLeft: "4px solid #1976d2"
};

const openButton = {
  padding: "7px 12px",
  background: "#1565c0",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "11px"
};

const customerHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  padding: "11px",
  background: "#f5f7fa",
  borderRadius: "8px",
  marginBottom: "12px"
};

const actionBox = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "13px"
};

const grayButton = {
  padding: "9px 13px",
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const paymentButton = {
  padding: "9px 13px",
  background: "#6a1b9a",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const refreshButton = {
  padding: "9px 13px",
  background: "#0277bd",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(150px,1fr))",
  gap: "9px",
  marginBottom: "14px"
};

const clickableSummaryButton = {
  position: "relative",
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  width: "100%",
  cursor: "pointer",
  textAlign: "left"
};

const clickHint = {
  position: "absolute",
  right: "7px",
  bottom: "5px",
  fontSize: "10px",
  color: "#1565c0",
  fontWeight: "bold"
};

const paymentRuleBox = {
  padding: "12px",
  marginBottom: "14px",
  borderRadius: "8px",
  background: "#f3e5f5",
  border: "1px solid #ce93d8",
  color: "#4a148c",
  fontSize: "12px"
};

const distributionBox = {
  marginTop: "15px",
  padding: "14px",
  borderRadius: "9px",
  background: "#f8fafc",
  border: "1px solid #d9e0e7"
};

const distributionRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  padding: "9px 0",
  borderBottom:
    "1px solid #e5e7eb",
  fontSize: "13px"
};

const billDetailBox = {
  marginTop: "10px",
  padding: "14px",
  background: "#f8fafc",
  border: "1px solid #d9e0e7",
  borderRadius: "10px",
  marginBottom: "15px"
};

const detailHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px"
};

const closeButton = {
  padding: "7px 11px",
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const subHeading = {
  margin: "16px 0 9px",
  fontSize: "16px"
};

const emptyBox = {
  padding: "20px",
  textAlign: "center",
  color: "#777",
  background: "#f7f8fa",
  borderRadius: "7px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px"
};

const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  background: "#f1f5f9",
  whiteSpace: "nowrap"
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  whiteSpace: "nowrap"
};

export default CustomerLedger;