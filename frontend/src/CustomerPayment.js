
import React, { useEffect, useMemo, useState } from "react";

function CustomerPayment({ setPage, goBack }) {
  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");

  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // SAFE LOAD
  // =====================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return [];
    }
  };

  // =====================================================
  // SAFE SAVE
  // =====================================================

  const saveArray = (key, data) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(
          Array.isArray(data) ? data : []
        )
      );
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // =====================================================
  // ROUND MONEY
  // =====================================================

  const roundMoney = (value) => {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Number(number.toFixed(2));
  };

  // =====================================================
  // MONEY
  // =====================================================

  const money = (value) => {
    return `₹${roundMoney(value).toFixed(2)}`;
  };

  // =====================================================
  // LOAD SELECTED CUSTOMER
  // =====================================================

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "selectedCustomerForPayment"
        ) || "null"
      );

      if (saved) {
        setCustomer(
          saved.name ||
            saved.customer ||
            saved.customerName ||
            ""
        );

        setMobile(
          saved.mobile ||
            saved.phone ||
            saved.customerMobile ||
            ""
        );
      }
    } catch (error) {
      console.error(
        "Selected customer load error:",
        error
      );
    }
  }, []);

  // =====================================================
  // REFRESH LISTENER
  // =====================================================

  useEffect(() => {
    const refreshData = () => {
      setRefresh((value) => value + 1);
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
  // BILLS
  // =====================================================

  const bills = useMemo(() => {
    return loadArray("bills");
  }, [refresh]);

  // =====================================================
  // PAYMENTS
  // =====================================================

  const payments = useMemo(() => {
    return loadArray("customerPayments");
  }, [refresh]);

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
  // BILL DATE
  // =====================================================

  const getBillDateValue = (bill) => {
    const value =
      bill?.createdAt ||
      bill?.dateTime ||
      bill?.date ||
      bill?.timestamp ||
      "";

    const parsed = new Date(value).getTime();

    return Number.isFinite(parsed)
      ? parsed
      : 0;
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
      bill?.amount,
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
          const quantity = Number(
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
            !Number.isFinite(quantity) ||
            !Number.isFinite(rate)
          ) {
            return sum;
          }

          return (
            sum +
            quantity * rate
          );
        },
        0
      );

      return roundMoney(total);
    }

    return 0;
  };

  // =====================================================
  // BILL-TIME PAID ONLY
  // =====================================================

  const getBillPaid = (bill) => {
    const possibleValues = [
      bill?.billPaid,
      bill?.paidNow,
      bill?.jama,
      bill?.paidAtBill,
      bill?.receivedAtBill,
      bill?.paymentReceived,
      bill?.paidAmount,
      bill?.receivedAmount,
      bill?.paid,
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

    return 0;
  };

  // =====================================================
  // BILL-TIME ADVANCE ADJUSTED
  // =====================================================

  const getBillAdvanceAdjusted = (bill) => {
    const values = [
      bill?.advanceAdjusted,
      bill?.advanceUsed,
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
  // FINAL BILL UDHARI
  // =====================================================

  const getBillUdhari = (bill) => {
    const total =
      getBillTotal(bill);

    const paid =
      getBillPaid(bill);

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
      payment?.payment,
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
  // NORMALIZE MOBILE
  // =====================================================

  const normalizeMobile = (value) => {
    return String(
      value || ""
    ).replace(/\D/g, "");
  };

  // =====================================================
  // NORMALIZE NAME
  // =====================================================

  const normalizeName = (value) => {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase();
  };

  // =====================================================
  // SAME CUSTOMER
  //
  // Name OR Mobile
  // =====================================================

  const isSameCustomer = (item) => {
    const itemName =
      normalizeName(
        getCustomerName(item)
      );

    const itemMobile =
      normalizeMobile(
        getCustomerMobile(item)
      );

    const currentName =
      normalizeName(customer);

    const currentMobile =
      normalizeMobile(mobile);

    const nameMatched =
      currentName &&
      itemName &&
      itemName === currentName;

    const mobileMatched =
      currentMobile &&
      itemMobile &&
      itemMobile === currentMobile;

    return Boolean(
      nameMatched ||
      mobileMatched
    );
  };

  // =====================================================
  // CUSTOMER BILLS
  // =====================================================

  const customerBills = useMemo(() => {
    return bills
      .map((bill, index) => ({
        bill,
        index,
      }))
      .filter(({ bill }) =>
        isSameCustomer(bill)
      );
  }, [
    bills,
    customer,
    mobile,
  ]);

  // =====================================================
  // TOTAL BILLS
  // =====================================================

  const totalCustomerBills = useMemo(() => {
    let total = 0;

    customerBills.forEach(({ bill }) => {
      total += getBillTotal(bill);
    });

    return roundMoney(total);
  }, [customerBills]);

  // =====================================================
  // TOTAL PAYMENTS
  // =====================================================

  const totalCustomerPayments = useMemo(() => {
    let total = 0;

    payments
      .filter((payment) =>
        isSameCustomer(payment)
      )
      .forEach((payment) => {
        total += getPaymentAmount(payment);
      });

    return roundMoney(total);
  }, [
    payments,
    customer,
    mobile,
  ]);

  // =====================================================
  // LATER PAYMENT ALREADY USED FOR UDHARI
  // =====================================================

  const totalAdjustedToUdhari = useMemo(() => {
    let total = 0;

    payments
      .filter((payment) =>
        isSameCustomer(payment)
      )
      .forEach((payment) => {
        const value =
          payment?.adjustedToUdhari;

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          const number = Number(value);

          if (
            Number.isFinite(number) &&
            number > 0
          ) {
            total += number;
          }
        }
      });

    return roundMoney(total);
  }, [
    payments,
    customer,
    mobile,
  ]);

  // =====================================================
  // ORIGINAL UDHARI
  // =====================================================

  const originalUdhari = useMemo(() => {
    let total = 0;

    customerBills.forEach(({ bill }) => {
      total += getBillUdhari(bill);
    });

    return roundMoney(
      Math.max(total, 0)
    );
  }, [customerBills]);

  // =====================================================
  // CURRENT UDHARI
  // =====================================================

  const currentUdhari = useMemo(() => {
    return roundMoney(
      Math.max(
        originalUdhari -
          totalAdjustedToUdhari,
        0
      )
    );
  }, [
    originalUdhari,
    totalAdjustedToUdhari,
  ]);

  // =====================================================
  // CURRENT ADVANCE
  //
  // Customer Payments से बना Advance
  // =====================================================

  const currentAdvance = useMemo(() => {
    let total = 0;

    payments
      .filter((payment) =>
        isSameCustomer(payment)
      )
      .forEach((payment) => {
        const advance =
          Number(
            payment?.advanceAmount ??
              payment?.adjustedToAdvance ??
              0
          );

        if (
          Number.isFinite(advance) &&
          advance > 0
        ) {
          total += advance;
        }
      });

    // =================================================
    // ALSO CHECK ADVANCE MASTER
    // =================================================

    try {
      const advances =
        JSON.parse(
          localStorage.getItem(
            "advances"
          ) || "[]"
        );

      if (Array.isArray(advances)) {
        advances.forEach((item) => {
          const itemName =
            normalizeName(
              item?.customerName ||
                item?.customer ||
                item?.name
            );

          const itemMobile =
            normalizeMobile(
              item?.customerMobile ||
                item?.mobile ||
                item?.phone
            );

          const nameMatched =
            normalizeName(customer) &&
            itemName ===
              normalizeName(customer);

          const mobileMatched =
            normalizeMobile(mobile) &&
            itemMobile ===
              normalizeMobile(mobile);

          if (
            nameMatched ||
            mobileMatched
          ) {
            const value =
              Number(
                item?.amount ??
                  item?.advance ??
                  item?.advanceAmount ??
                  0
              );

            if (
              Number.isFinite(value) &&
              value > 0
            ) {
              total = Math.max(
                total,
                value
              );
            }
          }
        });
      }
    } catch (error) {
      console.error(
        "Advance master load error:",
        error
      );
    }

    return roundMoney(
      Math.max(total, 0)
    );
  }, [
    payments,
    customer,
    mobile,
    refresh,
  ]);

  // =====================================================
  // LAST PAYMENTS
  // =====================================================

  const lastPayments = useMemo(() => {
    return payments
      .filter((payment) =>
        isSameCustomer(payment)
      )
      .slice()
      .sort((a, b) => {
        const dateA = new Date(
          a?.createdAt ||
            `${a?.date || ""} ${a?.time || ""}`
        ).getTime();

        const dateB = new Date(
          b?.createdAt ||
            `${b?.date || ""} ${b?.time || ""}`
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 10);
  }, [
    payments,
    customer,
    mobile,
  ]);

  // =====================================================
  // SAVE PAYMENT
  // =====================================================

  const savePayment = () => {
    const cleanCustomer =
      customer.trim();

    const cleanMobile =
      mobile.trim();

    const paymentAmount =
      roundMoney(Number(amount));

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!cleanCustomer) {
      alert(
        "कृपया Customer Name डालें।"
      );
      return;
    }

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      alert(
        "कृपया सही Payment Amount डालें।"
      );
      return;
    }

    // ===================================================
    // LATEST DATA
    // ===================================================

    const latestBills =
      loadArray("bills");

    const existingPayments =
      loadArray("customerPayments");

    // ===================================================
    // FIND CUSTOMER BILLS
    // ===================================================

    const customerBillIndexes =
      latestBills
        .map((bill, index) => ({
          bill,
          index,
        }))
        .filter(({ bill }) => {
          const billName =
            normalizeName(
              getCustomerName(bill)
            );

          const billMobile =
            normalizeMobile(
              getCustomerMobile(bill)
            );

          const nameMatched =
            normalizeName(cleanCustomer) &&
            billName ===
              normalizeName(cleanCustomer);

          const mobileMatched =
            normalizeMobile(cleanMobile) &&
            billMobile ===
              normalizeMobile(cleanMobile);

          return Boolean(
            nameMatched ||
            mobileMatched
          );
        });

    // ===================================================
    // NO BILL
    // ===================================================

    if (
      customerBillIndexes.length === 0
    ) {
      alert(
        "इस Customer का कोई Bill नहीं मिला।"
      );
      return;
    }

    // ===================================================
    // ORIGINAL UDHARI
    // ===================================================

    let totalOriginalUdhari = 0;

    customerBillIndexes.forEach(
      ({ bill }) => {
        totalOriginalUdhari +=
          getBillUdhari(bill);
      }
    );

    totalOriginalUdhari =
      roundMoney(
        Math.max(
          totalOriginalUdhari,
          0
        )
      );

    // ===================================================
    // PREVIOUS CUSTOMER PAYMENTS
    // ===================================================

    let alreadyAdjusted =
      0;

    existingPayments
      .filter((payment) => {
        const paymentName =
          normalizeName(
            getCustomerName(payment)
          );

        const paymentMobile =
          normalizeMobile(
            getCustomerMobile(payment)
          );

        const nameMatched =
          normalizeName(cleanCustomer) &&
          paymentName ===
            normalizeName(cleanCustomer);

        const mobileMatched =
          normalizeMobile(cleanMobile) &&
          paymentMobile ===
            normalizeMobile(cleanMobile);

        return Boolean(
          nameMatched ||
          mobileMatched
        );
      })
      .forEach((payment) => {
        const adjusted =
          Number(
            payment?.adjustedToUdhari ||
              0
          );

        if (
          Number.isFinite(adjusted) &&
          adjusted > 0
        ) {
          alreadyAdjusted +=
            adjusted;
        }
      });

    alreadyAdjusted =
      roundMoney(
        Math.max(
          alreadyAdjusted,
          0
        )
      );

    // ===================================================
    // CURRENT UDHARI
    // ===================================================

    const totalCurrentUdhari =
      roundMoney(
        Math.max(
          totalOriginalUdhari -
            alreadyAdjusted,
          0
        )
      );

    // ===================================================
    // PAYMENT SPLIT
    //
    // पहले Udhari
    // फिर Extra = Advance
    // ===================================================

    const udhariPayment =
      roundMoney(
        Math.min(
          paymentAmount,
          totalCurrentUdhari
        )
      );

    const advanceAdded =
      roundMoney(
        Math.max(
          paymentAmount -
            totalCurrentUdhari,
          0
        )
      );

    // ===================================================
    // BILL ALLOCATION
    // ===================================================

    customerBillIndexes.sort(
      (a, b) => {
        return (
          getBillDateValue(a.bill) -
          getBillDateValue(b.bill)
        );
      }
    );

    let remainingToAllocate =
      udhariPayment;

    const allocations = [];

    for (
      let i = 0;
      i <
        customerBillIndexes.length &&
      remainingToAllocate > 0.009;
      i++
    ) {
      const billIndex =
        customerBillIndexes[i].index;

      const bill =
        latestBills[billIndex];

      if (!bill) {
        continue;
      }

      const billTotal =
        getBillTotal(bill);

      const billPaid =
        getBillPaid(bill);

      const billAdvanceAdjusted =
        getBillAdvanceAdjusted(
          bill
        );

      const originalBillUdhari =
        roundMoney(
          Math.max(
            billTotal -
              billPaid -
              billAdvanceAdjusted,
            0
          )
        );

      if (
        originalBillUdhari <= 0
      ) {
        continue;
      }

      // =================================================
      // Previous allocations
      // =================================================

      let previousAllocated = 0;

      existingPayments
        .filter((payment) => {
          const paymentName =
            normalizeName(
              getCustomerName(payment)
            );

          const paymentMobile =
            normalizeMobile(
              getCustomerMobile(payment)
            );

          const nameMatched =
            normalizeName(cleanCustomer) &&
            paymentName ===
              normalizeName(cleanCustomer);

          const mobileMatched =
            normalizeMobile(cleanMobile) &&
            paymentMobile ===
              normalizeMobile(cleanMobile);

          return Boolean(
            nameMatched ||
            mobileMatched
          );
        })
        .forEach((payment) => {
          if (
            Array.isArray(
              payment?.allocations
            )
          ) {
            payment.allocations.forEach(
              (allocation) => {
                if (
                  String(
                    allocation?.billId ||
                      ""
                  ) ===
                  String(
                    bill?.id ||
                      billIndex
                  )
                ) {
                  previousAllocated +=
                    Number(
                      allocation?.amount ||
                        0
                    );
                }
              }
            );
          }
        });

      previousAllocated =
        roundMoney(
          Math.max(
            previousAllocated,
            0
          )
        );

      const billCurrentUdhari =
        roundMoney(
          Math.max(
            originalBillUdhari -
              previousAllocated,
            0
          )
        );

      if (
        billCurrentUdhari <= 0
      ) {
        continue;
      }

      const adjustAmount =
        roundMoney(
          Math.min(
            remainingToAllocate,
            billCurrentUdhari
          )
        );

      if (
        adjustAmount <= 0
      ) {
        continue;
      }

      allocations.push({
        billId:
          bill?.id ||
          billIndex,

        billIndex:
          billIndex,

        amount:
          adjustAmount,
      });

      remainingToAllocate =
        roundMoney(
          remainingToAllocate -
            adjustAmount
        );
    }

    // ===================================================
    // SAFETY
    // ===================================================

    if (
      roundMoney(
        remainingToAllocate
      ) > 0.009
    ) {
      alert(
        "Payment adjustment में समस्या हुई। Payment save नहीं किया गया।"
      );
      return;
    }

    // ===================================================
    // DATE TIME
    // ===================================================

    const now =
      new Date();

    const date =
      now.toLocaleDateString(
        "en-IN"
      );

    const time =
      now.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    // ===================================================
    // NEW PAYMENT
    // ===================================================

    const newPayment = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

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

      // Actual amount received
      amount:
        paymentAmount,

      paidAmount:
        paymentAmount,

      payment:
        paymentAmount,

      mode:
        mode,

      paymentMode:
        mode,

      note:
        note.trim(),

      date:
        date,

      time:
        time,

      // Udhari portion
      adjustedToUdhari:
        udhariPayment,

      // Advance portion
      isAdvance:
        advanceAdded > 0,

      advanceAmount:
        advanceAdded,

      adjustedToAdvance:
        advanceAdded,

      allocations:
        allocations,

      createdAt:
        now.toISOString(),
    };

    // ===================================================
    // SAVE CUSTOMER PAYMENT
    // ===================================================

    saveArray(
      "customerPayments",
      [
        ...existingPayments,
        newPayment,
      ]
    );

    // ===================================================
    // FINAL ADVANCE MASTER
    //
    // customerAdvances:
    // {
    //   mobile-or-name: amount
    // }
    //
    // advances:
    // [
    //   {
    //     customerName,
    //     customerMobile,
    //     amount
    //   }
    // ]
    //
    // दोनों storage compatible रखे जाएंगे.
    // ===================================================

    try {
      const cleanNameKey =
        normalizeName(
          cleanCustomer
        );

      const cleanMobileKey =
        normalizeMobile(
          cleanMobile
        );

      // =================================================
      // CUSTOMER ADVANCES MASTER
      // =================================================

      let customerAdvanceData =
        {};

      try {
        const raw =
          JSON.parse(
            localStorage.getItem(
              "customerAdvances"
            ) || "{}"
          );

        if (
          raw &&
          typeof raw === "object" &&
          !Array.isArray(raw)
        ) {
          customerAdvanceData =
            raw;
        }
      } catch (error) {
        customerAdvanceData =
          {};
      }

      // पुराने key से भी Advance खोजें
      let oldCustomerAdvance =
        0;

      if (cleanMobileKey) {
        oldCustomerAdvance =
          Number(
            customerAdvanceData[
              cleanMobileKey
            ] || 0
          );
      }

      if (
        oldCustomerAdvance <= 0 &&
        cleanNameKey
      ) {
        oldCustomerAdvance =
          Number(
            customerAdvanceData[
              cleanNameKey
            ] || 0
          );
      }

      if (
        !Number.isFinite(
          oldCustomerAdvance
        )
      ) {
        oldCustomerAdvance = 0;
      }

      const finalCustomerAdvance =
        roundMoney(
          oldCustomerAdvance +
            advanceAdded
        );

      // Mobile primary रहेगा
      // Mobile नहीं है तो Name
      const advanceKey =
        cleanMobileKey ||
        cleanNameKey;

      if (advanceKey) {
        customerAdvanceData[
          advanceKey
        ] =
          finalCustomerAdvance;
      }

      // अगर Name key अलग है और Mobile available है,
      // पुराना duplicate Name key remove करें.
      if (
        cleanMobileKey &&
        cleanNameKey &&
        cleanNameKey !==
          cleanMobileKey
      ) {
        delete customerAdvanceData[
          cleanNameKey
        ];
      }

      localStorage.setItem(
        "customerAdvances",
        JSON.stringify(
          customerAdvanceData
        )
      );

      // =================================================
      // ADVANCES ARRAY MASTER
      // =================================================

      let advances = [];

      try {
        const rawAdvances =
          JSON.parse(
            localStorage.getItem(
              "advances"
            ) || "[]"
          );

        if (
          Array.isArray(
            rawAdvances
          )
        ) {
          advances =
            rawAdvances;
        }
      } catch (error) {
        advances = [];
      }

      // =================================================
      // FIND MATCHING ADVANCE RECORDS
      // Name OR Mobile
      // =================================================

      const matchingIndexes =
        [];

      advances.forEach(
        (item, index) => {
          const itemName =
            normalizeName(
              item?.customerName ||
                item?.customer ||
                item?.name
            );

          const itemMobile =
            normalizeMobile(
              item?.customerMobile ||
                item?.mobile ||
                item?.phone
            );

          const nameMatched =
            cleanNameKey &&
            itemName ===
              cleanNameKey;

          const mobileMatched =
            cleanMobileKey &&
            itemMobile ===
              cleanMobileKey;

          if (
            nameMatched ||
            mobileMatched
          ) {
            matchingIndexes.push(
              index
            );
          }
        }
      );

      // =================================================
      // EXISTING ARRAY ADVANCE
      // =================================================

      let existingArrayAdvance =
        0;

      matchingIndexes.forEach(
        (index) => {
          const item =
            advances[index];

          const value =
            Number(
              item?.amount ??
                item?.advance ??
                item?.advanceAmount ??
                0
            );

          if (
            Number.isFinite(value) &&
            value > 0
          ) {
            existingArrayAdvance +=
              value;
          }
        }
      );

      existingArrayAdvance =
        roundMoney(
          Math.max(
            existingArrayAdvance,
            0
          )
        );

      // =================================================
      // IMPORTANT
      //
      // customerAdvances और advances दोनों में
      // same old Advance हो सकता है.
      //
      // लेकिन नया Customer Payment Advance
      // केवल एक बार add होगा.
      // =================================================

      let masterOldAdvance =
        Math.max(
          oldCustomerAdvance,
          existingArrayAdvance
        );

      masterOldAdvance =
        roundMoney(
          masterOldAdvance
        );

      const finalArrayAdvance =
        roundMoney(
          masterOldAdvance +
            advanceAdded
        );

      // पुराने matching records remove
      if (
        matchingIndexes.length > 0
      ) {
        advances =
          advances.filter(
            (_, index) =>
              !matchingIndexes.includes(
                index
              )
          );
      }

      // =================================================
      // SAVE ONLY IF ADVANCE EXISTS
      // =================================================

      if (
        finalArrayAdvance > 0
      ) {
        advances.push({
          id:
            `ADV-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,

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

          customerKey:
            cleanMobileKey ||
            cleanNameKey,

          amount:
            finalArrayAdvance,

          advance:
            finalArrayAdvance,

          advanceAmount:
            finalArrayAdvance,

          source:
            "CustomerPayment",

          updatedAt:
            now.toISOString(),

          createdAt:
            now.toISOString(),
        });
      }

      localStorage.setItem(
        "advances",
        JSON.stringify(
          advances
        )
      );

    } catch (error) {
      console.error(
        "FINAL Advance Master Save Error:",
        error
      );
    }

    // ===================================================
    // EVENTS
    // ===================================================

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

    try {
      window.dispatchEvent(
        new Event("storage")
      );
    } catch (error) {
      console.error(
        "Storage event error:",
        error
      );
    }

    // ===================================================
    // FINAL BALANCE
    // ===================================================

    const remainingUdhari =
      roundMoney(
        Math.max(
          totalCurrentUdhari -
            udhariPayment,
          0
        )
      );

    // ===================================================
    // SUCCESS MESSAGE
    // ===================================================

    let message =
      `Payment ${money(
        paymentAmount
      )} जमा हो गया।\n\n` +
      `Payment Mode: ${mode}\n` +
      `Udhari में Adjust: ${money(
        udhariPayment
      )}\n` +
      `बाकी Udhari: ${money(
        remainingUdhari
      )}`;

    if (
      advanceAdded > 0
    ) {
      message +=
        `\nAdvance: ${money(
          advanceAdded
        )}`;
    }

    alert(message);

    // ===================================================
    // CLEAR
    // ===================================================

    setAmount("");
    setNote("");

    // ===================================================
    // REFRESH
    // =====================================================

    setRefresh(
      (value) => value + 1
    );
  };

  // =====================================================
  // BACK
  // =====================================================

  const backToLedger = () => {
    if (
      typeof setPage ===
      "function"
    ) {
      setPage(
        "customerLedger"
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
  // PREVIEW CALCULATIONS
  // =====================================================

  const previewPayment =
    roundMoney(
      Number(amount)
    );

  const previewUdhari =
    roundMoney(
      Math.min(
        previewPayment,
        currentUdhari
      )
    );

  const previewAdvance =
    roundMoney(
      Math.max(
        previewPayment -
          currentUdhari,
        0
      )
    );

  const previewRemaining =
    roundMoney(
      Math.max(
        currentUdhari -
          previewPayment,
        0
      )
    );

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
            💳 Customer Payment
          </h1>

          <div
            style={subtitle}
          >
            Customer Payment जमा करें
          </div>
        </div>

        <button
          type="button"
          onClick={
            backToLedger
          }
          style={backButton}
        >
          ⬅️ Customer Ledger
        </button>
      </div>

      {/* CUSTOMER */}

      <div
        style={cardStyle}
      >
        <h2
          style={sectionTitle}
        >
          👤 Customer
        </h2>

        <div
          style={customerInfo}
        >
          <div>
            <div
              style={labelStyle}
            >
              Customer Name
            </div>

            <div
              style={customerNameStyle}
            >
              {customer ||
                "Customer नहीं चुना गया"}
            </div>
          </div>

          <div>
            <div
              style={labelStyle}
            >
              Mobile
            </div>

            <div
              style={mobileStyle}
            >
              {mobile || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* BALANCE */}

      <div
        style={balanceGrid}
      >
        {/* UDHARI */}

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
            बाकी उधारी
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

          <div
            style={udhariHint}
          >
            Customer की वर्तमान बाकी
          </div>
        </div>

        {/* TOTAL BILLS */}

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
              totalCustomerBills
            )}
          </div>

          <div
            style={udhariHint}
          >
            Customer के कुल Bills
          </div>
        </div>

        {/* TOTAL PAYMENTS */}

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
            Total Payments
          </div>

          <div
            style={{
              ...balanceValue,
              color:
                "#2e7d32",
            }}
          >
            {money(
              totalCustomerPayments
            )}
          </div>

          <div
            style={udhariHint}
          >
            अब तक जमा Payments
          </div>
        </div>

        {/* ADVANCE */}

        <div
          style={{
            ...balanceCard,
            borderLeft:
              "5px solid #f57c00",
          }}
        >
          <div
            style={balanceTitle}
          >
            Advance
          </div>

          <div
            style={{
              ...balanceValue,
              color:
                "#f57c00",
            }}
          >
            {money(
              currentAdvance
            )}
          </div>

          <div
            style={udhariHint}
          >
            Customer का Advance Balance
          </div>
        </div>
      </div>

      {/* PAYMENT FORM */}

      <div
        style={cardStyle}
      >
        <h2
          style={sectionTitle}
        >
          💰 Customer Payment जमा करें
        </h2>

        <div
          style={formGrid}
        >
          {/* AMOUNT */}

          <div>
            <label
              style={labelStyle}
            >
              Payment Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="₹ Amount"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              style={inputStyle}
            />

            <div
              style={maxAmountText}
            >
              Payment Amount की कोई maximum limit नहीं है।
            </div>
          </div>

          {/* MODE */}

          <div>
            <label
              style={labelStyle}
            >
              Payment Mode
            </label>

            <select
              value={mode}
              onChange={(e) =>
                setMode(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="Cash">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="Bank">
                Bank
              </option>

              <option value="Card">
                Card
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>
        </div>

        {/* NOTE */}

        <div
          style={{
            marginTop: 12,
          }}
        >
          <label
            style={labelStyle}
          >
            Note
          </label>

          <input
            type="text"
            placeholder="Payment Note"
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        {/* PREVIEW */}

        {previewPayment > 0 && (
          <div
            style={previewBox}
          >
            <div>
              Payment:
              <b>
                {" "}
                {money(
                  previewPayment
                )}
              </b>
            </div>

            <div>
              Payment Mode:
              <b>
                {" "}
                {mode}
              </b>
            </div>

            <div>
              Udhari में Adjust:
              <b
                style={{
                  color:
                    "#d32f2f",
                }}
              >
                {" "}
                {money(
                  previewUdhari
                )}
              </b>
            </div>

            <div>
              Payment के बाद बाकी Udhari:
              <b
                style={{
                  color:
                    "#1565c0",
                }}
              >
                {" "}
                {money(
                  previewRemaining
                )}
              </b>
            </div>

            {previewAdvance > 0 && (
              <div
                style={{
                  marginTop:
                    7,
                  color:
                    "#f57c00",
                  fontWeight:
                    "bold",
                }}
              >
                💰 Advance:
                {" "}
                {money(
                  previewAdvance
                )}
              </div>
            )}

            {previewPayment <=
              currentUdhari &&
              currentUdhari > 0 && (
                <div
                  style={{
                    marginTop:
                      7,
                    color:
                      "#2e7d32",
                    fontWeight:
                      "bold",
                  }}
                >
                  ✅ पूरी Payment Udhari
                  में adjust होगी।
                </div>
              )}

            {previewPayment >
              currentUdhari &&
              currentUdhari >= 0 && (
                <div
                  style={{
                    marginTop:
                      7,
                    color:
                      "#f57c00",
                    fontWeight:
                      "bold",
                  }}
                >
                  💰 Udhari पूरी clear होगी
                  और extra amount Advance में जाएगा।
                </div>
              )}
          </div>
        )}

        {/* SAVE */}

        <button
          type="button"
          onClick={
            savePayment
          }
          disabled={
            !customer.trim() ||
            previewPayment <= 0
          }
          style={{
            ...saveButton,
            opacity:
              !customer.trim() ||
              previewPayment <= 0
                ? 0.55
                : 1,
            cursor:
              !customer.trim() ||
              previewPayment <= 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          💾 Payment जमा करें
        </button>

        {/* RULE */}

        <div
          style={ruleBox}
        >
          <b>
            📌 Payment Rule
          </b>

          <div
            style={{
              marginTop: 6,
            }}
          >
            Bill Total − Bill के समय Paid −
            Previous Advance Adjusted =
            Bill की बाकी Udhari
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Customer Payment से Original
            Bill Paid नहीं बदलेगा।
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Billing के समय लगाया गया Previous
            Advance दोबारा Udhari में नहीं आएगा।
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Customer Payment पहले बाकी
            Udhari में adjust होगी।
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Udhari से ज्यादा Payment होने पर
            extra amount Advance बनेगा।
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Payment कितनी भी किस्तों में
            जमा कर सकते हैं।
          </div>

          <div
            style={{
              marginTop: 4,
            }}
          >
            Multiple Bills होने पर सबसे
            पुराना Bill पहले adjust होगा।
          </div>

          <div
            style={{
              marginTop: 8,
              color:
                "#1565c0",
              fontWeight:
                "bold",
            }}
          >
            उदाहरण: Bill ₹1000 → Bill Paid ₹200
            → Advance Adjust ₹300 → Udhari ₹500
          </div>

          <div
            style={{
              marginTop: 4,
              color:
                "#2e7d32",
              fontWeight:
                "bold",
            }}
          >
            Customer Payment ₹500
            → Udhari ₹0
          </div>

          <div
            style={{
              marginTop: 4,
              color:
                "#f57c00",
              fontWeight:
                "bold",
            }}
          >
            Customer Payment ₹700
            → Udhari ₹0 + Advance ₹200
          </div>
        </div>
      </div>

      {/* PAYMENT HISTORY */}

      <div
        style={cardStyle}
      >
        <h2
          style={sectionTitle}
        >
          📋 Recent Payments
        </h2>

        {lastPayments.length ===
        0 ? (
          <div
            style={emptyBox}
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
              style={tableStyle}
            >
              <thead>
                <tr>
                  <th
                    style={thStyle}
                  >
                    Date
                  </th>

                  <th
                    style={thStyle}
                  >
                    Time
                  </th>

                  <th
                    style={thStyle}
                  >
                    Mode
                  </th>

                  <th
                    style={thStyle}
                  >
                    Amount
                  </th>

                  <th
                    style={thStyle}
                  >
                    Udhari Adjust
                  </th>

                  <th
                    style={thStyle}
                  >
                    Advance
                  </th>

                  <th
                    style={thStyle}
                  >
                    Note
                  </th>
                </tr>
              </thead>

              <tbody>
                {lastPayments.map(
                  (
                    payment,
                    index
                  ) => {
                    const paymentAmount =
                      getPaymentAmount(
                        payment
                      );

                    const adjusted =
                      roundMoney(
                        Number(
                          payment?.adjustedToUdhari ||
                            0
                        )
                      );

                    const advance =
                      roundMoney(
                        Number(
                          payment?.advanceAmount ||
                            payment?.adjustedToAdvance ||
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
                        <td
                          style={tdStyle}
                        >
                          {payment?.date ||
                            "-"}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {payment?.time ||
                            "-"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                            color:
                              "#444",
                          }}
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
                            paymentAmount
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
                            adjusted
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              "#f57c00",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {money(
                            advance
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {payment?.note ||
                            "-"}
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
    "linear-gradient(135deg,#4a148c,#7b1fa2,#ab47bc)",
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

const customerInfo = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: "12px",
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "8px",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#777",
  marginBottom: "5px",
};

const customerNameStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1565c0",
};

const mobileStyle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#444",
};

const balanceGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
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
  fontSize: "24px",
  fontWeight: "bold",
};

const udhariHint = {
  marginTop: "5px",
  fontSize: "11px",
  color: "#777",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "12px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  fontSize: "15px",
  background: "white",
};

const maxAmountText = {
  marginTop: "5px",
  fontSize: "11px",
  color: "#777",
};

const previewBox = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "8px",
  background: "#f5f7fa",
  border:
    "1px solid #d9e0e7",
  lineHeight: "1.8",
  fontSize: "13px",
};

const saveButton = {
  width: "100%",
  marginTop: "14px",
  padding: "13px",
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
};

const ruleBox = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "8px",
  background: "#fff8e1",
  border:
    "1px solid #ffe082",
  fontSize: "12px",
  color: "#5d4037",
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

export default CustomerPayment;