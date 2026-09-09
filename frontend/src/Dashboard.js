
import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  stock,
  setStock,
  setPage,
  onLogout,
}) {
  // =======================================================
  // REFRESH
  // =======================================================

  const [refresh, setRefresh] = useState(0);

  // =======================================================
  // NEW BILLING FOCUS
  // =======================================================

  const newBillingRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newBillingRef.current) {
        newBillingRef.current.focus();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // =======================================================
  // GST CALCULATOR
  // =======================================================

  const [showGSTCalculator, setShowGSTCalculator] =
    useState(false);

  const [gstCalcAmount, setGstCalcAmount] =
    useState("");

  const [gstCalcType, setGstCalcType] =
    useState("+5");

  const [gstDivideMode, setGstDivideMode] =
    useState(false);

  const [gstDivideQty, setGstDivideQty] =
    useState("");

  const [gstDivideValue, setGstDivideValue] =
    useState(0);

  const gstOptions = [
    "+5",
    "-3",
    "+18",
    "+5-3",
  ];

  // =======================================================
  // STORAGE HELPERS
  // =======================================================

  const readStorage = (key, fallback = []) => {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return fallback;
      }

      const parsed = JSON.parse(value);

      return parsed ?? fallback;
    } catch (error) {
      console.error(
        "Dashboard storage read error:",
        key,
        error
      );

      return fallback;
    }
  };

  const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  };

  const formatMoney = (value) => {
    return `₹${toNumber(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const normalize = (value) => {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  };

  const todayString = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getRecordDate = (record) => {
    if (!record) {
      return "";
    }

    const possibleDates = [
      record.date,
      record.billDate,
      record.purchaseDate,
      record.createdAt,
      record.createdDate,
      record.updatedAt,
    ];

    for (const value of possibleDates) {
      if (!value) {
        continue;
      }

      const date = String(value).slice(0, 10);

      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
    }

    return "";
  };

  const getSaleTotal = (record) => {
    if (!record) {
      return 0;
    }

    if (record.total !== undefined) {
      return toNumber(record.total);
    }

    if (record.grandTotal !== undefined) {
      return toNumber(record.grandTotal);
    }

    if (record.netTotal !== undefined) {
      return toNumber(record.netTotal);
    }

    if (record.amount !== undefined) {
      return toNumber(record.amount);
    }

    if (Array.isArray(record.items)) {
      return record.items.reduce(
        (sum, item) => {
          const qty = toNumber(
            item.quantity ?? item.qty
          );

          const rate = toNumber(
            item.saleRate ??
              item.rate ??
              item.mrp
          );

          return sum + qty * rate;
        },
        0
      );
    }

    return 0;
  };

  const getPaidAmount = (record) => {
    if (!record) {
      return 0;
    }

    return toNumber(
      record.paid ??
        record.paidAmount ??
        record.amountPaid ??
        record.cashPaid ??
        record.payment
    );
  };

  const getPurchaseTotal = (record) => {
    if (!record) {
      return 0;
    }

    if (record.total !== undefined) {
      return toNumber(record.total);
    }

    if (record.grandTotal !== undefined) {
      return toNumber(record.grandTotal);
    }

    if (record.netTotal !== undefined) {
      return toNumber(record.netTotal);
    }

    if (record.purchaseAmount !== undefined) {
      return toNumber(record.purchaseAmount);
    }

    if (record.amount !== undefined) {
      return toNumber(record.amount);
    }

    if (Array.isArray(record.items)) {
      return record.items.reduce(
        (sum, item) => {
          const qty = toNumber(
            item.quantity ?? item.qty
          );

          const rate = toNumber(
            item.purchaseRate ??
              item.rate ??
              item.purchasePrice
          );

          return sum + qty * rate;
        },
        0
      );
    }

    return 0;
  };

  const getCustomerName = (record) => {
    if (!record) {
      return "Walk-in Customer";
    }

    return (
      record.customerName ||
      record.customer ||
      record.name ||
      "Walk-in Customer"
    );
  };

  // =======================================================
  // AUTO REFRESH
  // =======================================================

  useEffect(() => {
    const events = [
      "storage",
      "billUpdated",
      "billingUpdated",
      "saleUpdated",
      "salesUpdated",
      "purchaseUpdated",
      "customerPaymentUpdated",
      "customerLedgerUpdated",
      "supplierPaymentUpdated",
      "supplierLedgerUpdated",
      "stockUpdated",
      "billScannerUpdated",
      "advanceUpdated",
      "customersUpdated",
      "suppliersUpdated",
    ];

    const refreshDashboard = () => {
      setRefresh((value) => value + 1);
    };

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshDashboard
      );
    });

    const timer = setInterval(() => {
      setRefresh((value) => value + 1);
    }, 3000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          refreshDashboard
        );
      });

      clearInterval(timer);
    };
  }, []);

  // =======================================================
  // DATA
  // =======================================================

  const bills = useMemo(() => {
    const data = readStorage("bills", []);

    return Array.isArray(data)
      ? data
      : [];
  }, [refresh]);

  const sales = useMemo(() => {
    const data = readStorage("sales", []);

    return Array.isArray(data)
      ? data
      : [];
  }, [refresh]);

  const purchaseHistory = useMemo(() => {
    const data = readStorage(
      "purchaseHistory",
      []
    );

    return Array.isArray(data)
      ? data
      : [];
  }, [refresh]);

  const customerPayments = useMemo(() => {
    const data = readStorage(
      "customerPayments",
      []
    );

    return Array.isArray(data)
      ? data
      : [];
  }, [refresh]);

  const supplierPayments = useMemo(() => {
    const data = readStorage(
      "supplierPayments",
      []
    );

    return Array.isArray(data)
      ? data
      : [];
  }, [refresh]);

  // =======================================================
  // CUSTOMER ADVANCES
  // =======================================================

  const customerAdvances = useMemo(() => {
    const data = readStorage(
      "customerAdvances",
      []
    );

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      Array.isArray(data.advances)
    ) {
      return data.advances;
    }

    if (
      data &&
      Array.isArray(data.customerAdvances)
    ) {
      return data.customerAdvances;
    }

    if (
      data &&
      Array.isArray(data.data)
    ) {
      return data.data;
    }

    if (
      data &&
      Array.isArray(data.records)
    ) {
      return data.records;
    }

    if (
      data &&
      Array.isArray(data.items)
    ) {
      return data.items;
    }

    if (
      data &&
      typeof data === "object"
    ) {
      return [data];
    }

    return [];
  }, [refresh]);

  const stockData = useMemo(() => {
    if (Array.isArray(stock)) {
      return stock;
    }

    const data = readStorage(
      "stock",
      []
    );

    return Array.isArray(data)
      ? data
      : [];
  }, [stock, refresh]);

  // =======================================================
  // DATE
  // =======================================================

  const today = todayString();

  // =======================================================
  // SALES
  // =======================================================

  const totalSale = useMemo(() => {
    return sales.reduce(
      (sum, record) =>
        sum + getSaleTotal(record),
      0
    );
  }, [sales]);

  const todaySale = useMemo(() => {
    return sales
      .filter(
        (record) =>
          getRecordDate(record) === today
      )
      .reduce(
        (sum, record) =>
          sum + getSaleTotal(record),
        0
      );
  }, [sales, today]);

  // =======================================================
  // PURCHASE
  // =======================================================

  const totalPurchase = useMemo(() => {
    return purchaseHistory.reduce(
      (sum, record) =>
        sum + getPurchaseTotal(record),
      0
    );
  }, [purchaseHistory]);

  const todayPurchase = useMemo(() => {
    return purchaseHistory
      .filter(
        (record) =>
          getRecordDate(record) === today
      )
      .reduce(
        (sum, record) =>
          sum + getPurchaseTotal(record),
        0
      );
  }, [purchaseHistory, today]);

  // =======================================================
  // BILLS
  // =======================================================

  const totalBills = bills.length;

  const todayBills = bills.filter(
    (record) =>
      getRecordDate(record) === today
  ).length;

  // =======================================================
  // BILL PAID
  // =======================================================

  const billPaid = useMemo(() => {
    return bills.reduce(
      (sum, record) =>
        sum + getPaidAmount(record),
      0
    );
  }, [bills]);

  const todayCollection = useMemo(() => {
    return bills
      .filter(
        (record) =>
          getRecordDate(record) === today
      )
      .reduce(
        (sum, record) =>
          sum + getPaidAmount(record),
        0
      );
  }, [bills, today]);

  // =======================================================
  // CUSTOMER PAYMENTS
  // =======================================================

  const customerPaid = useMemo(() => {
    return customerPayments.reduce(
      (sum, record) => {
        return (
          sum +
          toNumber(
            record.amount ??
              record.paid ??
              record.paidAmount
          )
        );
      },
      0
    );
  }, [customerPayments]);

  const supplierPaid = useMemo(() => {
    return supplierPayments.reduce(
      (sum, record) => {
        return (
          sum +
          toNumber(
            record.amount ??
              record.paid ??
              record.paidAmount
          )
        );
      },
      0
    );
  }, [supplierPayments]);

  // =======================================================
  // CUSTOMER UDHARI
  // =======================================================

  const customerUdhari = useMemo(() => {
    const creditFromBills = bills.reduce(
      (sum, bill) => {
        const total =
          getSaleTotal(bill);

        const paid =
          getPaidAmount(bill);

        return (
          sum +
          Math.max(
            total - paid,
            0
          )
        );
      },
      0
    );

    const advanceAdjusted =
      customerAdvances.reduce(
        (sum, item) => {
          return (
            sum -
            toNumber(
              item.adjusted ??
                item.adjustedAmount
            )
          );
        },
        0
      );

    return Math.max(
      creditFromBills +
        advanceAdjusted -
        customerPaid,
      0
    );
  }, [
    bills,
    customerAdvances,
    customerPaid,
  ]);

  // =======================================================
  // CUSTOMER ADVANCE
  // =======================================================

  const totalCustomerAdvance =
    useMemo(() => {
      return customerAdvances.reduce(
        (sum, record) => {
          return (
            sum +
            toNumber(
              record.balance ??
                record.amount ??
                record.advance ??
                record.advanceAmount
            )
          );
        },
        0
      );
    }, [customerAdvances]);

  // =======================================================
  // SUPPLIER UDHARI
  // =======================================================

  const supplierUdhari = useMemo(() => {
    return Math.max(
      totalPurchase -
        supplierPaid,
      0
    );
  }, [
    totalPurchase,
    supplierPaid,
  ]);

  // =======================================================
  // PROFIT
  // =======================================================

  const totalProfit = useMemo(() => {
    return sales.reduce(
      (sum, record) => {
        if (
          record.profit !== undefined
        ) {
          return (
            sum +
            toNumber(
              record.profit
            )
          );
        }

        if (
          Array.isArray(record.items)
        ) {
          return (
            sum +
            record.items.reduce(
              (itemSum, item) => {
                const qty =
                  toNumber(
                    item.quantity ??
                      item.qty
                  );

                const saleRate =
                  toNumber(
                    item.saleRate ??
                      item.sellingRate ??
                      item.rate ??
                      item.mrp
                  );

                const purchaseRate =
                  toNumber(
                    item.purchaseRate ??
                      item.purchasePrice ??
                      item.cost
                  );

                return (
                  itemSum +
                  (saleRate -
                    purchaseRate) *
                    qty
                );
              },
              0
            )
          );
        }

        return sum;
      },
      0
    );
  }, [sales]);

  const todayProfit = useMemo(() => {
    return sales
      .filter(
        (record) =>
          getRecordDate(record) ===
          today
      )
      .reduce(
        (sum, record) => {
          if (
            record.profit !== undefined
          ) {
            return (
              sum +
              toNumber(
                record.profit
              )
            );
          }

          if (
            Array.isArray(
              record.items
            )
          ) {
            return (
              sum +
              record.items.reduce(
                (
                  itemSum,
                  item
                ) => {
                  const qty =
                    toNumber(
                      item.quantity ??
                        item.qty
                    );

                  const saleRate =
                    toNumber(
                      item.saleRate ??
                        item.sellingRate ??
                        item.rate ??
                        item.mrp
                    );

                  const purchaseRate =
                    toNumber(
                      item.purchaseRate ??
                        item.purchasePrice ??
                        item.cost
                    );

                  return (
                    itemSum +
                    (saleRate -
                      purchaseRate) *
                      qty
                  );
                },
                0
              )
            );
          }

          return sum;
        },
        0
      );
  }, [sales, today]);

  // =======================================================
  // STOCK
  // =======================================================

  const stockQuantity = useMemo(() => {
    return stockData.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.quantity ??
            item.qty
        ),
      0
    );
  }, [stockData]);

  const stockItemCount =
    stockData.length;

  const lowStockItems =
    useMemo(() => {
      return stockData.filter(
        (item) => {
          const qty =
            toNumber(
              item.quantity ??
                item.qty
            );

          return (
            qty > 0 &&
            qty <= 10
          );
        }
      );
    }, [stockData]);

  const outOfStockItems =
    useMemo(() => {
      return stockData.filter(
        (item) => {
          const qty =
            toNumber(
              item.quantity ??
                item.qty
            );

          return qty <= 0;
        }
      );
    }, [stockData]);

  // =======================================================
  // EXPIRY
  // =======================================================

  const expiryItems =
    useMemo(() => {
      const now =
        new Date();

      return stockData.filter(
        (item) => {
          if (!item.expiry) {
            return false;
          }

          const expiryDate =
            new Date(
              item.expiry
            );

          if (
            Number.isNaN(
              expiryDate.getTime()
            )
          ) {
            return false;
          }

          const diff =
            expiryDate.getTime() -
            now.getTime();

          const days =
            diff /
            (1000 *
              60 *
              60 *
              24);

          return days <= 30;
        }
      );
    }, [stockData]);

  const expiryCount =
    expiryItems.length;

  // =======================================================
  // TOP SELLING
  // =======================================================

  const topSellingMedicines =
    useMemo(() => {
      const map = {};

      sales.forEach((sale) => {
        if (
          Array.isArray(
            sale.items
          )
        ) {
          sale.items.forEach(
            (item) => {
              const name =
                item.medicine ||
                item.medicineName ||
                item.name ||
                "Unknown";

              const key =
                normalize(name);

              if (!map[key]) {
                map[key] = {
                  name,
                  quantity: 0,
                };
              }

              map[key].quantity +=
                toNumber(
                  item.quantity ??
                    item.qty
                );
            }
          );
        } else {
          const name =
            sale.medicine ||
            sale.medicineName ||
            sale.name;

          if (name) {
            const key =
              normalize(name);

            if (!map[key]) {
              map[key] = {
                name,
                quantity: 0,
              };
            }

            map[key].quantity +=
              toNumber(
                sale.quantity ??
                  sale.qty
              );
          }
        }
      });

      return Object.values(map)
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity
        )
        .slice(0, 5);
    }, [sales]);

  // =======================================================
  // RECENT BILLS
  // =======================================================

  const recentBills =
    useMemo(() => {
      return [...bills]
        .sort((a, b) => {
          const da =
            new Date(
              a.createdAt ||
                a.date ||
                0
            ).getTime();

          const db =
            new Date(
              b.createdAt ||
                b.date ||
                0
            ).getTime();

          return db - da;
        })
        .slice(0, 5);
    }, [bills]);

  // =======================================================
  // NAVIGATION
  // =======================================================

  const go = (page) => {
    console.log(
      "Dashboard navigation:",
      page
    );

    if (setPage) {
      setPage(page);
    }
  };

  // =======================================================
  // LOGOUT
  // =======================================================

  const handleLogout = () => {
    const confirmLogout =
      window.confirm(
        "क्या आप Logout करना चाहते हैं?"
      );

    if (!confirmLogout) {
      return;
    }

    if (onLogout) {
      onLogout();
    }
  };

  // =======================================================
  // GST CALCULATOR
  // =======================================================

  const calculateGST = () => {
    const amount =
      toNumber(
        gstCalcAmount
      );

    if (!amount) {
      return 0;
    }

    switch (gstCalcType) {
      case "+5":
        return amount * 1.05;

      case "-3":
        return amount * 0.97;

      case "+18":
        return amount * 1.18;

      case "+5-3":
        return amount * 1.02;

      default:
        return amount;
    }
  };

  const gstCalculatedValue =
    calculateGST();

  // =======================================================
  // GST DIVIDE CALCULATION
  // =======================================================

  const calculateDivide = () => {
    const amount =
      toNumber(gstCalcAmount);

    const qty =
      toNumber(gstDivideQty);

    if (
      amount <= 0 ||
      qty <= 0
    ) {
      setGstDivideValue(0);
      return;
    }

    setGstDivideValue(
      amount / qty
    );
  };

  // =======================================================
  // GST OPTION FOCUS
  // =======================================================

  const focusGSTOption = (
    option
  ) => {
    const element =
      document.getElementById(
        `gst-option-${option
          .replace(
            "+",
            "plus"
          )
          .replace(
            "-",
            "minus"
          )}`
      );

    if (element) {
      element.focus();
    }
  };

  // =======================================================
  // GST OPTION KEY HANDLER
  // =======================================================

  const handleGSTOptionKeyDown = (
    e,
    option
  ) => {
    e.stopPropagation();

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      setGstCalcType(option);
      setGstDivideMode(true);
      setGstDivideQty("");
      setGstDivideValue(0);

      setTimeout(() => {
        const input =
          document.getElementById(
            "gst-divide-qty"
          );

        if (input) {
          input.focus();
        }
      }, 100);

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();

      if (gstDivideMode) {
        setGstDivideMode(false);
        setGstDivideQty("");
        setGstDivideValue(0);
        setGstCalcAmount("0");

        setTimeout(() => {
          const input =
            document.getElementById(
              "gst-calc-amount"
            );

          if (input) {
            input.focus();
          }
        }, 50);

        return;
      }

      setGstCalcAmount("0");
      setGstCalcType(gstOptions[0]);
      setGstDivideQty("");
      setGstDivideValue(0);
      setGstDivideMode(false);
      setShowGSTCalculator(false);
    }
  };

  // =======================================================
  // GST MODAL KEYBOARD
  // =======================================================

  useEffect(() => {
    if (!showGSTCalculator) {
      return;
    }

    let lastEscapeTime = 0;

    const handleKeyDown = (
      e
    ) => {
      if (e.key !== "Escape") {
        return;
      }

      const now =
        Date.now();

      if (
        now - lastEscapeTime < 600
      ) {
        e.preventDefault();
        e.stopPropagation();

        setShowGSTCalculator(
          false
        );

        setGstDivideMode(
          false
        );

        setGstDivideQty("");
        setGstDivideValue(0);
        setGstCalcAmount("");

        lastEscapeTime = 0;

        return;
      }

      e.preventDefault();
      e.stopPropagation();

      lastEscapeTime = now;

      if (gstDivideMode) {
        setGstDivideMode(false);
        setGstDivideQty("");
        setGstDivideValue(0);
        setGstCalcAmount("0");

        setTimeout(() => {
          const input =
            document.getElementById(
              "gst-calc-amount"
            );

          if (input) {
            input.focus();
          }
        }, 50);

        return;
      }

      setGstCalcAmount("0");

      setTimeout(() => {
        focusGSTOption(
          gstOptions[0]
        );
      }, 50);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );
    };
  }, [
    showGSTCalculator,
    gstDivideMode,
  ]);

  // =======================================================
  // COMPONENTS
  // =======================================================

  const MiniTodayStat = ({
    label,
    value,
  }) => {
    return (
      <div
        style={{
          ...miniTodayStat,
        }}
      >
        <div
          style={{
            ...miniTodayLabel,
          }}
        >
          {label}
        </div>

        <div
          style={{
            ...miniTodayValue,
          }}
        >
          {value}
        </div>
      </div>
    );
  };

  const ClickableSummaryCard = ({
    icon,
    title,
    value,
    onClick,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...summaryCard,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            ...summaryIcon,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            ...summaryCardContent,
          }}
        >
          <div
            style={{
              ...summaryCardTitle,
            }}
          >
            {title}
          </div>

          <div
            style={{
              ...summaryCardValue,
            }}
          >
            {value}
          </div>
        </div>
      </button>
    );
  };

  const SmartStatusCard = ({
    icon,
    title,
    value,
    subtitle,
  }) => {
    return (
      <div
        style={{
          ...smartStatusCard,
        }}
      >
        <div
          style={{
            ...smartStatusIcon,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            ...smartStatusContent,
          }}
        >
          <div
            style={{
              ...smartStatusTitle,
            }}
          >
            {title}
          </div>

          <div
            style={{
              ...smartStatusValue,
            }}
          >
            {value}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#777",
              marginTop: "2px",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    );
  };

  const AlertCard = ({
    icon,
    title,
    amount,
    onClick,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...alertBox,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            ...alertIcon,
          }}
        >
          {icon}
        </div>

        <div>
          <div
            style={{
              ...alertTitle,
            }}
          >
            {title}
          </div>

          <div
            style={{
              ...alertAmount,
            }}
          >
            {amount}
          </div>
        </div>
      </button>
    );
  };

  const BigAction =
    forwardRef(
      function BigAction(
        {
          icon,
          title,
          subtitle,
          color,
          onClick,
        },
        ref
      ) {
        return (
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            style={{
              ...bigAction,
              border: `1px solid ${color}30`,
            }}
          >
            <div
              style={{
                ...bigActionIcon,
                background:
                  `${color}12`,
              }}
            >
              {icon}
            </div>

            <div>
              <div
                style={{
                  ...bigActionTitle,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  ...bigActionSubtitle,
                }}
              >
                {subtitle}
              </div>
            </div>
          </button>
        );
      }
    );

  const MenuButton = ({
    icon,
    title,
    onClick,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...menuButton,
        }}
      >
        <div
          style={{
            ...menuIcon,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            ...menuTitle,
          }}
        >
          {title}
        </div>
      </button>
    );
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }) => {
    return (
      <div
        style={{
          ...infoRow,
        }}
      >
        <div
          style={{
            ...infoLeft,
          }}
        >
          <span
            style={{
              marginRight: "8px",
            }}
          >
            {icon}
          </span>

          <span>
            {label}
          </span>
        </div>

        <strong>
          {value}
        </strong>
      </div>
    );
  };

  // =======================================================
  // UI
  // =======================================================

  return (
    <>
      <div
        style={{
          ...desktopContainer,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            ...headerStyle,
          }}
        >
          <div>
            <div
              style={{
                ...brandTitle,
              }}
            >
              Shivam Medical ERP
            </div>

            <div
              style={{
                ...brandSubTitle,
              }}
            >
              Smart Pharmacy Management System
            </div>
          </div>

          <div
            style={{
              ...headerActions,
            }}
          >
            <div
              style={{
                ...liveStatus,
              }}
            >
              <span
                style={{
                  ...liveDot,
                }}
              />

              LIVE
            </div>

            <div
              style={{
                ...todayBadge,
              }}
            >
              📅 {today}
            </div>

            <button
              type="button"
              onClick={() =>
                setRefresh(
                  (value) =>
                    value + 1
                )
              }
              style={{
                ...refreshButton,
              }}
            >
              🔄 Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                ...logoutButton,
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* =================================================
            1. SMART ALERTS
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "20px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              🚨 Smart Alerts
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              जरूरी चीज़ों पर तुरंत ध्यान दें
            </div>
          </div>
        </div>

        <div
          style={{
            ...alertGrid,
          }}
        >
          <AlertCard
            icon="⚠️"
            title="Low Stock"
            amount={`${lowStockItems.length} Items`}
            onClick={() =>
              go("stock")
            }
          />

          <AlertCard
            icon="❌"
            title="Out of Stock"
            amount={`${outOfStockItems.length} Items`}
            onClick={() =>
              go("stock")
            }
          />

          <AlertCard
            icon="⏰"
            title="Expiry Alert"
            amount={`${expiryCount} Items`}
            onClick={() =>
              go("expiry")
            }
          />
        </div>

        {/* =================================================
            2. SMART BUSINESS STATUS
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "28px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              📊 Smart Business Status
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              आज और पूरे business की स्थिति
            </div>
          </div>
        </div>

        <div
          style={{
            ...smartGrid,
          }}
        >
          <SmartStatusCard
            icon="💰"
            title="Today's Sale"
            value={formatMoney(
              todaySale
            )}
            subtitle={`${todayBills} Bills`}
          />

          <SmartStatusCard
            icon="📦"
            title="Today's Purchase"
            value={formatMoney(
              todayPurchase
            )}
            subtitle="आज की खरीद"
          />

          <SmartStatusCard
            icon="📈"
            title="Today's Profit"
            value={formatMoney(
              todayProfit
            )}
            subtitle="Estimated Profit"
          />

          <SmartStatusCard
            icon="💵"
            title="Today's Collection"
            value={formatMoney(
              todayCollection
            )}
            subtitle="आज प्राप्त भुगतान"
          />
        </div>

        {/* =================================================
            3. QUICK ACTIONS
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "28px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              ⚡ Quick Actions
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              रोज़ इस्तेमाल होने वाला मुख्य काम
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
          }}
        >
          <BigAction
            ref={newBillingRef}
            icon="🧾"
            title="New Billing"
            subtitle="नई Bill बनाएं"
            color="#6a1b9a"
            onClick={() =>
              go("billing")
            }
          />
        </div>

        {/* =================================================
            4. ALL MODULES
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "28px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              🧩 All Modules
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              ERP के सभी modules
            </div>
          </div>
        </div>

        <div
          style={{
            ...menuGrid,
          }}
        >
          <MenuButton
            icon="🛒"
            title="Purchase"
            onClick={() =>
              go("purchase")
            }
          />

          <MenuButton
            icon="📦"
            title="Stock"
            onClick={() =>
              go("stock")
            }
          />

          <MenuButton
            icon="💰"
            title="Sale Entry"
            onClick={() =>
              go("sale")
            }
          />

          <MenuButton
            icon="🧾"
            title="Billing"
            onClick={() =>
              go("billing")
            }
          />

          <MenuButton
            icon="🔎"
            title="Barcode Scanner"
            onClick={() =>
              go("barcode")
            }
          />

          <MenuButton
            icon="📷"
            title="Bill Scanner"
            onClick={() =>
              go("billScanner")
            }
          />

          <MenuButton
            icon="📊"
            title="Reports"
            onClick={() =>
              go("reports")
            }
          />

          <MenuButton
            icon="👤"
            title="Customer Ledger"
            onClick={() =>
              go("customerLedger")
            }
          />

          <MenuButton
            icon="🏢"
            title="Supplier Ledger"
            onClick={() =>
              go("supplierLedger")
            }
          />

          <MenuButton
            icon="⏰"
            title="Expiry Alert"
            onClick={() =>
              go("expiry")
            }
          />

          <MenuButton
            icon="📜"
            title="Sales History"
            onClick={() =>
              go("salesHistory")
            }
          />

          <MenuButton
            icon="📋"
            title="Purchase History"
            onClick={() =>
              go("purchaseHistory")
            }
          />

          <MenuButton
            icon="💳"
            title="Supplier Payment"
            onClick={() =>
              go("supplierPayment")
            }
          />

          <MenuButton
            icon="💾"
            title="Backup"
            onClick={() =>
              go("backup")
            }
          />

          <MenuButton
            icon="🧮"
            title="GST Calculator"
            onClick={() => {
              setShowGSTCalculator(
                true
              );

              setGstDivideMode(
                false
              );

              setGstDivideQty("");
              setGstDivideValue(0);
              setGstCalcAmount("");
              setGstCalcType("+5");

              setTimeout(() => {
                const input =
                  document.getElementById(
                    "gst-calc-amount"
                  );

                if (input) {
                  input.focus();
                }
              }, 100);
            }}
          />

          <MenuButton
            icon="🎁"
            title="Purchase Scheme"
            onClick={() =>
              go("purchaseScheme")
            }
          />
        </div>

        {/* =================================================
            5. TODAY'S BUSINESS
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "32px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              📅 Today's Business
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              आज का पूरा कारोबार
            </div>
          </div>
        </div>

        <div
          style={{
            ...todayHero,
          }}
        >
          <div
            style={{
              ...todayHeroTitle,
            }}
          >
            Today's Business
          </div>

          <div
            style={{
              ...todayHeroSub,
            }}
          >
            आज की बिक्री, खरीद और profit
          </div>

          <div
            style={{
              ...todayHeroStats,
            }}
          >
            <MiniTodayStat
              label="Sale"
              value={formatMoney(
                todaySale
              )}
            />

            <MiniTodayStat
              label="Purchase"
              value={formatMoney(
                todayPurchase
              )}
            />

            <MiniTodayStat
              label="Profit"
              value={formatMoney(
                todayProfit
              )}
            />

            <MiniTodayStat
              label="Collection"
              value={formatMoney(
                todayCollection
              )}
            />

            <MiniTodayStat
              label="Bills"
              value={todayBills}
            />
          </div>
        </div>

        {/* =================================================
            6. MAIN SUMMARY
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "32px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              📌 Main Summary
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              पूरे ERP का मुख्य summary
            </div>
          </div>
        </div>

        <div
          style={{
            ...summaryGrid,
          }}
        >
          <ClickableSummaryCard
            icon="💰"
            title="Total Sale"
            value={formatMoney(
              totalSale
            )}
            onClick={() =>
              go("salesHistory")
            }
          />

          <ClickableSummaryCard
            icon="🛒"
            title="Total Purchase"
            value={formatMoney(
              totalPurchase
            )}
            onClick={() =>
              go("purchaseHistory")
            }
          />

          <ClickableSummaryCard
            icon="🧾"
            title="Total Bills"
            value={totalBills}
            onClick={() =>
              go("salesHistory")
            }
          />

          <ClickableSummaryCard
            icon="💵"
            title="Total Collection"
            value={formatMoney(
              billPaid
            )}
            onClick={() =>
              go("customerLedger")
            }
          />

          <ClickableSummaryCard
            icon="👤"
            title="Customer Udhar"
            value={formatMoney(
              customerUdhari
            )}
            onClick={() =>
              go("customerLedger")
            }
          />

          <ClickableSummaryCard
            icon="💳"
            title="Customer Advance"
            value={formatMoney(
              totalCustomerAdvance
            )}
            onClick={() =>
              go("customerLedger")
            }
          />

          <ClickableSummaryCard
            icon="🏢"
            title="Supplier Udhar"
            value={formatMoney(
              supplierUdhari
            )}
            onClick={() =>
              go("supplierLedger")
            }
          />

          <ClickableSummaryCard
            icon="📈"
            title="Total Profit"
            value={formatMoney(
              totalProfit
            )}
            onClick={() =>
              go("reports")
            }
          />

          <ClickableSummaryCard
            icon="📦"
            title="Stock Quantity"
            value={stockQuantity}
            onClick={() =>
              go("stock")
            }
          />

          <ClickableSummaryCard
            icon="💊"
            title="Stock Items"
            value={stockItemCount}
            onClick={() =>
              go("stock")
            }
          />
        </div>

        {/* =================================================
            7. TOP SELLING
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "32px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              🔥 Top Selling Medicines
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              सबसे ज्यादा बिकने वाली medicines
            </div>
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
          }}
        >
          {topSellingMedicines.length ===
          0 ? (
            <div
              style={{
                ...emptyState,
              }}
            >
              अभी कोई sales data नहीं है।
            </div>
          ) : (
            <div
              style={{
                ...topSellingList,
              }}
            >
              {topSellingMedicines.map(
                (item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    style={{
                      ...topSellingRow,
                    }}
                  >
                    <div
                      style={{
                        ...rankCircle,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        ...topMedicineInfo,
                      }}
                    >
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.quantity} Qty Sold
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* =================================================
            8. RECENT BILLS
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "32px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              🧾 Recent Bills
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              हाल की billing entries
            </div>
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
          }}
        >
          {recentBills.length ===
          0 ? (
            <div
              style={{
                ...emptyState,
              }}
            >
              अभी कोई bill नहीं है।
            </div>
          ) : (
            <div
              style={{
                ...recentBillList,
              }}
            >
              {recentBills.map(
                (bill, index) => {
                  const billNumber =
                    bill.billNo ||
                    bill.billNumber ||
                    bill.invoiceNo ||
                    `Bill ${index + 1}`;

                  const customer =
                    getCustomerName(
                      bill
                    );

                  const amount =
                    getSaleTotal(
                      bill
                    );

                  return (
                    <div
                      key={
                        bill.id ||
                        bill.billId ||
                        `${billNumber}-${index}`
                      }
                      style={{
                        ...recentBillRow,
                      }}
                    >
                      <div>
                        <strong>
                          {billNumber}
                        </strong>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#777",
                            marginTop:
                              "3px",
                          }}
                        >
                          {customer}
                        </div>
                      </div>

                      <div
                        style={{
                          ...recentBillMiddle,
                        }}
                      >
                        {formatMoney(
                          amount
                        )}
                      </div>

                      <button
                        type="button"
                        style={{
                          ...smallViewButton,
                        }}
                        onClick={() =>
                          go(
                            "salesHistory"
                          )
                        }
                      >
                        View
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* =================================================
            9. COMPLETE BUSINESS SUMMARY
        ================================================= */}

        <div
          style={{
            ...sectionHeader,
            marginTop: "32px",
          }}
        >
          <div>
            <div
              style={{
                ...sectionTitle,
              }}
            >
              📊 Complete Business Summary
            </div>

            <div
              style={{
                ...sectionSubtitle,
              }}
            >
              Business की पूरी स्थिति
            </div>
          </div>
        </div>

        <div
          style={{
            ...businessGrid,
          }}
        >
          <div
            style={{
              ...panelStyle,
            }}
          >
            <InfoRow
              icon="💰"
              label="Total Sale"
              value={formatMoney(
                totalSale
              )}
            />

            <InfoRow
              icon="🛒"
              label="Total Purchase"
              value={formatMoney(
                totalPurchase
              )}
            />

            <InfoRow
              icon="📈"
              label="Total Profit"
              value={formatMoney(
                totalProfit
              )}
            />

            <InfoRow
              icon="🧾"
              label="Total Bills"
              value={totalBills}
            />

            <InfoRow
              icon="💵"
              label="Total Collection"
              value={formatMoney(
                billPaid
              )}
            />
          </div>

          <div
            style={{
              ...panelStyle,
            }}
          >
            <InfoRow
              icon="👤"
              label="Customer Udhar"
              value={formatMoney(
                customerUdhari
              )}
            />

            <InfoRow
              icon="💳"
              label="Customer Advance"
              value={formatMoney(
                totalCustomerAdvance
              )}
            />

            <InfoRow
              icon="🏢"
              label="Supplier Udhar"
              value={formatMoney(
                supplierUdhari
              )}
            />

            <InfoRow
              icon="📦"
              label="Stock Quantity"
              value={stockQuantity}
            />

            <InfoRow
              icon="⚠️"
              label="Low Stock"
              value={
                lowStockItems.length
              }
            />

            <InfoRow
              icon="⏰"
              label="Expiry Alert"
              value={expiryCount}
            />
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            ...footerStyle,
          }}
        >
          <div>
            Shivam Medical ERP
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#888",
            }}
          >
            Smart Pharmacy Management System
          </div>
        </div>
      </div>

      {/* ===================================================
          GST CALCULATOR MODAL
      =================================================== */}

      {showGSTCalculator && (
        <div
          style={{
            ...gstOverlay,
          }}
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setShowGSTCalculator(
                false
              );

              setGstDivideMode(
                false
              );

              setGstDivideQty("");
              setGstDivideValue(0);
              setGstCalcAmount("");
            }
          }}
        >
          <div
            style={{
              ...gstModal,
            }}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            {/* =============================================
                HEADER
            ============================================= */}

            <div
              style={{
                ...gstModalHeader,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "20px",
                    fontWeight:
                      "800",
                  }}
                >
                  🧮 GST Calculator
                </div>

                <div
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#777",
                    marginTop:
                      "3px",
                  }}
                >
                  GST select करके Enter दबाएं
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGSTCalculator(
                    false
                  );

                  setGstDivideMode(
                    false
                  );

                  setGstDivideQty("");
                  setGstDivideValue(0);
                  setGstCalcAmount("");
                }}
                style={{
                  ...gstCloseButton,
                }}
              >
                ✕
              </button>
            </div>

            {/* =============================================
                AMOUNT
            ============================================= */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontWeight:
                    "700",
                  marginBottom:
                    "7px",
                }}
              >
                Amount
              </label>

              <input
                id="gst-calc-amount"
                type="number"
                value={
                  gstCalcAmount
                }
                onChange={(e) =>
                  setGstCalcAmount(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    e.preventDefault();
                    e.stopPropagation();

                    setTimeout(() => {
                      focusGSTOption(
                        gstCalcType
                      );
                    }, 50);
                  }

                  if (
                    e.key === "Escape"
                  ) {
                    e.preventDefault();
                    e.stopPropagation();

                    setGstCalcAmount(
                      "0"
                    );

                    setTimeout(() => {
                      focusGSTOption(
                        gstOptions[0]
                      );
                    }, 50);
                  }
                }}
                placeholder="Amount डालें"
                style={{
                  ...gstInput,
                }}
              />
            </div>

            {/* =============================================
                GST OPTIONS
            ============================================= */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <div
                style={{
                  fontWeight:
                    "700",
                  marginBottom:
                    "8px",
                }}
              >
                GST Select करें
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap: "8px",
                }}
              >
                {gstOptions.map(
                  (option) => {
                    const optionId =
                      `gst-option-${option
                        .replace(
                          "+",
                          "plus"
                        )
                        .replace(
                          "-",
                          "minus"
                        )}`;

                    const selected =
                      gstCalcType ===
                      option;

                    return (
                      <button
                        key={option}
                        id={optionId}
                        type="button"
                        tabIndex={0}
                        onClick={() => {
                          setGstCalcType(
                            option
                          );

                          setGstDivideMode(
                            true
                          );

                          setGstDivideQty(
                            ""
                          );

                          setGstDivideValue(
                            0
                          );

                          setTimeout(
                            () => {
                              const input =
                                document.getElementById(
                                  "gst-divide-qty"
                                );

                              if (
                                input
                              ) {
                                input.focus();
                              }
                            },
                            100
                          );
                        }}
                        onKeyDown={(
                          e
                        ) =>
                          handleGSTOptionKeyDown(
                            e,
                            option
                          )
                        }
                        style={{
                          padding:
                            "11px 8px",
                          border:
                            selected
                              ? "2px solid #6a1b9a"
                              : "1px solid #ddd",
                          borderRadius:
                            "9px",
                          background:
                            selected
                              ? "#f3e5f5"
                              : "#fff",
                          fontWeight:
                            "800",
                          cursor:
                            "pointer",
                        }}
                      >
                        {option}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =============================================
                DIVIDE MODE
            ============================================= */}

            {gstDivideMode && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#f7f7f7",
                  border: "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    fontWeight: "800",
                    marginBottom: "7px",
                  }}
                >
                  ÷ Divide / Quantity
                </div>

                <input
                  id="gst-divide-qty"
                  type="number"
                  value={gstDivideQty}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setGstDivideQty(
                      value
                    );

                    const amount =
                      toNumber(
                        gstCalcAmount
                      );

                    const qty =
                      toNumber(
                        value
                      );

                    if (
                      amount > 0 &&
                      qty > 0
                    ) {
                      setGstDivideValue(
                        amount / qty
                      );
                    } else {
                      setGstDivideValue(
                        0
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      e.preventDefault();
                      e.stopPropagation();

                      calculateDivide();

                      return;
                    }

                    if (
                      e.key === "Escape"
                    ) {
                      e.preventDefault();
                      e.stopPropagation();

                      setGstDivideQty(
                        ""
                      );

                      setGstDivideValue(
                        0
                      );

                      setGstDivideMode(
                        false
                      );

                      setTimeout(() => {
                        const input =
                          document.getElementById(
                            "gst-calc-amount"
                          );

                        if (input) {
                          input.focus();
                        }
                      }, 50);
                    }
                  }}
                  placeholder="Quantity डालें"
                  style={{
                    ...gstInput,
                  }}
                />

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  Per Quantity:
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "900",
                    marginTop: "3px",
                  }}
                >
                  {formatMoney(
                    gstDivideValue
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    calculateDivide();
                  }}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background: "#fff",
                    fontWeight: "900",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ÷ Divide
                </button>
              </div>
            )}

            {/* =============================================
                RESULT
            ============================================= */}

            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "15px",
                borderRadius:
                  "10px",
                background:
                  "#fafafa",
                border:
                  "1px solid #ddd",
              }}
            >
              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "#777",
                }}
              >
                GST Result
              </div>

              <div
                style={{
                  fontSize:
                    "25px",
                  fontWeight:
                    "900",
                  marginTop:
                    "4px",
                }}
              >
                {formatMoney(
                  gstCalculatedValue
                )}
              </div>
            </div>

            {/* =============================================
                FOOTER HELP
            ============================================= */}

            <div
              style={{
                marginTop:
                  "15px",
                fontSize:
                  "12px",
                color:
                  "#888",
                textAlign:
                  "center",
                lineHeight:
                  "1.6",
              }}
            >
              Enter = GST select → Divide/Quantity
              <br />
              First Esc = Divide Reset
              <br />
              Second Esc = Calculator Close
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          RESPONSIVE CSS
      =================================================== */}

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          button {
            font-family: inherit;
          }

          .headerResponsive {
            display: flex;
          }

          @media (max-width: 900px) {
            .headerResponsive {
              flex-direction: column;
            }
          }

          @media (max-width: 700px) {
            .dashboard-desktop {
              padding: 12px !important;
            }
          }
        `}
      </style>
    </>
  );
}

