import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://shivam-medical-erp.onrender.com";

function CustomerPayment({
  setPage,
  goBack,
}) {
  const [customer, setCustomer] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [mode, setMode] =
    useState("Cash");

  const [note, setNote] =
    useState("");

  const [refresh, setRefresh] =
    useState(0);

  const [saving, setSaving] =
    useState(false);

  // =====================================================
  // HELPERS
  // =====================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) ||
          "[]"
      );

      return Array.isArray(data)
        ? data
        : [];
    } catch {
      return [];
    }
  };

  const saveArray = (
    key,
    data
  ) => {
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );
  };

  const roundMoney = (value) => {
    const n = Number(value);

    if (!Number.isFinite(n)) {
      return 0;
    }

    return Math.round(
      (n + Number.EPSILON) * 100
    ) / 100;
  };

  const money = (value) =>
    `₹${roundMoney(value).toFixed(
      2
    )}`;

  const normalizeMobile = (
    value
  ) => {
    return String(value ?? "")
      .replace(/\D/g, "")
      .slice(-10);
  };

  const normalizeName = (
    value
  ) => {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  // =====================================================
  // CUSTOMER NAME
  // =====================================================

  const getCustomerName = (
    item
  ) => {
    if (!item) {
      return "";
    }

    const values = [
      item.customerName,
      item.name,
      item.customer,
      item.partyName,
      item.clientName,
    ];

    for (const value of values) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return "";
  };

  // =====================================================
  // CUSTOMER MOBILE
  // =====================================================

  const getCustomerMobile = (
    item
  ) => {
    if (!item) {
      return "";
    }

    const values = [
      item.customerMobile,
      item.mobile,
      item.phone,
      item.customerPhone,
      item.partyMobile,
    ];

    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim()
      ) {
        return String(value).trim();
      }
    }

    return "";
  };

  // =====================================================
  // SAME CUSTOMER
  // =====================================================

  const isSameCustomer = (
    item,
    name,
    mobileNo
  ) => {
    if (!item) {
      return false;
    }

    const itemName =
      normalizeName(
        getCustomerName(item)
      );

    const itemMobile =
      normalizeMobile(
        getCustomerMobile(item)
      );

    const customerName =
      normalizeName(name);

    const customerMobile =
      normalizeMobile(
        mobileNo
      );

    if (
      customerMobile &&
      itemMobile &&
      customerMobile ===
        itemMobile
    ) {
      return true;
    }

    if (
      customerName &&
      itemName &&
      customerName ===
        itemName
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // BILL TOTAL
  // =====================================================

  const getBillTotal = (
    bill
  ) => {
    if (!bill) {
      return 0;
    }

    const fields = [
      "grandTotal",
      "totalAmount",
      "billTotal",
      "netTotal",
      "finalTotal",
      "payableAmount",
      "netAmount",
      "total",
    ];

    for (const field of fields) {
      const value = Number(
        bill[field]
      );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        return roundMoney(value);
      }
    }

    const items =
      bill.items ||
      bill.billItems ||
      bill.products ||
      [];

    if (
      Array.isArray(items)
    ) {
      let total = 0;

      items.forEach(
        (item) => {
          const qty = Number(
            item.quantity ??
              item.qty ??
              item.saleQty ??
              0
          );

          const rate = Number(
            item.saleRate ??
              item.sellingRate ??
              item.rate ??
              item.price ??
              item.mrp ??
              0
          );

          if (
            qty > 0 &&
            rate > 0
          ) {
            total +=
              qty * rate;
          }
        }
      );

      return roundMoney(total);
    }

    return 0;
  };

  // =====================================================
  // BILL PAYMENT
  // =====================================================

  const getBillPaid = (
    bill
  ) => {
    if (!bill) {
      return 0;
    }

    const fields = [
      "paidNow",
      "billPaid",
      "paidAtBill",
      "paymentReceivedAtBill",
    ];

    for (const field of fields) {
      if (
        bill[field] !==
          undefined &&
        bill[field] !== null &&
        bill[field] !== ""
      ) {
        const value = Number(
          bill[field]
        );

        if (
          Number.isFinite(value) &&
          value > 0
        ) {
          return roundMoney(
            value
          );
        }
      }
    }

    return 0;
  };

  // =====================================================
  // ADVANCE ADJUSTMENT
  // =====================================================

  const getBillAdvanceAdjusted = (
    bill
  ) => {
    if (!bill) {
      return 0;
    }

    const fields = [
      "advanceAdjusted",
      "advanceAdjustment",
      "adjustedAdvance",
      "advanceUsed",
      "advanceUsedAmount",
      "advanceApplied",
      "advanceAppliedAmount",
    ];

    for (const field of fields) {
      const value = Number(
        bill[field]
      );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =====================================================
  // BILL UDHARI
  // =====================================================

  const getBillUdhari = (
    bill
  ) => {
    const total =
      getBillTotal(bill);

    const paid =
      getBillPaid(bill);

    const advanceAdjusted =
      getBillAdvanceAdjusted(
        bill
      );

    return roundMoney(
      Math.max(
        0,
        total -
          paid -
          advanceAdjusted
      )
    );
  };

  // =====================================================
  // PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (
    payment
  ) => {
    if (!payment) {
      return 0;
    }

    const fields = [
      "amount",
      "paidAmount",
      "payment",
    ];

    for (const field of fields) {
      const value = Number(
        payment[field]
      );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =====================================================
  // PAYMENT UDHARI ADJUSTMENT
  // =====================================================

  const getPaymentAdjustment = (
    payment
  ) => {
    if (!payment) {
      return 0;
    }

    const fields = [
      "adjustedToUdhari",
      "udhariAdjustment",
      "adjustedUdhari",
      "creditAdjustment",
      "adjustedCredit",
    ];

    for (const field of fields) {
      const value = Number(
        payment[field]
      );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =====================================================
  // GET BILLS
  // =====================================================

  const bills = useMemo(
    () =>
      loadArray("bills"),
    [refresh]
  );

  // =====================================================
  // GET PAYMENTS
  // =====================================================

  const payments = useMemo(
    () =>
      loadArray(
        "customerPayments"
      ),
    [refresh]
  );

  // =====================================================
  // SELECTED CUSTOMER
  // =====================================================

  useEffect(() => {
    try {
      const selected =
        JSON.parse(
          localStorage.getItem(
            "selectedCustomerForPayment"
          ) || "null"
        );

      if (selected) {
        setCustomer(
          selected.customer ||
            selected.customerName ||
            selected.name ||
            ""
        );

        setMobile(
          selected.mobile ||
            selected.customerMobile ||
            selected.phone ||
            ""
        );
      }
    } catch {
      // ignore
    }
  }, []);

  // =====================================================
  // EVENTS
  // =====================================================

  useEffect(() => {
    const refreshData =
      () => {
        setRefresh(
          (value) =>
            value + 1
        );
      };

    window.addEventListener(
      "customerPaymentUpdated",
      refreshData
    );

    window.addEventListener(
      "customerLedgerUpdated",
      refreshData
    );

    window.addEventListener(
      "billUpdated",
      refreshData
    );

    window.addEventListener(
      "billingUpdated",
      refreshData
    );

    window.addEventListener(
      "customerAdvanceUpdated",
      refreshData
    );

    return () => {
      window.removeEventListener(
        "customerPaymentUpdated",
        refreshData
      );

      window.removeEventListener(
        "customerLedgerUpdated",
        refreshData
      );

      window.removeEventListener(
        "billUpdated",
        refreshData
      );

      window.removeEventListener(
        "billingUpdated",
        refreshData
      );

      window.removeEventListener(
        "customerAdvanceUpdated",
        refreshData
      );
    };
  }, []);

  // =====================================================
  // CUSTOMER BILLS
  // =====================================================

  const customerBills =
    useMemo(() => {
      return bills.filter(
        (bill) =>
          isSameCustomer(
            bill,
            customer,
            mobile
          )
      );
    }, [
      bills,
      customer,
      mobile,
    ]);

  // =====================================================
  // TOTAL BILL
  // =====================================================

  const totalBills =
    useMemo(() => {
      return roundMoney(
        customerBills.reduce(
          (sum, bill) =>
            sum +
            getBillTotal(
              bill
            ),
          0
        )
      );
    }, [customerBills]);

  // =====================================================
  // BILL-TIME PAID
  // =====================================================

  const totalBillPaid =
    useMemo(() => {
      return roundMoney(
        customerBills.reduce(
          (sum, bill) =>
            sum +
            getBillPaid(
              bill
            ),
          0
        )
      );
    }, [customerBills]);

  // =====================================================
  // BILL UDHARI
  // =====================================================

  const totalUdhari =
    useMemo(() => {
      return roundMoney(
        customerBills.reduce(
          (sum, bill) =>
            sum +
            getBillUdhari(
              bill
            ),
          0
        )
      );
    }, [customerBills]);

  // =====================================================
  // PAYMENT RECEIVED
  // =====================================================

  const totalPayment =
    useMemo(() => {
      return roundMoney(
        payments
          .filter(
            (payment) =>
              isSameCustomer(
                payment,
                customer,
                mobile
              )
          )
          .reduce(
            (sum, payment) =>
              sum +
              getPaymentAmount(
                payment
              ),
            0
          )
      );
    }, [
      payments,
      customer,
      mobile,
    ]);

  // =====================================================
  // CURRENT UDHARI
  // =====================================================

  const currentUdhari =
    useMemo(() => {
      return roundMoney(
        Math.max(
          0,
          totalUdhari -
            totalPayment
        )
      );
    }, [
      totalUdhari,
      totalPayment,
    ]);

  // =====================================================
  // ADVANCE
  // =====================================================

  const advances = useMemo(
    () =>
      loadArray("advances"),
    [refresh]
  );

  const customerAdvances =
    useMemo(
      () =>
        loadArray(
          "customerAdvances"
        ),
      [refresh]
    );

  const currentAdvance =
    useMemo(() => {
      let total = 0;

      advances.forEach(
        (item) => {
          if (
            isSameCustomer(
              item,
              customer,
              mobile
            )
          ) {
            total +=
              Number(
                item.amount ||
                  item.advance ||
                  item.advanceAmount ||
                  0
              );
          }
        }
      );

      customerAdvances.forEach(
        (item) => {
          if (
            isSameCustomer(
              item,
              customer,
              mobile
            )
          ) {
            total +=
              Number(
                item.amount ||
                  item.advance ||
                  item.advanceAmount ||
                  0
              );
          }
        }
      );

      customerBills.forEach(
        (bill) => {
          total -=
            getBillAdvanceAdjusted(
              bill
            );
        }
      );

      return roundMoney(
        Math.max(0, total)
      );
    }, [
      advances,
      customerAdvances,
      customerBills,
      customer,
      mobile,
    ]);

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  const savePayment =
    async () => {
      if (saving) {
        return;
      }

      const cleanCustomer =
        customer.trim();

      const cleanMobile =
        mobile.trim();

      const paymentAmount =
        roundMoney(
          Number(amount)
        );

      if (!cleanCustomer) {
        alert(
          "Customer name डालें"
        );
        return;
      }

      if (
        paymentAmount <= 0
      ) {
        alert(
          "Payment amount डालें"
        );
        return;
      }

      setSaving(true);

      try {
        // -------------------------------------------------
        // LATEST LOCAL DATA
        // -------------------------------------------------

        const latestBills =
          loadArray("bills");

        const existingPayments =
          loadArray(
            "customerPayments"
          );

        // -------------------------------------------------
        // CUSTOMER BILLS
        // -------------------------------------------------

        const latestCustomerBills =
          latestBills.filter(
            (bill) =>
              isSameCustomer(
                bill,
                cleanCustomer,
                cleanMobile
              )
          );

        // -------------------------------------------------
        // ORIGINAL UDHARI
        // -------------------------------------------------

        const originalUdhari =
          roundMoney(
            latestCustomerBills.reduce(
              (sum, bill) =>
                sum +
                getBillUdhari(
                  bill
                ),
              0
            )
          );

        // -------------------------------------------------
        // PREVIOUS CUSTOMER PAYMENTS
        // -------------------------------------------------

        const previousPayments =
          existingPayments.filter(
            (payment) =>
              isSameCustomer(
                payment,
                cleanCustomer,
                cleanMobile
              )
          );

        const alreadyPaid =
          roundMoney(
            previousPayments.reduce(
              (sum, payment) =>
                sum +
                getPaymentAmount(
                  payment
                ),
              0
            )
          );

        // -------------------------------------------------
        // CURRENT UDHARI
        // -------------------------------------------------

        const currentOutstanding =
          roundMoney(
            Math.max(
              0,
              originalUdhari -
                alreadyPaid
            )
          );

        // -------------------------------------------------
        // PAYMENT SPLIT
        //
        // पहले Udhari
        // फिर Advance
        // -------------------------------------------------

        const udhariPayment =
          roundMoney(
            Math.min(
              paymentAmount,
              currentOutstanding
            )
          );

        const advanceAdded =
          roundMoney(
            Math.max(
              0,
              paymentAmount -
                currentOutstanding
            )
          );

        // -------------------------------------------------
        // BILL ALLOCATION
        // OLDEST FIRST
        // -------------------------------------------------

        const allocations =
          [];

        let remaining =
          udhariPayment;

        const sortedBills =
          [
            ...latestCustomerBills,
          ].sort(
            (a, b) => {
              const aTime =
                new Date(
                  a.createdAt ||
                    a.date ||
                    0
                ).getTime();

              const bTime =
                new Date(
                  b.createdAt ||
                    b.date ||
                    0
                ).getTime();

              return (
                aTime - bTime
              );
            }
          );

        sortedBills.forEach(
          (
            bill,
            index
          ) => {
            if (
              remaining <= 0
            ) {
              return;
            }

            const billUdhari =
              getBillUdhari(
                bill
              );

            if (
              billUdhari <= 0
            ) {
              return;
            }

            const allocated =
              roundMoney(
                Math.min(
                  billUdhari,
                  remaining
                )
              );

            if (
              allocated > 0
            ) {
              allocations.push({
                billId:
                  bill.id ||
                  bill.billId ||
                  null,

                billNo:
                  bill.billNo ||
                  bill.billNumber ||
                  null,

                billIndex:
                  index,

                amount:
                  allocated,
              });

              remaining =
                roundMoney(
                  remaining -
                    allocated
                );
            }
          }
        );

        // -------------------------------------------------
        // PAYMENT OBJECT
        // -------------------------------------------------

        const now =
          new Date();

        const paymentId =
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;

        const newPayment = {
          id: paymentId,

          customer:
            cleanCustomer,

          customerName:
            cleanCustomer,

          name:
            cleanCustomer,

          mobile:
            cleanMobile,

          phone:
            cleanMobile,

          customerMobile:
            cleanMobile,

          amount:
            paymentAmount,

          paidAmount:
            paymentAmount,

          payment:
            paymentAmount,

          mode,

          paymentMode:
            mode,

          note:
            note.trim(),

          date:
            now.toISOString(),

          paymentDate:
            now.toISOString(),

          time:
            now.toLocaleTimeString(
              "en-IN"
            ),

          adjustedToUdhari:
            udhariPayment,

          udhariAdjustment:
            udhariPayment,

          isAdvance:
            advanceAdded > 0,

          advanceAmount:
            advanceAdded,

          adjustedToAdvance:
            advanceAdded,

          allocations,

          createdAt:
            now.toISOString(),
        };

        // -------------------------------------------------
        // ONLINE POSTGRESQL SAVE
        // -------------------------------------------------

        const response =
          await fetch(
            `${API_URL}/api/customer-payments`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                newPayment
              ),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              `HTTP ${response.status}`
          );
        }

        console.log(
          "✅ CUSTOMER PAYMENT SAVED ONLINE",
          data.payment
        );

        // -------------------------------------------------
        // LOCAL SAVE
        // -------------------------------------------------

        saveArray(
          "customerPayments",
          [
            ...existingPayments,
            newPayment,
          ]
        );

        // -------------------------------------------------
        // ADVANCE LOCAL DATA
        // -------------------------------------------------

        if (
          advanceAdded > 0
        ) {
          const oldAdvances =
            loadArray(
              "advances"
            );

          const oldCustomerAdvances =
            loadArray(
              "customerAdvances"
            );

          const advanceEntry = {
            id:
              `ADV-${paymentId}`,

            customer:
              cleanCustomer,

            customerName:
              cleanCustomer,

            name:
              cleanCustomer,

            mobile:
              cleanMobile,

            customerMobile:
              cleanMobile,

            amount:
              advanceAdded,

            advance:
              advanceAdded,

            advanceAmount:
              advanceAdded,

            mode,

            paymentMode:
              mode,

            note:
              note.trim(),

            date:
              now.toISOString(),

            createdAt:
              now.toISOString(),

            source:
              "customerPayment",
          };

          saveArray(
            "advances",
            [
              ...oldAdvances,
              advanceEntry,
            ]
          );

          saveArray(
            "customerAdvances",
            [
              ...oldCustomerAdvances,
              advanceEntry,
            ]
          );
        }

        // -------------------------------------------------
        // EVENTS
        // -------------------------------------------------

        window.dispatchEvent(
          new Event(
            "customerPaymentUpdated"
          )
        );

        window.dispatchEvent(
          new Event(
            "customerLedgerUpdated"
          )
        );

        window.dispatchEvent(
          new Event(
            "customerAdvanceUpdated"
          )
        );

        window.dispatchEvent(
          new Event("storage")
        );

        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        alert(
          `Payment ${money(
            paymentAmount
          )} successfully saved online.`
        );

        setAmount("");
        setNote("");

        setRefresh(
          (value) =>
            value + 1
        );
      } catch (error) {
        console.error(
          "CUSTOMER PAYMENT SAVE ERROR:",
          error
        );

        alert(
          "Payment online save नहीं हुआ.\n\n" +
            error.message
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // RECENT PAYMENTS
  // =====================================================

  const recentPayments =
    useMemo(() => {
      return payments
        .filter(
          (payment) =>
            isSameCustomer(
              payment,
              customer,
              mobile
            )
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt ||
                b.date ||
                0
            ).getTime() -
            new Date(
              a.createdAt ||
                a.date ||
                0
            ).getTime()
        )
        .slice(0, 10);
    }, [
      payments,
      customer,
      mobile,
    ]);

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    if (
      typeof goBack ===
      "function"
    ) {
      goBack();
      return;
    }

    if (
      typeof setPage ===
      "function"
    ) {
      setPage(
        "customerLedger"
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "#f5f7fa",
        padding:
          "15px",
        boxSizing:
          "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap:
            "10px",
          flexWrap:
            "wrap",
          marginBottom:
            "15px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            💰 Customer Payment
          </h2>

          <div
            style={{
              color:
                "#777",
              fontSize:
                "13px",
              marginTop:
                "5px",
            }}
          >
            Online PostgreSQL Payment
          </div>
        </div>

        <button
          onClick={
            handleBack
          }
          style={{
            padding:
              "10px 15px",
            border:
              "none",
            borderRadius:
              "7px",
            background:
              "#555",
            color:
              "#fff",
            fontWeight:
              "700",
            cursor:
              "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {/* CUSTOMER */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            "10px",
          padding:
            "15px",
          marginBottom:
            "15px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Customer
        </h3>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap:
              "10px",
          }}
        >
          <div>
            <label>
              Customer Name
            </label>

            <input
              value={
                customer
              }
              onChange={(e) =>
                setCustomer(
                  e.target.value
                )
              }
              placeholder="Customer name"
              style={{
                width:
                  "100%",
                padding:
                  "11px",
                marginTop:
                  "5px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #ccc",
                borderRadius:
                  "7px",
                fontSize:
                  "16px",
              }}
            />
          </div>

          <div>
            <label>
              Mobile
            </label>

            <input
              value={
                mobile
              }
              onChange={(e) =>
                setMobile(
                  e.target.value
                )
              }
              placeholder="Mobile number"
              maxLength={10}
              style={{
                width:
                  "100%",
                padding:
                  "11px",
                marginTop:
                  "5px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #ccc",
                borderRadius:
                  "7px",
                fontSize:
                  "16px",
              }}
            />
          </div>
        </div>
      </div>

      {/* BALANCE */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap:
            "10px",
          marginBottom:
            "15px",
        }}
      >
        <div
          style={{
            background:
              "#fff",
            padding:
              "15px",
            borderRadius:
              "10px",
          }}
        >
          <div
            style={{
              color:
                "#777",
            }}
          >
            Total Bill
          </div>

          <strong
            style={{
              fontSize:
                "20px",
            }}
          >
            {money(
              totalBills
            )}
          </strong>
        </div>

        <div
          style={{
            background:
              "#fff",
            padding:
              "15px",
            borderRadius:
              "10px",
          }}
        >
          <div
            style={{
              color:
                "#777",
            }}
          >
            Bill Udhari
          </div>

          <strong
            style={{
              fontSize:
                "20px",
              color:
                "#d32f2f",
            }}
          >
            {money(
              totalUdhari
            )}
          </strong>
        </div>

        <div
          style={{
            background:
              "#fff",
            padding:
              "15px",
            borderRadius:
              "10px",
          }}
        >
          <div
            style={{
              color:
                "#777",
            }}
          >
            Payment Received
          </div>

          <strong
            style={{
              fontSize:
                "20px",
              color:
                "#2e7d32",
            }}
          >
            {money(
              totalPayment
            )}
          </strong>
        </div>

        <div
          style={{
            background:
              "#fff",
            padding:
              "15px",
            borderRadius:
              "10px",
          }}
        >
          <div
            style={{
              color:
                "#777",
            }}
          >
            Current Udhari
          </div>

          <strong
            style={{
              fontSize:
                "20px",
              color:
                currentUdhari >
                0
                  ? "#d32f2f"
                  : "#2e7d32",
            }}
          >
            {money(
              currentUdhari
            )}
          </strong>
        </div>

        <div
          style={{
            background:
              "#fff",
            padding:
              "15px",
            borderRadius:
              "10px",
          }}
        >
          <div
            style={{
              color:
                "#777",
            }}
          >
            Advance
          </div>

          <strong
            style={{
              fontSize:
                "20px",
              color:
                "#1565c0",
            }}
          >
            {money(
              currentAdvance
            )}
          </strong>
        </div>
      </div>

      {/* PAYMENT FORM */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            "10px",
          padding:
            "15px",
          marginBottom:
            "15px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          💰 Receive Payment
        </h3>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap:
              "10px",
          }}
        >
          <div>
            <label>
              Amount
            </label>

            <input
              type="number"
              value={
                amount
              }
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              placeholder="₹ Amount"
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                marginTop:
                  "5px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #ccc",
                borderRadius:
                  "7px",
                fontSize:
                  "18px",
              }}
            />
          </div>

          <div>
            <label>
              Payment Mode
            </label>

            <select
              value={
                mode
              }
              onChange={(e) =>
                setMode(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                marginTop:
                  "5px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #ccc",
                borderRadius:
                  "7px",
                fontSize:
                  "16px",
              }}
            >
              <option>
                Cash
              </option>
              <option>
                UPI
              </option>
              <option>
                Card
              </option>
              <option>
                Bank
              </option>
              <option>
                Other
              </option>
            </select>
          </div>

          <div>
            <label>
              Remark
            </label>

            <input
              type="text"
              value={
                note
              }
              onChange={(e) =>
                setNote(
                  e.target.value
                )
              }
              placeholder="Remark"
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                marginTop:
                  "5px",
                boxSizing:
                  "border-box",
                border:
                  "1px solid #ccc",
                borderRadius:
                  "7px",
                fontSize:
                  "16px",
              }}
            />
          </div>
        </div>

        {/* PREVIEW */}

        {Number(
          amount
        ) > 0 && (
          <div
            style={{
              marginTop:
                "15px",
              padding:
                "12px",
              borderRadius:
                "8px",
              background:
                "#f1f8e9",
            }}
          >
            <strong>
              Payment Preview
            </strong>

            <div
              style={{
                marginTop:
                  "8px",
              }}
            >
              Payment:{" "}
              {money(
                Number(
                  amount
                )
              )}
            </div>

            <div>
              Udhari में जाएगा:{" "}
              {money(
                Math.min(
                  Number(
                    amount
                  ),
                  currentUdhari
                )
              )}
            </div>

            <div>
              Advance बनेगा:{" "}
              {money(
                Math.max(
                  0,
                  Number(
                    amount
                  ) -
                    currentUdhari
                )
              )}
            </div>
          </div>
        )}

        <button
          onClick={
            savePayment
          }
          disabled={
            saving
          }
          style={{
            width:
              "100%",
            marginTop:
              "15px",
            padding:
              "13px",
            border:
              "none",
            borderRadius:
              "8px",
            background:
              saving
                ? "#999"
                : "#2e7d32",
            color:
              "#fff",
            fontSize:
              "17px",
            fontWeight:
              "700",
            cursor:
              saving
                ? "not-allowed"
                : "pointer",
          }}
        >
          {saving
            ? "⏳ Saving Online..."
            : "💾 Save Customer Payment"}
        </button>

        <div
          style={{
            marginTop:
              "12px",
            padding:
              "10px",
            background:
              "#fff8e1",
            borderRadius:
              "7px",
            fontSize:
              "13px",
            color:
              "#795548",
          }}
        >
          <strong>
            Payment Rule:
          </strong>

          <br />

          पहले Customer की Udhari
          adjust होगी।

          <br />

          Udhari से ज्यादा payment
          होने पर बाकी amount
          Advance बनेगा।

          <br />

          Bill का Paid field
          change नहीं होगा।

          <br />

          Payment PostgreSQL में
          online save होगा।
        </div>
      </div>

      {/* RECENT PAYMENTS */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            "10px",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            padding:
              "12px",
            fontWeight:
              "700",
            borderBottom:
              "1px solid #eee",
          }}
        >
          💰 Recent Payments
        </div>

        {recentPayments.length ===
        0 ? (
          <div
            style={{
              padding:
                "20px",
              textAlign:
                "center",
              color:
                "#777",
            }}
          >
            No payment entries
          </div>
        ) : (
          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "650px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "#f0f2f5",
                  }}
                >
                  <th
                    style={{
                      padding:
                        "9px",
                      textAlign:
                        "left",
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      padding:
                        "9px",
                      textAlign:
                        "left",
                    }}
                  >
                    Mode
                  </th>

                  <th
                    style={{
                      padding:
                        "9px",
                      textAlign:
                        "right",
                    }}
                  >
                    Payment
                  </th>

                  <th
                    style={{
                      padding:
                        "9px",
                      textAlign:
                        "right",
                    }}
                  >
                    Udhari Adjust
                  </th>

                  <th
                    style={{
                      padding:
                        "9px",
                      textAlign:
                        "right",
                    }}
                  >
                    Advance
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentPayments.map(
                  (
                    payment,
                    index
                  ) => {
                    const date =
                      payment.date ||
                      payment.createdAt;

                    let dateText =
                      "-";

                    if (date) {
                      const d =
                        new Date(
                          date
                        );

                      if (
                        !Number.isNaN(
                          d.getTime()
                        )
                      ) {
                        dateText =
                          d.toLocaleDateString(
                            "en-IN"
                          );
                      }
                    }

                    return (
                      <tr
                        key={
                          payment.id ||
                          `payment-${index}`
                        }
                        style={{
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "9px",
                          }}
                        >
                          {
                            dateText
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "9px",
                          }}
                        >
                          {
                            payment.mode ||
                            payment.paymentMode ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                            color:
                              "#2e7d32",
                            fontWeight:
                              "700",
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
                            padding:
                              "9px",
                            textAlign:
                              "right",
                            color:
                              "#1565c0",
                          }}
                        >
                          {money(
                            getPaymentAdjustment(
                              payment
                            )
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                            color:
                              "#1565c0",
                          }}
                        >
                          {money(
                            payment.advanceAmount ||
                              0
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
      </div>
    </div>
  );
}

export default CustomerPayment;