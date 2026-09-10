
import React, { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://shivam-medical-erp.onrender.com";

function CustomerLedger({ setPage, goBack }) {
  // =========================================================
  // STATE
  // =========================================================

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [showBills, setShowBills] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [onlineBills, setOnlineBills] = useState([]);

  // =========================================================
  // BASIC HELPERS
  // =========================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const loadObject = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  };

  const roundMoney = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  };

  const money = (value) => {
    return `₹${roundMoney(value).toFixed(2)}`;
  };

  const normalizeText = (value) => {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  const normalizeName = (value) => {
    return normalizeText(value);
  };

  const normalizeMobile = (value) => {
    return String(value ?? "").replace(/\D/g, "").slice(-10);
  };

  const makeCustomerKey = (name, mobile) => {
    const m = normalizeMobile(mobile);
    const n = normalizeName(name);

    if (m) return `mobile:${m}`;
    if (n) return `name:${n}`;

    return "";
  };

  // =========================================================
  // CUSTOMER NAME — ROBUST
  // =========================================================

  const getCustomerName = (item) => {
    if (!item) return "";

    const direct =
      item.customer ??
      item.customerName ??
      item.name ??
      item.partyName ??
      item.party ??
      item.clientName ??
      item.customer_name ??
      item.customername ??
      "";

    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }

    // Nested customer object support
    if (item.customer && typeof item.customer === "object") {
      return (
        item.customer.name ||
        item.customer.customerName ||
        item.customer.customer_name ||
        ""
      );
    }

    if (item.customerDetails && typeof item.customerDetails === "object") {
      return (
        item.customerDetails.name ||
        item.customerDetails.customerName ||
        item.customerDetails.customer_name ||
        ""
      );
    }

    return "";
  };

  // =========================================================
  // CUSTOMER MOBILE — ROBUST
  // =========================================================

  const getCustomerMobile = (item) => {
    if (!item) return "";

    const direct =
      item.mobile ??
      item.phone ??
      item.customerMobile ??
      item.customerPhone ??
      item.partyMobile ??
      item.partyPhone ??
      item.clientMobile ??
      item.customer_mobile ??
      item.customer_phone ??
      "";

    if (
      typeof direct === "string" ||
      typeof direct === "number"
    ) {
      if (String(direct).trim()) {
        return String(direct).trim();
      }
    }

    // Nested customer object
    if (item.customer && typeof item.customer === "object") {
      return (
        item.customer.mobile ||
        item.customer.phone ||
        item.customer.customerMobile ||
        item.customer.customerPhone ||
        ""
      );
    }

    if (item.customerDetails && typeof item.customerDetails === "object") {
      return (
        item.customerDetails.mobile ||
        item.customerDetails.phone ||
        item.customerDetails.customerMobile ||
        ""
      );
    }

    return "";
  };

  // =========================================================
  // ACTIVITY TIME
  // =========================================================

  const getActivityTime = (item) => {
    if (!item) return 0;

    const candidates = [
      item.updatedAt,
      item.createdAt,
      item.date,
      item.billDate,
      item.created_at,
      item.updated_at,
      item.timestamp,
    ];

    for (const value of candidates) {
      if (!value) continue;

      const time = new Date(value).getTime();

      if (Number.isFinite(time)) {
        return time;
      }

      const numeric = Number(value);

      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }

    return 0;
  };

  // =========================================================
  // BILL TOTAL
  // =========================================================

  const getBillTotal = (bill) => {
    if (!bill) return 0;

    const directFields = [
      "total",
      "grandTotal",
      "totalAmount",
      "billTotal",
      "netTotal",
      "amount",
      "finalTotal",
      "payableAmount",
      "netAmount",
      "grand_total",
      "total_amount",
    ];

    for (const field of directFields) {
      const value = Number(bill[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    // Nested totals
    if (bill.summary && typeof bill.summary === "object") {
      const nestedFields = [
        "total",
        "grandTotal",
        "totalAmount",
        "netTotal",
        "amount",
      ];

      for (const field of nestedFields) {
        const value = Number(bill.summary[field]);

        if (Number.isFinite(value)) {
          return roundMoney(value);
        }
      }
    }

    // Calculate from items
    const items =
      bill.items ||
      bill.billItems ||
      bill.products ||
      bill.medicines ||
      [];

    if (Array.isArray(items)) {
      let total = 0;

      items.forEach((item) => {
        const qty = Number(
          item.quantity ??
            item.qty ??
            item.saleQty ??
            item.soldQuantity ??
            0
        );

        const rate = Number(
          item.saleRate ??
            item.sellingRate ??
            item.rate ??
            item.mrp ??
            item.price ??
            0
        );

        const itemTotal = Number(
          item.total ??
            item.amount ??
            item.itemTotal ??
            item.lineTotal
        );

        if (Number.isFinite(itemTotal)) {
          total += itemTotal;
        } else {
          total += qty * rate;
        }
      });

      return roundMoney(total);
    }

    return 0;
  };

  // =========================================================
  // BILL PAID
  // =========================================================

  const getBillPaid = (bill) => {
    if (!bill) return 0;

    const directFields = [
      "billPaid",
      "paidNow",
      "jama",
      "paidAtBill",
      "paymentReceived",
      "receivedAtBill",
      "paidAmount",
      "receivedAmount",
      "received",
      "paid",
      "payment",
      "cashReceived",
      "cashPaid",
      "paid_amount",
    ];

    for (const field of directFields) {
      const value = Number(bill[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =========================================================
  // ADVANCE ADJUSTED IN BILL
  // =========================================================

  const getBillAdvanceAdjusted = (bill) => {
    if (!bill) return 0;

    const fields = [
      "advanceAdjusted",
      "advanceAdjustment",
      "adjustedAdvance",
      "advanceUsed",
      "advanceUsedAmount",
      "oldAdvanceAdjusted",
      "advanceApplied",
      "advance_adjusted",
      "advance_adjustment",
      "advance_used",
      "advanceAppliedAmount",
    ];

    for (const field of fields) {
      const value = Number(bill[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =========================================================
  // BILL UDHARI
  // =========================================================

  const getBillUdhari = (bill) => {
    if (!bill) return 0;

    const fields = [
      "udhari",
      "credit",
      "creditAmount",
      "pending",
      "pendingAmount",
      "balance",
      "due",
      "dueAmount",
      "remaining",
      "remainingAmount",
      "udhariAmount",
      "credit_amount",
      "pending_amount",
    ];

    for (const field of fields) {
      const value = Number(bill[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    const total = getBillTotal(bill);
    const paid = getBillPaid(bill);
    const advanceAdjusted = getBillAdvanceAdjusted(bill);

    const calculated = total - paid - advanceAdjusted;

    return calculated > 0 ? roundMoney(calculated) : 0;
  };

  // =========================================================
  // PAYMENT AMOUNT
  // =========================================================

  const getPaymentAmount = (payment) => {
    if (!payment) return 0;

    const fields = [
      "amount",
      "paymentAmount",
      "paidAmount",
      "jama",
      "received",
      "receivedAmount",
      "payment",
      "value",
    ];

    for (const field of fields) {
      const value = Number(payment[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =========================================================
  // SAVED UDHARI ADJUSTMENT
  // =========================================================

  const getSavedUdhariAdjustment = (payment) => {
    if (!payment) return 0;

    const fields = [
      "udhariAdjustment",
      "adjustedUdhari",
      "creditAdjustment",
      "adjustedCredit",
    ];

    for (const field of fields) {
      const value = Number(payment[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =========================================================
  // SAVED ADVANCE
  // =========================================================

  const getSavedAdvance = (item) => {
    if (!item) return 0;

    const fields = [
      "advance",
      "advanceAmount",
      "customerAdvance",
      "advancePaid",
      "advanceReceived",
      "amount",
    ];

    for (const field of fields) {
      const value = Number(item[field]);

      if (Number.isFinite(value)) {
        return roundMoney(value);
      }
    }

    return 0;
  };

  // =========================================================
  // CUSTOMER MATCH
  // =========================================================

  const customerMatches = (item, customer) => {
    if (!item || !customer) return false;

    const itemName = normalizeName(getCustomerName(item));
    const itemMobile = normalizeMobile(getCustomerMobile(item));

    const customerName = normalizeName(customer.name);
    const customerMobile = normalizeMobile(customer.mobile);

    if (
      itemMobile &&
      customerMobile &&
      itemMobile === customerMobile
    ) {
      return true;
    }

    if (
      itemName &&
      customerName &&
      itemName === customerName
    ) {
      return true;
    }

    return false;
  };

  // =========================================================
  // FETCH ONLINE BILLS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchBills = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bills`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Bills API HTTP ${response.status}`
          );
        }

        const data = await response.json();

        let billsData = [];

        if (Array.isArray(data)) {
          billsData = data;
        } else if (
          data &&
          Array.isArray(data.bills)
        ) {
          billsData = data.bills;
        } else if (
          data &&
          Array.isArray(data.data)
        ) {
          billsData = data.data;
        }

        if (mounted) {
          console.log(
            "✅ Customer Ledger: Online bills loaded:",
            billsData.length
          );

          console.log(
            "🧾 ONLINE BILL DATA:",
            billsData
          );

          setOnlineBills(billsData);
        }
      } catch (error) {
        console.error(
          "❌ Customer Ledger bills fetch error:",
          error
        );

        if (mounted) {
          setOnlineBills([]);
        }
      }
    };

    fetchBills();

    return () => {
      mounted = false;
    };
  }, [refresh]);

  // =========================================================
  // AUTO REFRESH
  // =========================================================

  useEffect(() => {
    const handleRefresh = () => {
      setRefresh((v) => v + 1);
    };

    window.addEventListener(
      "customerLedgerUpdated",
      handleRefresh
    );

    window.addEventListener(
      "advanceUpdated",
      handleRefresh
    );

    window.addEventListener(
      "billingUpdated",
      handleRefresh
    );

    window.addEventListener(
      "storage",
      handleRefresh
    );

    window.addEventListener(
      "focus",
      handleRefresh
    );

    return () => {
      window.removeEventListener(
        "customerLedgerUpdated",
        handleRefresh
      );

      window.removeEventListener(
        "advanceUpdated",
        handleRefresh
      );

      window.removeEventListener(
        "billingUpdated",
        handleRefresh
      );

      window.removeEventListener(
        "storage",
        handleRefresh
      );

      window.removeEventListener(
        "focus",
        handleRefresh
      );
    };
  }, []);

  // =========================================================
  // LOCAL DATA
  // =========================================================

  const localBills = useMemo(
    () => loadArray("bills"),
    [refresh]
  );

  const customerPayments = useMemo(
    () => loadArray("customerPayments"),
    [refresh]
  );

  const advances = useMemo(
    () => loadArray("advances"),
    [refresh]
  );

  const customerAdvances = useMemo(
    () => loadArray("customerAdvances"),
    [refresh]
  );

  // =========================================================
  // MERGE ONLINE + LOCAL BILLS
  // =========================================================

  const bills = useMemo(() => {
    const result = [];
    const seen = new Set();

    const addBill = (bill) => {
      if (!bill || typeof bill !== "object") return;

      const id =
        bill.id ??
        bill.billId ??
        bill.billNumber ??
        bill.billNo ??
        "";

      let key = "";

      if (id !== "") {
        key = `id:${String(id)}`;
      } else {
        key = `json:${JSON.stringify(bill)}`;
      }

      if (seen.has(key)) return;

      seen.add(key);
      result.push(bill);
    };

    // ONLINE FIRST
    onlineBills.forEach(addBill);

    // LOCAL SECOND
    localBills.forEach(addBill);

    return result.sort(
      (a, b) =>
        getActivityTime(b) -
        getActivityTime(a)
    );
  }, [onlineBills, localBills]);

  // =========================================================
  // BUILD CUSTOMER LIST
  // =========================================================

  const customers = useMemo(() => {
    const map = new Map();

    const addCustomer = (
      item,
      type = "unknown"
    ) => {
      if (!item) return;

      const name = getCustomerName(item);
      const mobile = getCustomerMobile(item);

      if (!name && !mobile) return;

      const key = makeCustomerKey(
        name,
        mobile
      );

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name:
            name ||
            "Customer",
          mobile:
            mobile ||
            "",
          types: [type],
        });
      } else {
        const existing = map.get(key);

        if (
          name &&
          (!existing.name ||
            existing.name === "Customer")
        ) {
          existing.name = name;
        }

        if (mobile && !existing.mobile) {
          existing.mobile = mobile;
        }

        if (
          type &&
          !existing.types.includes(type)
        ) {
          existing.types.push(type);
        }
      }
    };

    bills.forEach((bill) =>
      addCustomer(bill, "bill")
    );

    customerPayments.forEach((payment) =>
      addCustomer(payment, "payment")
    );

    advances.forEach((advance) =>
      addCustomer(advance, "advance")
    );

    customerAdvances.forEach((advance) =>
      addCustomer(advance, "customerAdvance")
    );

    return Array.from(map.values()).sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: "base",
          }
        )
    );
  }, [
    bills,
    customerPayments,
    advances,
    customerAdvances,
  ]);

  // =========================================================
  // FILTER CUSTOMER
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const q = normalizeText(search);

    if (!q) return customers;

    const digits = normalizeMobile(search);

    return customers.filter((customer) => {
      const nameMatch =
        normalizeName(customer.name).includes(q);

      const mobileMatch =
        normalizeMobile(customer.mobile).includes(
          digits
        );

      return nameMatch || mobileMatch;
    });
  }, [customers, search]);

  // =========================================================
  // SELECTED CUSTOMER BILLS
  // =========================================================

  const selectedBills = useMemo(() => {
    if (!selectedCustomer) return [];

    return bills
      .filter((bill) =>
        customerMatches(
          bill,
          selectedCustomer
        )
      )
      .sort(
        (a, b) =>
          getActivityTime(b) -
          getActivityTime(a)
      );
  }, [bills, selectedCustomer]);

  // =========================================================
  // SELECTED CUSTOMER PAYMENTS
  // =========================================================

  const selectedPayments = useMemo(() => {
    if (!selectedCustomer) return [];

    return customerPayments
      .filter((payment) =>
        customerMatches(
          payment,
          selectedCustomer
        )
      )
      .sort(
        (a, b) =>
          getActivityTime(b) -
          getActivityTime(a)
      );
  }, [
    customerPayments,
    selectedCustomer,
  ]);

  // =========================================================
  // CURRENT ADVANCE
  // =========================================================

  const getCurrentAdvance = (customer) => {
    if (!customer) return 0;

    let totalAdvance = 0;

    advances.forEach((item) => {
      if (
        customerMatches(
          item,
          customer
        )
      ) {
        totalAdvance += getSavedAdvance(item);
      }
    });

    customerAdvances.forEach((item) => {
      if (
        customerMatches(
          item,
          customer
        )
      ) {
        totalAdvance += getSavedAdvance(item);
      }
    });

    selectedBillsForAdvance:
    selectedBills.forEach((bill) => {
      totalAdvance -= getBillAdvanceAdjusted(
        bill
      );
    });

    return roundMoney(
      Math.max(0, totalAdvance)
    );
  };

  // =========================================================
  // CUSTOMER CALCULATION
  // =========================================================

  const getCustomerCalculation = (
    customer
  ) => {
    if (!customer) {
      return {
        totalBills: 0,
        totalPaid: 0,
        totalUdhari: 0,
        totalPayment: 0,
        totalAdvance: 0,
        totalAdvanceAdjusted: 0,
        finalBalance: 0,
      };
    }

    const customerBills = bills.filter(
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

    let totalBills = 0;
    let totalPaid = 0;
    let totalUdhari = 0;
    let totalAdvanceAdjusted = 0;

    customerBills.forEach((bill) => {
      const total = getBillTotal(bill);
      const paid = getBillPaid(bill);
      const advanceAdjusted =
        getBillAdvanceAdjusted(bill);

      totalBills += total;
      totalPaid += paid;
      totalAdvanceAdjusted +=
        advanceAdjusted;

      totalUdhari += getBillUdhari(bill);
    });

    let totalPayment = 0;

    customerPaymentList.forEach(
      (payment) => {
        totalPayment +=
          getPaymentAmount(payment);

        totalUdhari -=
          getSavedUdhariAdjustment(payment);
      }
    );

    totalUdhari = Math.max(
      0,
      totalUdhari
    );

    const totalAdvance =
      getCurrentAdvance(customer);

    const finalBalance =
      totalUdhari -
      totalPayment;

    return {
      totalBills: roundMoney(totalBills),
      totalPaid: roundMoney(totalPaid),
      totalUdhari: roundMoney(totalUdhari),
      totalPayment: roundMoney(totalPayment),
      totalAdvance: roundMoney(totalAdvance),
      totalAdvanceAdjusted:
        roundMoney(
          totalAdvanceAdjusted
        ),
      finalBalance: roundMoney(
        finalBalance
      ),
    };
  };

  const customerCalculation = useMemo(
    () =>
      getCustomerCalculation(
        selectedCustomer
      ),
    [
      selectedCustomer,
      bills,
      customerPayments,
      advances,
      customerAdvances,
    ]
  );

  // =========================================================
  // SELECT CUSTOMER
  // =========================================================

  const handleSelectCustomer = (
    customer
  ) => {
    setSelectedCustomer(customer);
    setShowBills(true);
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    setRefresh((v) => v + 1);
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    if (typeof goBack === "function") {
      goBack();
      return;
    }

    if (typeof setPage === "function") {
      setPage("dashboard");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "15px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "15px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          👤 Customer Ledger
        </h2>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleRefresh}
            style={{
              padding: "9px 14px",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              background: "#1976d2",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            🔄 Refresh
          </button>

          <button
            onClick={handleBack}
            style={{
              padding: "9px 14px",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              background: "#555",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div
        style={{
          background: "#fff",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "15px",
          boxShadow:
            "0 1px 5px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Customer name / mobile search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "7px",
            fontSize: "16px",
            outline: "none",
          }}
        />
      </div>

      {/* CUSTOMER LIST */}
      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow:
            "0 1px 5px rgba(0,0,0,0.08)",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            padding: "12px",
            fontWeight: "700",
            borderBottom:
              "1px solid #eee",
          }}
        >
          Customers ({filteredCustomers.length})
        </div>

        {filteredCustomers.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#777",
            }}
          >
            No customer found
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "500px",
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
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Customer
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    Mobile
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                    }}
                  >
                    Bill
                  </th>

                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                    }}
                  >
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => {
                    const calc =
                      getCustomerCalculation(
                        customer
                      );

                    const isSelected =
                      selectedCustomer?.key ===
                      customer.key;

                    return (
                      <tr
                        key={
                          customer.key
                        }
                        onClick={() =>
                          handleSelectCustomer(
                            customer
                          )
                        }
                        style={{
                          cursor: "pointer",
                          background:
                            isSelected
                              ? "#eaf3ff"
                              : "#fff",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {customer.name}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                          }}
                        >
                          {customer.mobile ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            textAlign:
                              "right",
                          }}
                        >
                          {money(
                            calc.totalBills
                          )}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            textAlign:
                              "right",
                            fontWeight:
                              "700",
                            color:
                              calc.finalBalance >
                              0
                                ? "#d32f2f"
                                : "#2e7d32",
                          }}
                        >
                          {money(
                            calc.finalBalance
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

      {/* SELECTED CUSTOMER */}
      {selectedCustomer && (
        <>
          {/* CUSTOMER HEADER */}
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              boxShadow:
                "0 1px 5px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3
                  style={{
                    margin:
                      "0 0 5px 0",
                  }}
                >
                  👤{" "}
                  {selectedCustomer.name}
                </h3>

                <div
                  style={{
                    color: "#666",
                  }}
                >
                  📱{" "}
                  {selectedCustomer.mobile ||
                    "-"}
                </div>
              </div>

              <button
                onClick={() =>
                  setShowBills(
                    !showBills
                  )
                }
                style={{
                  padding:
                    "9px 14px",
                  border: "none",
                  borderRadius:
                    "7px",
                  background:
                    "#1976d2",
                  color: "#fff",
                  cursor:
                    "pointer",
                }}
              >
                {showBills
                  ? "Hide Bills"
                  : "Show Bills"}
              </button>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(160px,1fr))",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Total Bills
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                }}
              >
                {money(
                  customerCalculation.totalBills
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Bill Payment
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                }}
              >
                {money(
                  customerCalculation.totalPaid
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Udhari
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                  color:
                    "#d32f2f",
                }}
              >
                {money(
                  customerCalculation.totalUdhari
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Payment Received
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                  color:
                    "#2e7d32",
                }}
              >
                {money(
                  customerCalculation.totalPayment
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Advance
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                  color:
                    "#1565c0",
                }}
              >
                {money(
                  customerCalculation.totalAdvance
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "10px",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  color: "#777",
                  fontSize:
                    "13px",
                }}
              >
                Final Balance
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight:
                    "700",
                  marginTop:
                    "5px",
                  color:
                    customerCalculation.finalBalance >
                    0
                      ? "#d32f2f"
                      : "#2e7d32",
                }}
              >
                {money(
                  customerCalculation.finalBalance
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT BUTTON */}
          {typeof setPage ===
            "function" && (
            <div
              style={{
                marginBottom: "15px",
              }}
            >
              <button
                onClick={() =>
                  setPage(
                    "customerPayment"
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "12px",
                  border: "none",
                  borderRadius:
                    "8px",
                  background:
                    "#2e7d32",
                  color: "#fff",
                  fontSize:
                    "16px",
                  fontWeight:
                    "700",
                  cursor:
                    "pointer",
                }}
              >
                💰 Customer Payment
              </button>
            </div>
          )}

          {/* BILLS */}
          {showBills && (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                marginBottom: "15px",
                overflow: "hidden",
                boxShadow:
                  "0 1px 5px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  fontWeight: "700",
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                🧾 Bill History (
                {
                  selectedBills.length
                }
                )
              </div>

              {selectedBills.length ===
              0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign:
                      "center",
                    color: "#777",
                  }}
                >
                  No bills found
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
                        "850px",
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
                          Bill No
                        </th>

                        <th
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                          }}
                        >
                          Total
                        </th>

                        <th
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                          }}
                        >
                          Paid
                        </th>

                        <th
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                          }}
                        >
                          Advance Adjust
                        </th>

                        <th
                          style={{
                            padding:
                              "9px",
                            textAlign:
                              "right",
                          }}
                        >
                          Udhari
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedBills.map(
                        (bill, index) => {
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

                          const dateValue =
                            bill.date ||
                            bill.billDate ||
                            bill.createdAt;

                          let dateText =
                            "-";

                          if (
                            dateValue
                          ) {
                            const d =
                              new Date(
                                dateValue
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
                            } else {
                              dateText =
                                String(
                                  dateValue
                                );
                            }
                          }

                          const billNo =
                            bill.billNo ||
                            bill.billNumber ||
                            bill.invoiceNo ||
                            bill.invoiceNumber ||
                            bill.id ||
                            `#${index + 1}`;

                          return (
                            <tr
                              key={
                                bill.id ||
                                `${billNo}-${index}`
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
                                  billNo
                                }
                              </td>

                              <td
                                style={{
                                  padding:
                                    "9px",
                                  textAlign:
                                    "right",
                                }}
                              >
                                {money(
                                  total
                                )}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "9px",
                                  textAlign:
                                    "right",
                                }}
                              >
                                {money(
                                  paid
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
                                  advanceAdjusted
                                )}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "9px",
                                  textAlign:
                                    "right",
                                  color:
                                    udhari >
                                    0
                                      ? "#d32f2f"
                                      : "#2e7d32",
                                  fontWeight:
                                    "700",
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
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER PAYMENTS */}
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow:
                "0 1px 5px rgba(0,0,0,0.08)",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                padding: "12px",
                fontWeight: "700",
                borderBottom:
                  "1px solid #eee",
              }}
            >
              💰 Customer Payments (
              {
                selectedPayments.length
              }
              )
            </div>

            {selectedPayments.length ===
            0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign:
                    "center",
                  color: "#777",
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
                    width: "100%",
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
                        Remark
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

                        const adjustment =
                          getSavedUdhariAdjustment(
                            payment
                          );

                        const dateValue =
                          payment.date ||
                          payment.paymentDate ||
                          payment.createdAt;

                        let dateText =
                          "-";

                        if (
                          dateValue
                        ) {
                          const d =
                            new Date(
                              dateValue
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
                          } else {
                            dateText =
                              String(
                                dateValue
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
                              {payment.remark ||
                                payment.note ||
                                payment.description ||
                                "-"}
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
                                amount
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
                                adjustment
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

          {/* FINAL SUMMARY */}
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "15px",
              boxShadow:
                "0 1px 5px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              📊 Final Payment Summary
            </h3>

            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  borderBottom:
                    "1px solid #eee",
                  paddingBottom:
                    "8px",
                }}
              >
                <span>
                  Total Bill
                </span>

                <strong>
                  {money(
                    customerCalculation.totalBills
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  borderBottom:
                    "1px solid #eee",
                  paddingBottom:
                    "8px",
                }}
              >
                <span>
                  Bill में Paid
                </span>

                <strong>
                  {money(
                    customerCalculation.totalPaid
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  borderBottom:
                    "1px solid #eee",
                  paddingBottom:
                    "8px",
                }}
              >
                <span>
                  Udhari
                </span>

                <strong
                  style={{
                    color:
                      "#d32f2f",
                  }}
                >
                  {money(
                    customerCalculation.totalUdhari
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  borderBottom:
                    "1px solid #eee",
                  paddingBottom:
                    "8px",
                }}
              >
                <span>
                  बाद में मिला Payment
                </span>

                <strong
                  style={{
                    color:
                      "#2e7d32",
                  }}
                >
                  {money(
                    customerCalculation.totalPayment
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                    paddingTop: "5px",
                }}
              >
                <strong>
                  FINAL BALANCE
                </strong>

                <strong
                  style={{
                    fontSize:
                      "22px",
                    color:
                      customerCalculation.finalBalance >
                      0
                        ? "#d32f2f"
                        : "#2e7d32",
                  }}
                >
                  {money(
                    customerCalculation.finalBalance
                  )}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                borderRadius: "7px",
                background:
                  "#fff8e1",
                color: "#795548",
                fontSize: "13px",
              }}
            >
              <strong>
                Rule:
              </strong>{" "}
              Bill में मिला payment,
              बाद में किया गया customer
              payment और advance adjustment
              अलग-अलग calculate किए जाते हैं।
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CustomerLedger;