/* =========================================================
   STYLES
========================================================= */

const desktopContainer = {
  width: "100%",
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "18px",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  color: "#222",
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "18px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, #ffffff, #f7f3fa)",
  border: "1px solid #e7dced",
  boxShadow:
    "0 5px 18px rgba(0,0,0,0.05)",
};

const brandTitle = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#4a148c",
};

const brandSubTitle = {
  fontSize: "13px",
  color: "#777",
  marginTop: "4px",
};

const liveStatus = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: "800",
};

const liveDot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#2e7d32",
  display: "inline-block",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const todayBadge = {
  padding: "8px 11px",
  borderRadius: "8px",
  background: "#f3e5f5",
  color: "#6a1b9a",
  fontSize: "12px",
  fontWeight: "700",
};

const refreshButton = {
  border: "1px solid #ddd",
  background: "#fff",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const logoutButton = {
  border: "1px solid #ffcdd2",
  background: "#ffebee",
  color: "#c62828",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const todayHero = {
  padding: "22px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, #4a148c, #7b1fa2)",
  color: "#fff",
  boxShadow:
    "0 8px 24px rgba(74,20,140,0.20)",
};

const todayHeroTitle = {
  fontSize: "24px",
  fontWeight: "900",
};

const todayHeroSub = {
  marginTop: "5px",
  fontSize: "13px",
  opacity: 0.85,
};

const todayHeroStats = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const miniTodayStat = {
  padding: "14px",
  borderRadius: "12px",
  background:
    "rgba(255,255,255,0.12)",
  border:
    "1px solid rgba(255,255,255,0.16)",
};

const miniTodayLabel = {
  fontSize: "12px",
  opacity: 0.8,
};

const miniTodayValue = {
  fontSize: "19px",
  fontWeight: "900",
  marginTop: "5px",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "14px",
};

const summaryCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "17px",
  borderRadius: "13px",
  border: "1px solid #e5e5e5",
  background: "#fff",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const summaryIcon = {
  width: "45px",
  height: "45px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "11px",
  background: "#f3e5f5",
  fontSize: "22px",
};

const summaryCardContent = {
  minWidth: 0,
};

const summaryCardTitle = {
  fontSize: "12px",
  color: "#777",
  fontWeight: "700",
};

const summaryCardValue = {
  fontSize: "20px",
  fontWeight: "900",
  marginTop: "4px",
};

const sectionHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: "900",
};

const sectionSubtitle = {
  fontSize: "12px",
  color: "#888",
  marginTop: "3px",
};

const smartGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const smartStatusCard = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  padding: "17px",
  borderRadius: "14px",
  background: "#fff",
  border: "1px solid #e5e5e5",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const smartStatusIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  background: "#f3e5f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "23px",
};

