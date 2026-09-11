import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://shivam-medical-erp.onrender.com";

function CustomerLedger({
  setPage,
  goBack,
}) {
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [showBills, setShowBills] =
    useState(true);

  const [refresh, setRefresh] =
    useState(0);

  const [onlineBills, setOnlineBills] =
    useState([]);

  const [
    onlineCustomerPayments,
    setOnlineCustomerPayments,
  ] = useState([]);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  // =====================================================
  // BASIC HELPERS
  // =====================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data)
        ? data
        : [];
    } catch {
      return [];
    }
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

  const money = (value) => {
    return `₹${roundMoney(value).toFixed(
      2
    )}`;
  };

  const normalizeText = (value) => {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  const normalizeMobile = (value) => {
    return String(value ?? "")
      .replace(/\D/g, "")
      .slice(-10);
  };

  const positiveNumber = (value) => {
    const n = Number(value);

    if (
      !Number.isFinite(n) ||
      n <= 0
    ) {
      return 0;
    }

    return roundMoney(n);
  };

  // =====================================================
  // CUSTOMER NAME
  // =====================================================

  const getCustomerName = (item) => {
    if (!item) {
      return "";
    }

    const possibleNames = [
      item.customerName,
      item.name,
      item.partyName,
      item.clientName,

      typeof item.customer ===
      "string"
        ? item.customer
        : "",
    ];

    for (const value of possibleNames) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    if (
      item.customer &&
      typeof item.customer ===
        "object"
    ) {
      return String(
        item.customer.customerName ||
          item.customer.name ||
          ""
      ).trim();
    }

    if (
      item.customerDetails &&
      typeof item.customerDetails ===
        "object"
    ) {
      return String(
        item.customerDetails.customerName ||
          item.customerDetails.name ||
          ""
      ).trim();
    }

    return "";
  };

  // =====================================================
  // CUSTOMER MOBILE
  // =====================================================

  const getCustomerMobile = (item) => {
    if (!item) {
      return "";
    }

    const possibleMobiles = [
      item.customerMobile,
      item.mobile,
      item.phone,
      item.customerPhone,
      item.partyMobile,
      item.partyPhone,
      item.clientMobile,
    ];

    for (
      const value of possibleMobiles
    ) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim()
      ) {
        return String(value).trim();
      }
    }

    if (
      item.customer &&
      typeof item.customer ===
        "object"
    ) {
      return String(
        item.customer.customerMobile ||
          item.customer.mobile ||
          item.customer.phone ||
          ""
      ).trim();
    }

    if (
      item.customerDetails &&
      typeof item.customerDetails ===
        "object"
    ) {
      return String(
        item.customerDetails.customerMobile ||
          item.customerDetails.mobile ||
          item.customerDetails.phone ||
          ""
      ).trim();
    }

    return "";
  };

  // =====================================================
  // CUSTOMER KEY
  // =====================================================

  const makeCustomerKey = (
    name,
    mobile
  ) => {
    const m =
      normalizeMobile(mobile);

    const n =
      normalizeText(name);

    if (m) {
      return `mobile:${m}`;
    }

    if (n) {
      return `name:${n}`;
    }

    return "";
  };

  // =====================================================
  // CUSTOMER MATCH
  // =====================================================

  const customerMatches = (
    item,
    customer
  ) => {
    if (!item || !customer) {
      return false;
    }

    const itemName =
      normalizeText(
        getCustomerName(item)
      );

    const itemMobile =
      normalizeMobile(
        getCustomerMobile(item)
      );

    const customerName =
      normalizeText(
        customer.name
      );

    const customerMobile =
      normalizeMobile(
        customer.mobile
      );

    if (
      itemMobile &&
      customerMobile &&
      itemMobile ===
        customerMobile
    ) {
      return true;
    }

    if (
      itemName &&
      customerName &&
      itemName ===
        customerName
    ) {
      return true;
    }

    return false;
  };

  // =====================================================
  // DATE / TIME
  // =====================================================

  const getActivityTime = (item) => {
    if (!item) {
      return 0;
    }

    const values = [
      item.updatedAt,
      item.createdAt,
      item.date,
      item.billDate,
      item.paymentDate,
      item.timestamp,
      item.time,
    ];

    for (
      const value of values
    ) {
      if (!value) {
        continue;
      }

      const dateTime =
        new Date(value).getTime();

      if (
        Number.isFinite(
          dateTime
        )
      ) {
        return dateTime;
      }

      const numberValue =
        Number(value);

      if (
        Number.isFinite(
          numberValue
        ) &&
        numberValue > 0
      ) {
        return numberValue;
      }
    }

    return 0;
  };

  // =====================================================
  // BILL TOTAL
  // =====================================================

  const getBillTotal = (bill) => {
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

    for (
      const field of fields
    ) {
      const value =
        positiveNumber(
          bill[field]
        );

      if (value > 0) {
        return value;
      }
    }

    const items =
      bill.items ||
      bill.billItems ||
      bill.products ||
      [];

    if (
      Array.isArray(items) &&
      items.length > 0
    ) {
      let itemTotal = 0;

      items.forEach(
        (item) => {
          if (!item) {
            return;
          }

          const directAmount =
            positiveNumber(
              item.total ??
                item.amount ??
                item.itemTotal ??
                item.lineTotal
            );

          if (
            directAmount > 0
          ) {
            itemTotal +=
              directAmount;
            return;
          }

          const quantity =
            Number(
              item.quantity ??
                item.qty ??
                item.saleQty ??
                0
            );

          const rate =
            Number(
              item.saleRate ??
                item.sellingRate ??
                item.rate ??
                item.price ??
                item.mrp ??
                0
            );

          if (
            Number.isFinite(
              quantity
            ) &&
            Number.isFinite(
              rate
            ) &&
            quantity > 0 &&
            rate > 0
          ) {
            itemTotal +=
              quantity * rate;
          }
        }
      );

      if (itemTotal > 0) {
        return roundMoney(
          itemTotal
        );
      }
    }

    return 0;
  };

  // =====================================================
  // BILL PAYMENT
  //
  // ONLY ACTUAL PAYMENT RECEIVED
  // AT BILL TIME
  // =====================================================

  const getBillPaid = (bill) => {
    if (!bill) {
      return 0;
    }

    const directFields = [
      "paidNow",
      "billPaid",
      "paidAtBill",
      "paymentReceivedAtBill",
    ];

    for (
      const field of directFields
    ) {
      if (
        bill[field] !==
          undefined &&
        bill[field] !== null &&
        bill[field] !== ""
      ) {
        const value =
          Number(
            bill[field]
          );

        if (
          Number.isFinite(
            value
          ) &&
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
  // ADVANCE ADJUSTED IN BILL
  // =====================================================

  const getBillAdvanceAdjusted =
    (bill) => {
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

      for (
        const field of fields
      ) {
        const value =
          positiveNumber(
            bill[field]
          );

        if (value > 0) {
          return value;
        }
      }

      return 0;
    };

  // =====================================================
  // BILL UDHARI
  //
  // TOTAL
  // - BILL PAID
  // - ADVANCE ADJUST
  // =====================================================

  const getBillUdhari = (bill) => {
    if (!bill) {
      return 0;
    }

    const total =
      roundMoney(
        getBillTotal(bill)
      );

    const paid =
      roundMoney(
        getBillPaid(bill)
      );

    const advanceAdjusted =
      roundMoney(
        getBillAdvanceAdjusted(
          bill
        )
      );

    let balance =
      total -
      paid -
      advanceAdjusted;

    if (
      Math.abs(balance) <
      0.005
    ) {
      balance = 0;
    }

    if (balance < 0) {
      balance = 0;
    }

    return roundMoney(
      balance
    );
  };

  // =====================================================
  // CUSTOMER PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (
    payment
  ) => {
    if (!payment) {
      return 0;
    }

    const fields = [
      "amount",
      "paymentAmount",
      "paidAmount",
      "jama",
      "receivedAmount",
      "received",
      "payment",
    ];

    for (
      const field of fields
    ) {
      const value =
        positiveNumber(
          payment[field]
        );

      if (value > 0) {
        return value;
      }
    }

    return 0;
  };

  // =====================================================
  // SAVED UDHARI ADJUSTMENT
  //
  // IMPORTANT:
  // adjustedToUdhari FIRST
  // =====================================================

  const getSavedUdhariAdjustment =
    (payment) => {
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

      for (
        const field of fields
      ) {
        const value =
          positiveNumber(
            payment[field]
          );

        if (value > 0) {
          return value;
        }
      }

      return 0;
    };

  // =====================================================
  // ADVANCE AMOUNT
  // =====================================================

  const getSavedAdvance = (
    item
  ) => {
    if (!item) {
      return 0;
    }

    const fields = [
      "advance",
      "advanceAmount",
      "customerAdvance",
      "advancePaid",
      "advanceReceived",
      "amount",
    ];

    for (
      const field of fields
    ) {
      const value =
        positiveNumber(
          item[field]
        );

      if (value > 0) {
        return value;
      }
    }

    return 0;
  };

  // =====================================================
  // ONLINE BILLS
  // =====================================================

  const fetchOnlineBills =
    async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/bills?refresh=${Date.now()}`,
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        let list = [];

        if (
          Array.isArray(data)
        ) {
          list = data;
        } else if (
          data &&
          Array.isArray(
            data.bills
          )
        ) {
          list =
            data.bills;
        } else if (
          data &&
          Array.isArray(
            data.data
          )
        ) {
          list =
            data.data;
        }

        setOnlineBills(
          list
        );

        setLastUpdated(
          new Date()
        );

        console.log(
          "CUSTOMER LEDGER ONLINE BILLS:",
          list.length
        );
      } catch (error) {
        console.error(
          "CUSTOMER LEDGER BILL API ERROR:",
          error
        );
      }
    };

  // =====================================================
  // ONLINE CUSTOMER PAYMENTS
  // =====================================================

  const fetchOnlineCustomerPayments =
    async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/customer-payments?refresh=${Date.now()}`,
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        let list = [];

        if (
          Array.isArray(data)
        ) {
          list = data;
        } else if (
          data &&
          Array.isArray(
            data.payments
          )
        ) {
          list =
            data.payments;
        } else if (
          data &&
          Array.isArray(
            data.data
          )
        ) {
          list =
            data.data;
        }

        setOnlineCustomerPayments(
          list
        );

        console.log(
          "CUSTOMER PAYMENT ONLINE UPDATE:",
          list.length
        );
      } catch (error) {
        console.error(
          "CUSTOMER PAYMENT API ERROR:",
          error
        );
      }
    };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchOnlineBills();
    fetchOnlineCustomerPayments();
  }, []);

  // =====================================================
  // AUTO UPDATE EVERY 5 SECONDS
  // =====================================================

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchOnlineBills();
        fetchOnlineCustomerPayments();

        setRefresh(
          (value) =>
            value + 1
        );
      }, 5000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, []);

  // =====================================================
  // EVENTS
  // =====================================================

  useEffect(() => {
    const refreshLedger =
      () => {
        setRefresh(
          (value) =>
            value + 1
        );

        fetchOnlineBills();
        fetchOnlineCustomerPayments();
      };

    const handleStorage =
      () => {
        setRefresh(
          (value) =>
            value + 1
        );
      };

    window.addEventListener(
      "customerLedgerUpdated",
      refreshLedger
    );

    window.addEventListener(
      "advanceUpdated",
      refreshLedger
    );

    window.addEventListener(
      "billingUpdated",
      refreshLedger
    );

    window.addEventListener(
      "saleUpdated",
      refreshLedger
    );

    window.addEventListener(
      "customerPaymentUpdated",
      refreshLedger
    );

    window.addEventListener(
      "customerAdvanceUpdated",
      refreshLedger
    );

    window.addEventListener(
      "billUpdated",
      refreshLedger
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "focus",
      refreshLedger
    );

    window.addEventListener(
      "online",
      refreshLedger
    );

    return () => {
      window.removeEventListener(
        "customerLedgerUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "advanceUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "billingUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "saleUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "customerPaymentUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "customerAdvanceUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "billUpdated",
        refreshLedger
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "focus",
        refreshLedger
      );

      window.removeEventListener(
        "online",
        refreshLedger
      );
    };
  }, []);

  // =====================================================
  // LOCAL STORAGE
  // =====================================================

  const localBills =
    useMemo(
      () =>
        loadArray("bills"),
      [refresh]
    );

  const localCustomerPayments =
    useMemo(
      () =>
        loadArray(
          "customerPayments"
        ),
      [refresh]
    );

  const advances =
    useMemo(
      () =>
        loadArray(
          "advances"
        ),
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

  // =====================================================
  // MERGE ONLINE + LOCAL BILLS
  //
  // ONLINE DATA HAS PRIORITY
  // =====================================================

  const bills = useMemo(() => {
    const result = [];
    const seen = new Set();

    const addBill = (bill) => {
      if (
        !bill ||
        typeof bill !==
          "object"
      ) {
        return;
      }

      const billNo =
        String(
          bill.billNo ||
            bill.billNumber ||
            bill.invoiceNo ||
            bill.invoiceNumber ||
            ""
        )
          .trim()
          .toLowerCase();

      const id =
        String(
          bill.id ??
            bill.billId ??
            ""
        ).trim();

      let key = "";

      if (billNo) {
        key =
          `billno:${billNo}`;
      } else if (id) {
        key = `id:${id}`;
      } else {
        key =
          `json:${JSON.stringify(
            bill
          )}`;
      }

      if (
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);
      result.push(bill);
    };

    // ONLINE FIRST
    onlineBills.forEach(
      addBill
    );

    // LOCAL SECOND
    localBills.forEach(
      addBill
    );

    return result.sort(
      (a, b) =>
        getActivityTime(b) -
        getActivityTime(a)
    );
  }, [
    onlineBills,
    localBills,
  ]);

  // =====================================================
  // MERGE ONLINE + LOCAL PAYMENTS
  //
  // ONLINE FIRST
  // DUPLICATES REMOVED BY ID
  // =====================================================

  const customerPayments =
    useMemo(() => {
      const result = [];
      const seen = new Set();

      const addPayment = (
        payment
      ) => {
        if (
          !payment ||
          typeof payment !==
            "object"
        ) {
          return;
        }

        const id =
          String(
            payment.id ?? ""
          ).trim();

        let key = "";

        if (id) {
          key =
            `payment:${id}`;
        } else {
          key =
            `json:${JSON.stringify(
              payment
            )}`;
        }

        if (
          seen.has(key)
        ) {
          return;
        }

        seen.add(key);
        result.push(payment);
      };

      // ONLINE FIRST
      onlineCustomerPayments.forEach(
        addPayment
      );

      // LOCAL SECOND
      localCustomerPayments.forEach(
        addPayment
      );

      return result.sort(
        (a, b) =>
          getActivityTime(b) -
          getActivityTime(a)
      );
    }, [
      onlineCustomerPayments,
      localCustomerPayments,
    ]);

  // =====================================================
  // CUSTOMER LIST
  //
  // BILL / PAYMENT / ADVANCE
  // LATEST FIRST
  // =====================================================

  const customers =
    useMemo(() => {
      const map =
        new Map();

      const addCustomer = (
        item,
        type
      ) => {
        const name =
          getCustomerName(
            item
          );

        const mobile =
          getCustomerMobile(
            item
          );

        if (
          !name &&
          !mobile
        ) {
          return;
        }

        const key =
          makeCustomerKey(
            name,
            mobile
          );

        if (!key) {
          return;
        }

        const activityTime =
          getActivityTime(
            item
          );

        if (
          !map.has(key)
        ) {
          map.set(key, {
            key,
            name:
              name ||
              "Customer",
            mobile:
              mobile || "",
            type,
            latestActivity:
              activityTime,
          });

          return;
        }

        const existing =
          map.get(key);

        if (
          name &&
          (
            !existing.name ||
            existing.name ===
              "Customer"
          )
        ) {
          existing.name =
            name;
        }

        if (
          mobile &&
          !existing.mobile
        ) {
          existing.mobile =
            mobile;
        }

        if (
          activityTime >
          existing.latestActivity
        ) {
          existing.latestActivity =
            activityTime;

          existing.type =
            type;
        }
      };

      // Bills
      bills.forEach(
        (bill) => {
          addCustomer(
            bill,
            "bill"
          );
        }
      );

      // Online + Local Payments
      customerPayments.forEach(
        (payment) => {
          addCustomer(
            payment,
            "payment"
          );
        }
      );

      // Advances
      advances.forEach(
        (advance) => {
          addCustomer(
            advance,
            "advance"
          );
        }
      );

      customerAdvances.forEach(
        (advance) => {
          addCustomer(
            advance,
            "customerAdvance"
          );
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (a, b) => {
          const timeA =
            Number(
              a.latestActivity ||
                0
            );

          const timeB =
            Number(
              b.latestActivity ||
                0
            );

          return (
            timeB - timeA
          );
        }
      );
    }, [
      bills,
      customerPayments,
      advances,
      customerAdvances,
    ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCustomers =
    useMemo(() => {
      const q =
        normalizeText(
          search
        );

      if (!q) {
        return customers;
      }

      const digits =
        normalizeMobile(
          search
        );

      return customers.filter(
        (customer) => {
          const nameMatch =
            normalizeText(
              customer.name
            ).includes(q);

          const mobileMatch =
            digits &&
            normalizeMobile(
              customer.mobile
            ).includes(
              digits
            );

          return (
            nameMatch ||
            mobileMatch
          );
        }
      );
    }, [
      customers,
      search,
    ]);

  // =====================================================
  // SELECTED BILLS
  //
  // LATEST FIRST
  // =====================================================

  const selectedBills =
    useMemo(() => {
      if (
        !selectedCustomer
      ) {
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
        .sort(
          (a, b) =>
            getActivityTime(b) -
            getActivityTime(a)
        );
    }, [
      bills,
      selectedCustomer,
    ]);

  // =====================================================
  // SELECTED PAYMENTS
  //
  // LATEST FIRST
  // =====================================================

  const selectedPayments =
    useMemo(() => {
      if (
        !selectedCustomer
      ) {
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
        .sort(
          (a, b) =>
            getActivityTime(b) -
            getActivityTime(a)
        );
    }, [
      customerPayments,
      selectedCustomer,
    ]);

  // =====================================================
  // CURRENT ADVANCE
  //
  // IMPORTANT:
  // SAME PAYMENT MAY EXIST IN
  // advances AND customerAdvances.
  //
  // इसलिए ID से duplicate हटाया गया है.
  // =====================================================

  const getCurrentAdvance = (
    customer
  ) => {
    if (!customer) {
      return 0;
    }

    const advanceMap =
      new Map();

    const addAdvance = (
      item
    ) => {
      if (
        !item ||
        !customerMatches(
          item,
          customer
        )
      ) {
        return;
      }

      const amount =
        getSavedAdvance(
          item
        );

      if (amount <= 0) {
        return;
      }

      const id =
        String(
          item.id ??
            item.advanceId ??
            ""
        ).trim();

      if (id) {
        if (
          !advanceMap.has(id)
        ) {
          advanceMap.set(
            id,
            amount
          );
        }

        return;
      }

      const fallbackKey =
        [
          normalizeText(
            getCustomerName(
              item
            )
          ),
          normalizeMobile(
            getCustomerMobile(
              item
            )
          ),
          amount,
          item.createdAt ||
            item.date ||
            "",
        ].join("|");

      if (
        !advanceMap.has(
          fallbackKey
        )
      ) {
        advanceMap.set(
          fallbackKey,
          amount
        );
      }
    };

    advances.forEach(
      addAdvance
    );

    customerAdvances.forEach(
      addAdvance
    );

    let advanceTotal = 0;

    advanceMap.forEach(
      (amount) => {
        advanceTotal +=
          amount;
      }
    );

    // Bill में जितना advance
    // adjust हो चुका है,
    // उसे minus करें.
    selectedBills.forEach(
      (bill) => {
        advanceTotal -=
          getBillAdvanceAdjusted(
            bill
          );
      }
    );

    return roundMoney(
      Math.max(
        0,
        advanceTotal
      )
    );
  };

  // =====================================================
  // CUSTOMER CALCULATION
  // =====================================================

  const getCustomerCalculation =
    (customer) => {
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

      const customerBills =
        bills.filter(
          (bill) =>
            customerMatches(
              bill,
              customer
            )
        );

      const payments =
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

      let totalAdvanceAdjusted =
        0;

      // -------------------------------------------------
      // BILLS
      // -------------------------------------------------

      customerBills.forEach(
        (bill) => {
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

          const billUdhari =
            getBillUdhari(
              bill
            );

          totalBills +=
            total;

          totalPaid +=
            paid;

          totalAdvanceAdjusted +=
            advanceAdjusted;

          totalUdhari +=
            billUdhari;
        }
      );

      // -------------------------------------------------
      // CUSTOMER PAYMENTS
      // -------------------------------------------------

      let totalPayment = 0;

      payments.forEach(
        (payment) => {
          totalPayment +=
            getPaymentAmount(
              payment
            );
        }
      );

      totalBills =
        roundMoney(
          totalBills
        );

      totalPaid =
        roundMoney(
          totalPaid
        );

      totalUdhari =
        roundMoney(
          totalUdhari
        );

      totalPayment =
        roundMoney(
          totalPayment
        );

      totalAdvanceAdjusted =
        roundMoney(
          totalAdvanceAdjusted
        );

      // -------------------------------------------------
      // FINAL BALANCE
      // -------------------------------------------------

      let finalBalance =
        totalUdhari -
        totalPayment;

      if (
        Math.abs(
          finalBalance
        ) < 0.005
      ) {
        finalBalance = 0;
      }

      finalBalance =
        roundMoney(
          Math.max(
            0,
            finalBalance
          )
        );

      // -------------------------------------------------
      // CURRENT ADVANCE
      // -------------------------------------------------

      const totalAdvance =
        getCurrentAdvance(
          customer
        );

      return {
        totalBills,
        totalPaid,
        totalUdhari,
        totalPayment,

        totalAdvance:
          roundMoney(
            totalAdvance
          ),

        totalAdvanceAdjusted,

        finalBalance,
      };
    };

  // =====================================================
  // SELECTED CUSTOMER CALCULATION
  // =====================================================

  const customerCalculation =
    useMemo(() => {
      return getCustomerCalculation(
        selectedCustomer
      );
    }, [
      selectedCustomer,
      bills,
      customerPayments,
      advances,
      customerAdvances,
      selectedBills,
    ]);

  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  const handleSelectCustomer = (
    customer
  ) => {
    setSelectedCustomer(
      customer
    );

    setShowBills(true);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh =
    async () => {
      setRefresh(
        (value) =>
          value + 1
      );

      await Promise.all([
        fetchOnlineBills(),
        fetchOnlineCustomerPayments(),
      ]);
    };

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
        "dashboard"
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
      {/* =================================================
          HEADER
      ================================================= */}

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
            👤 Customer Ledger
          </h2>

          <div
            style={{
              marginTop:
                "5px",
              fontSize:
                "12px",
              color:
                "#777",
            }}
          >
            🟢 Online Auto Update:
            हर 5 सेकंड

            {lastUpdated
              ? ` • Last update: ${lastUpdated.toLocaleTimeString(
                  "en-IN"
                )}`
              : ""}
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "8px",
          }}
        >
          <button
            onClick={
              handleRefresh
            }
            style={{
              padding:
                "9px 14px",
              border:
                "none",
              borderRadius:
                "7px",
              background:
                "#1976d2",
              color:
                "#fff",
              fontWeight:
                "600",
              cursor:
                "pointer",
            }}
          >
            🔄 Refresh
          </button>

          <button
            onClick={
              handleBack
            }
            style={{
              padding:
                "9px 14px",
              border:
                "none",
              borderRadius:
                "7px",
              background:
                "#555",
              color:
                "#fff",
              fontWeight:
                "600",
              cursor:
                "pointer",
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div
        style={{
          background:
            "#fff",
          padding:
            "12px",
          borderRadius:
            "10px",
          marginBottom:
            "15px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="🔍 Customer name / mobile search..."
          style={{
            width:
              "100%",
            padding:
              "12px",
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

      {/* =================================================
          CUSTOMER LIST
      ================================================= */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            "10px",
          overflow:
            "hidden",
          marginBottom:
            "15px",
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
          Customers (
          {
            filteredCustomers.length
          }
          )
        </div>

        {filteredCustomers.length ===
        0 ? (
          <div
            style={{
              padding:
                "25px",
              textAlign:
                "center",
              color:
                "#777",
            }}
          >
            No customer found
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
                  "550px",
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
                        "10px",
                      textAlign:
                        "left",
                    }}
                  >
                    Customer
                  </th>

                  <th
                    style={{
                      padding:
                        "10px",
                      textAlign:
                        "left",
                    }}
                  >
                    Mobile
                  </th>

                  <th
                    style={{
                      padding:
                        "10px",
                      textAlign:
                        "right",
                    }}
                  >
                    Bill
                  </th>

                  <th
                    style={{
                      padding:
                        "10px",
                      textAlign:
                        "right",
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
                          cursor:
                            "pointer",
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
                            padding:
                              "10px",
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            customer.name
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "10px",
                          }}
                        >
                          {
                            customer.mobile ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              "10px",
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
                            padding:
                              "10px",
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

      {/* =================================================
          SELECTED CUSTOMER
      ================================================= */}

      {selectedCustomer && (
        <>
          {/* CUSTOMER HEADER */}

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
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
                gap:
                  "10px",
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
                  {
                    selectedCustomer.name
                  }
                </h3>

                <div
                  style={{
                    color:
                      "#666",
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
                    (value) =>
                      !value
                  )
                }
                style={{
                  padding:
                    "9px 14px",
                  border:
                    "none",
                  borderRadius:
                    "7px",
                  background:
                    "#1976d2",
                  color:
                    "#fff",
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

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(160px,1fr))",
              gap:
                "10px",
              marginBottom:
                "15px",
            }}
          >
            {[
              [
                "Total Bills",
                customerCalculation.totalBills,
                "#222",
              ],

              [
                "Bill Payment",
                customerCalculation.totalPaid,
                "#222",
              ],

              [
                "Udhari",
                customerCalculation.totalUdhari,
                "#d32f2f",
              ],

              [
                "Payment Received",
                customerCalculation.totalPayment,
                "#2e7d32",
              ],

              [
                "Advance",
                customerCalculation.totalAdvance,
                "#1565c0",
              ],

              [
                "Final Balance",
                customerCalculation.finalBalance,
                customerCalculation.finalBalance >
                0
                  ? "#d32f2f"
                  : "#2e7d32",
              ],
            ].map(
              ([
                title,
                value,
                color,
              ]) => (
                <div
                  key={title}
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
                      fontSize:
                        "13px",
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      fontSize:
                        "20px",
                      fontWeight:
                        "700",
                      marginTop:
                        "5px",
                      color,
                    }}
                  >
                    {money(
                      value
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* =================================================
              CUSTOMER PAYMENT BUTTON
          ================================================= */}

          {typeof setPage ===
            "function" && (
            <button
              onClick={() => {
                localStorage.setItem(
                  "selectedCustomerForPayment",
                  JSON.stringify({
                    customer:
                      selectedCustomer.name,
                    customerName:
                      selectedCustomer.name,
                    name:
                      selectedCustomer.name,
                    mobile:
                      selectedCustomer.mobile,
                    customerMobile:
                      selectedCustomer.mobile,
                    phone:
                      selectedCustomer.mobile,
                  })
                );

                setPage(
                  "customerPayment"
                );
              }}
              style={{
                width:
                  "100%",
                padding:
                  "12px",
                border:
                  "none",
                borderRadius:
                  "8px",
                background:
                  "#2e7d32",
                color:
                  "#fff",
                fontSize:
                  "16px",
                fontWeight:
                  "700",
                cursor:
                  "pointer",
                marginBottom:
                  "15px",
              }}
            >
              💰 Customer Payment
            </button>
          )}

          {/* =================================================
              BILL HISTORY
          ================================================= */}

          {showBills && (
            <div
              style={{
                background:
                  "#fff",
                borderRadius:
                  "10px",
                overflow:
                  "hidden",
                marginBottom:
                  "15px",
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
                    padding:
                      "20px",
                    textAlign:
                      "center",
                    color:
                      "#777",
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

                          const dateValue =
                            bill.date ||
                            bill.billDate ||
                            bill.createdAt;

                          let dateText =
                            "-";

                          if (
                            dateValue
                          ) {
                            const date =
                              new Date(
                                dateValue
                              );

                            if (
                              !Number.isNaN(
                                date.getTime()
                              )
                            ) {
                              dateText =
                                date.toLocaleDateString(
                                  "en-IN"
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
                                bill.billNo ||
                                bill.billNumber ||
                                bill.id ||
                                `bill-${index}`
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
                                {dateText}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "9px",
                                }}
                              >
                                {billNo}
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
                                  fontWeight:
                                    "700",
                                  color:
                                    udhari >
                                    0
                                      ? "#d32f2f"
                                      : "#2e7d32",
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

          {/* =================================================
              CUSTOMER PAYMENTS
          ================================================= */}

          <div
            style={{
              background:
                "#fff",
              borderRadius:
                "10px",
              overflow:
                "hidden",
              marginBottom:
                "15px",
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
                      "750px",
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
                        Time
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

                        const advance =
                          positiveNumber(
                            payment.advanceAmount ||
                              payment.adjustedToAdvance ||
                              0
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
                          const date =
                            new Date(
                              dateValue
                            );

                          if (
                            !Number.isNaN(
                              date.getTime()
                            )
                          ) {
                            dateText =
                              date.toLocaleDateString(
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
                              {dateText}
                            </td>

                            <td
                              style={{
                                padding:
                                  "9px",
                              }}
                            >
                              {payment.time ||
                                "-"}
                            </td>

                            <td
                              style={{
                                padding:
                                  "9px",
                              }}
                            >
                              {payment.mode ||
                                payment.paymentMode ||
                                "-"}
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
                                advance
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

          {/* =================================================
              FINAL SUMMARY
          ================================================= */}

          <div
            style={{
              background:
                "#fff",
              borderRadius:
                "10px",
              padding:
                "15px",
            }}
          >
            <h3>
              📊 Final Payment Summary
            </h3>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "10px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
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
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
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
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <span>
                  Bill की Udhari
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
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
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
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <span>
                  Advance Adjusted
                </span>

                <strong
                  style={{
                    color:
                      "#1565c0",
                  }}
                >
                  {money(
                    customerCalculation.totalAdvanceAdjusted
                  )}
                </strong>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                }}
              >
                <span>
                  Current Advance
                </span>

                <strong
                  style={{
                    color:
                      "#1565c0",
                  }}
                >
                  {money(
                    customerCalculation.totalAdvance
                  )}
                </strong>
              </div>

              <hr
                style={{
                  width:
                    "100%",
                  border: 0,
                  borderTop:
                    "1px solid #ddd",
                }}
              />

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
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
                marginTop:
                  "15px",
                padding:
                  "10px",
                borderRadius:
                  "7px",
                background:
                  "#fff8e1",
                color:
                  "#795548",
                fontSize:
                  "13px",
              }}
            >
              <strong>
                Calculation Rule:
              </strong>

              <br />

              Bill Udhari = Total Bill −
              Bill में Paid − Advance
              Adjust

              <br />

              Final Balance = सभी Bill
              Udhari − बाद में मिला
              Customer Payment

              <br />

              Customer Payment पहले
              Udhari में adjust होता है।

              <br />

              Udhari से ज्यादा payment
              होने पर बाकी amount
              Advance रहता है।

              <br />

              <strong>
                🔄 Latest Entry सबसे ऊपर
              </strong>

              <br />

              <strong>
                🟢 Bills और Customer
                Payments PostgreSQL से
                online sync होते हैं।
              </strong>

              <br />

              <strong>
                🔄 हर 5 सेकंड में
                automatically update होता है।
              </strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CustomerLedger;