const smartStatusContent = {
  flex: 1,
};

const smartStatusTitle = {
  fontSize: "12px",
  color: "#777",
  fontWeight: "700",
};

const smartStatusValue = {
  fontSize: "20px",
  fontWeight: "900",
  marginTop: "3px",
};

const alertGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "14px",
};

const alertBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px",
  borderRadius: "13px",
  border: "1px solid #eeeeee",
  background: "#fff",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const alertIcon = {
  fontSize: "24px",
};

const alertTitle = {
  fontWeight: "800",
  fontSize: "14px",
};

const alertAmount = {
  fontSize: "13px",
  color: "#777",
  marginTop: "4px",
};

const quickActionGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
};

const bigAction = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  padding: "18px",
  borderRadius: "14px",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  boxShadow:
    "0 4px 14px rgba(0,0,0,0.05)",
};

const bigActionIcon = {
  width: "50px",
  height: "50px",
  borderRadius: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const bigActionTitle = {
  fontSize: "16px",
  fontWeight: "900",
};

const bigActionSubtitle = {
  fontSize: "12px",
  color: "#777",
  marginTop: "3px",
};

const menuGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
};

const menuButton = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  minHeight: "65px",
};

const menuIcon = {
  width: "38px",
  height: "38px",
  borderRadius: "9px",
  background: "#f5f5f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "19px",
};

const menuTitle = {
  fontSize: "13px",
  fontWeight: "800",
};

const panelStyle = {
  padding: "17px",
  borderRadius: "14px",
  border: "1px solid #e5e5e5",
  background: "#fff",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.04)",
};

const emptyState = {
  textAlign: "center",
  padding: "25px",
  color: "#888",
  fontSize: "13px",
};

const topSellingList = {
  display: "flex",
  flexDirection: "column",
};

const topSellingRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "11px 0",
  borderBottom:
    "1px solid #f0f0f0",
};

const rankCircle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#f3e5f5",
  color: "#6a1b9a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const topMedicineInfo = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const recentBillList = {
  display: "flex",
  flexDirection: "column",
};

const recentBillRow = {
  display: "grid",
  gridTemplateColumns:
    "1fr auto auto",
  alignItems: "center",
  gap: "15px",
  padding: "12px 0",
  borderBottom:
    "1px solid #f0f0f0",
};

const recentBillMiddle = {
  fontWeight: "900",
};

const smallViewButton = {
  border: "1px solid #ddd",
  background: "#fff",
  padding: "7px 11px",
  borderRadius: "7px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "700",
};

const businessGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "15px",
};

const infoRow = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  padding: "11px 0",
  borderBottom:
    "1px solid #f0f0f0",
  fontSize: "13px",
};

const infoLeft = {
  display: "flex",
  alignItems: "center",
  color: "#555",
};

const footerStyle = {
  textAlign: "center",
  padding: "30px 10px 15px",
  color: "#666",
  fontSize: "14px",
};

const gstOverlay = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 9999,
};

const gstModal = {
  width: "100%",
  maxWidth: "500px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: "17px",
  padding: "20px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
};

const gstModalHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const gstCloseButton = {
  width: "36px",
  height: "36px",
  borderRadius: "9px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: "18px",
};

const gstInput = {
  width: "100%",
  padding: "12px",
  borderRadius: "9px",
  border: "1px solid #ccc",
  outline: "none",
  fontSize: "15px",
};

export default Dashboard;