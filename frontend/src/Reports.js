import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

function Reports({
  stock,
  setPage,
  goBack,
}) {
  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // MONTH
  // =====================================================

  const getCurrentMonth = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [reportType, setReportType] =
    useState("monthly");

  // =====================================================
  // SAFE ARRAY
  // =====================================================

  const getArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data)
        ? data
        : [];
    } catch (error) {
      console.error(
        `Reports ${key} load error:`,
        error
      );

      return [];
    }
  };

  // =====================================================
  // NUMBER
  // =====================================================

  const num = (value) => {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : 0;
  };

  // =====================================================
  // DATA
  // =====================================================

  const bills = useMemo(
    () => getArray("bills"),
    [refresh]
  );

  const sales = useMemo(
    () => getArray("sales"),
    [refresh]
  );

  const purchases = useMemo(() => {
    const history =
      getArray("purchaseHistory");

    return history.length > 0
      ? history
      : getArray("purchases");
  }, [refresh]);

  const customerPayments =
    useMemo(
      () =>
        getArray(
          "customerPayments"
        ),
      [refresh]
    );

  const supplierPayments =
    useMemo(
      () =>
        getArray(
          "supplierPayments"
        ),
      [refresh]
    );

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const getItemDate = (item) => {
    const value =
      item?.date ||
      item?.createdAt ||
      item?.createdDate ||
      item?.billDate ||
      item?.saleDate ||
      item?.purchaseDate ||
      item?.paymentDate;

    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const getMonthKey = (item) => {
    const date = getItemDate(item);

    if (!date) {
      return "";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const getDateKey = (item) => {
    const date = getItemDate(item);

    if (!date) {
      return "";
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const getTodayKey = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const formatDate = (item) => {
    const date = getItemDate(item);

    if (!date) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  const formatMonth = (month) => {
    if (!month) {
      return "";
    }

    const parts = month.split("-");

    if (parts.length !== 2) {
      return month;
    }

    const year = Number(parts[0]);
    const monthNumber = Number(parts[1]);

    const date = new Date(
      year,
      monthNumber - 1,
      1
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // MONEY
  // =====================================================

  const money = (value) => {
    return `₹${num(value).toFixed(2)}`;
  };

  // =====================================================
  // BILL TOTAL
  // =====================================================

  const getBillTotal = (bill) => {
    return num(
      bill?.total ??
        bill?.grandTotal ??
        bill?.saleAmount ??
        bill?.amount ??
        0
    );
  };

  // =====================================================
  // BILL PAID
  // =====================================================

  const getBillPaid = (bill) => {
    return Math.max(
      num(
        bill?.paidAmount ??
          bill?.receivedAmount ??
          bill?.paid ??
          bill?.cashReceived ??
          0
      ),
      0
    );
  };

  // =====================================================
  // BILL UDHARI
  // =====================================================

  const getBillUdhari = (bill) => {
    const total = getBillTotal(bill);

    if (
      bill?.pendingAmount !==
      undefined
    ) {
      return Math.max(
        num(bill.pendingAmount),
        0
      );
    }

    if (
      bill?.currentPending !==
      undefined
    ) {
      return Math.max(
        num(bill.currentPending),
        0
      );
    }

    if (
      bill?.currentUdhari !==
      undefined
    ) {
      return Math.max(
        num(bill.currentUdhari),
        0
      );
    }

    if (
      bill?.balance !==
      undefined
    ) {
      return Math.max(
        num(bill.balance),
        0
      );
    }

    if (
      bill?.udhari !==
      undefined
    ) {
      return Math.max(
        num(bill.udhari),
        0
      );
    }

    return Math.max(
      total - getBillPaid(bill),
      0
    );
  };

  // =====================================================
  // PURCHASE TOTAL
  // =====================================================

  const getPurchaseTotal = (purchase) => {
    if (
      purchase?.purchaseAmount !==
      undefined
    ) {
      return num(
        purchase.purchaseAmount
      );
    }

    if (
      purchase?.totalAmount !==
      undefined
    ) {
      return num(
        purchase.totalAmount
      );
    }

    if (
      purchase?.total !==
      undefined
    ) {
      return num(purchase.total);
    }

    if (
      purchase?.amount !==
      undefined
    ) {
      return num(purchase.amount);
    }

    const quantity = num(
      purchase?.quantity ??
        purchase?.qty ??
        0
    );

    const rate = num(
      purchase?.purchaseRate ??
        purchase?.rate ??
        0
    );

    return quantity * rate;
  };

  // =====================================================
  // PURCHASE PAID
  // =====================================================

  const getPurchasePaid = (purchase) => {
    return Math.max(
      num(
        purchase?.paidAmount ??
          purchase?.paid ??
          purchase?.payment ??
          purchase?.receivedAmount ??
          0
      ),
      0
    );
  };

  // =====================================================
  // PURCHASE UDHARI
  // =====================================================

  const getPurchaseUdhari = (purchase) => {
    const total =
      getPurchaseTotal(purchase);

    if (
      purchase?.pendingAmount !==
      undefined
    ) {
      return Math.max(
        num(
          purchase.pendingAmount
        ),
        0
      );
    }

    if (
      purchase?.currentPending !==
      undefined
    ) {
      return Math.max(
        num(
          purchase.currentPending
        ),
        0
      );
    }

    if (
      purchase?.balance !==
      undefined
    ) {
      return Math.max(
        num(purchase.balance),
        0
      );
    }

    if (
      purchase?.udhari !==
      undefined
    ) {
      return Math.max(
        num(purchase.udhari),
        0
      );
    }

    return Math.max(
      total -
        getPurchasePaid(purchase),
      0
    );
  };

  // =====================================================
  // CUSTOMER PAYMENT
  // =====================================================

  const getCustomerPayment = (item) => {
    return Math.max(
      num(
        item?.amount ??
          item?.paidAmount ??
          item?.payment ??
          0
      ),
      0
    );
  };

  // =====================================================
  // SUPPLIER PAYMENT
  // =====================================================

  const getSupplierPayment = (item) => {
    return Math.max(
      num(
        item?.amount ??
          item?.paidAmount ??
          item?.payment ??
          0
      ),
      0
    );
  };

  // =====================================================
  // MONTHLY FILTER
  // =====================================================

  const monthlyBills = useMemo(() => {
    return bills.filter(
      (item) =>
        getMonthKey(item) ===
        selectedMonth
    );
  }, [bills, selectedMonth]);

  const monthlySales = useMemo(() => {
    return sales.filter(
      (item) =>
        getMonthKey(item) ===
        selectedMonth
    );
  }, [sales, selectedMonth]);

  const monthlyPurchases =
    useMemo(() => {
      return purchases.filter(
        (item) =>
          getMonthKey(item) ===
          selectedMonth
      );
    }, [
      purchases,
      selectedMonth,
    ]);

  const monthlyCustomerPayments =
    useMemo(() => {
      return customerPayments.filter(
        (item) =>
          getMonthKey(item) ===
          selectedMonth
      );
    }, [
      customerPayments,
      selectedMonth,
    ]);

  const monthlySupplierPayments =
    useMemo(() => {
      return supplierPayments.filter(
        (item) =>
          getMonthKey(item) ===
          selectedMonth
      );
    }, [
      supplierPayments,
      selectedMonth,
    ]);

  // =====================================================
  // TOTALS
  // =====================================================

  const monthlySale = useMemo(
    () =>
      monthlyBills.reduce(
        (sum, bill) =>
          sum + getBillTotal(bill),
        0
      ),
    [monthlyBills]
  );

  const monthlyBillPaid = useMemo(
    () =>
      monthlyBills.reduce(
        (sum, bill) =>
          sum + getBillPaid(bill),
        0
      ),
    [monthlyBills]
  );

  const monthlyBillUdhari = useMemo(
    () =>
      monthlyBills.reduce(
        (sum, bill) =>
          sum + getBillUdhari(bill),
        0
      ),
    [monthlyBills]
  );

  const monthlyPurchase = useMemo(
    () =>
      monthlyPurchases.reduce(
        (sum, purchase) =>
          sum +
          getPurchaseTotal(purchase),
        0
      ),
    [monthlyPurchases]
  );

  const monthlyPurchasePaid =
    useMemo(
      () =>
        monthlyPurchases.reduce(
          (sum, purchase) =>
            sum +
            getPurchasePaid(
              purchase
            ),
          0
        ),
      [monthlyPurchases]
    );

  const monthlyPurchaseUdhari =
    useMemo(
      () =>
        monthlyPurchases.reduce(
          (sum, purchase) =>
            sum +
            getPurchaseUdhari(
              purchase
            ),
          0
        ),
      [monthlyPurchases]
    );

  const monthlyCustomerPayment =
    useMemo(() => {
      return monthlyCustomerPayments
        .filter((item) => {
          const type =
            item?.paymentType ||
            item?.type ||
            "";

          return type !== "advance";
        })
        .reduce(
          (sum, item) =>
            sum +
            getCustomerPayment(item),
          0
        );
    }, [
      monthlyCustomerPayments,
    ]);

  const monthlySupplierPayment =
    useMemo(() => {
      return monthlySupplierPayments
        .filter(
          (item) =>
            item?.paymentType !==
            "advance"
        )
        .reduce(
          (sum, item) =>
            sum +
            getSupplierPayment(item),
          0
        );
    }, [
      monthlySupplierPayments,
    ]);

  const monthlyProfit = useMemo(
    () =>
      monthlySales.reduce(
        (sum, sale) =>
          sum + num(sale?.profit),
        0
      ),
    [monthlySales]
  );

  const monthlyNetCash =
    monthlyBillPaid +
    monthlyCustomerPayment -
    monthlyPurchasePaid -
    monthlySupplierPayment;

  // =====================================================
  // TODAY
  // =====================================================

  const todayKey = getTodayKey();

  const todayBills = useMemo(
    () =>
      bills.filter(
        (item) =>
          getDateKey(item) ===
          todayKey
      ),
    [bills, todayKey]
  );

  const todayPurchases =
    useMemo(
      () =>
        purchases.filter(
          (item) =>
            getDateKey(item) ===
            todayKey
        ),
      [purchases, todayKey]
    );

  const todaySale = useMemo(
    () =>
      todayBills.reduce(
        (sum, bill) =>
          sum + getBillTotal(bill),
        0
      ),
    [todayBills]
  );

  const todayPurchase = useMemo(
    () =>
      todayPurchases.reduce(
        (sum, purchase) =>
          sum +
          getPurchaseTotal(purchase),
        0
      ),
    [todayPurchases]
  );

  // =====================================================
  // NAMES
  // =====================================================

  const getCustomerName = (item) => {
    return (
      String(
        item?.customer ??
          item?.customerName ??
          item?.name ??
          "Cash Customer"
      ).trim() ||
      "Cash Customer"
    );
  };

  const getSupplierName = (item) => {
    return (
      String(
        item?.supplier ??
          item?.supplierName ??
          item?.vendor ??
          ""
      ).trim() || "-"
    );
  };

  // =====================================================
  // GST HELPERS
  // =====================================================

  const getGSTRate = (item) => {
    const rate = num(
      item?.gstRate ??
        item?.gstPercent ??
        item?.gstPercentage ??
        item?.taxRate ??
        item?.taxPercent ??
        item?.gst ??
        item?.tax ??
        0
    );

    return rate >= 0 ? rate : 0;
  };

  // =====================================================
  // ITEM NAME
  // =====================================================

  const getItemName = (item) => {
    return (
      String(
        item?.medicine ??
          item?.medicineName ??
          item?.productName ??
          item?.product ??
          item?.itemName ??
          item?.name ??
          item?.description ??
          "-"
      ).trim() || "-"
    );
  };

  // =====================================================
  // PURCHASE ITEMS
  // =====================================================

  const getPurchaseItems = (purchase) => {
    const items =
      purchase?.items ??
      purchase?.cart ??
      purchase?.products ??
      purchase?.medicines ??
      purchase?.details ??
      purchase?.purchaseItems ??
      [];

    if (Array.isArray(items)) {
      return items;
    }

    /*
      अगर Purchase entry खुद एक item है
      तो उसी को item मानेंगे।
    */
    return [purchase];
  };

  // =====================================================
  // PURCHASE QUANTITY
  // =====================================================

  const getPurchaseQuantity = (item) => {
    return num(
      item?.quantity ??
        item?.qty ??
        item?.purchaseQty ??
        item?.units ??
        0
    );
  };

  // =====================================================
  // PURCHASE RATE
  // =====================================================

  const getPurchaseRate = (item) => {
    return num(
      item?.purchaseRate ??
        item?.purchasePrice ??
        item?.rate ??
        item?.costPrice ??
        item?.price ??
        0
    );
  };

  // =====================================================
  // PURCHASE TAXABLE AMOUNT
  // =====================================================

  const getPurchaseTaxableAmount = (
    item
  ) => {
    const direct =
      item?.taxableAmount ??
      item?.taxable ??
      item?.purchaseTaxableAmount ??
      item?.netPurchaseAmount;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return Math.max(
        num(direct),
        0
      );
    }

    const quantity =
      getPurchaseQuantity(item);

    const rate =
      getPurchaseRate(item);

    const gross =
      quantity * rate;

    const gstRate =
      getGSTRate(item);

    /*
      अगर Purchase Rate GST सहित है,
      तो taxable निकालेंगे।
    */
    if (gstRate > 0) {
      const gstIncluded =
        item?.gstIncluded ??
        item?.taxIncluded ??
        item?.inclusiveGST ??
        item?.isGSTIncluded;

      if (gstIncluded === true) {
        return (
          gross /
          (1 + gstRate / 100)
        );
      }
    }

    return gross;
  };

  // =====================================================
  // PURCHASE GST AMOUNT
  // =====================================================

  const getPurchaseGSTAmount = (
    item
  ) => {
    const direct =
      item?.gstAmount ??
      item?.purchaseGSTAmount ??
      item?.taxAmount ??
      item?.gstValue ??
      item?.taxValue;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return Math.max(
        num(direct),
        0
      );
    }

    const taxable =
      getPurchaseTaxableAmount(
        item
      );

    const gstRate =
      getGSTRate(item);

    return (
      taxable *
      gstRate /
      100
    );
  };

  // =====================================================
  // PURCHASE ITEM TOTAL
  // =====================================================

  const getPurchaseItemTotal = (
    item
  ) => {
    const direct =
      item?.totalAmount ??
      item?.purchaseAmount ??
      item?.lineTotal ??
      item?.amount;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return Math.max(
        num(direct),
        0
      );
    }

    return (
      getPurchaseTaxableAmount(item) +
      getPurchaseGSTAmount(item)
    );
  };

  // =====================================================
  // PURCHASE GST-WISE SUMMARY
  // =====================================================

  const monthlyPurchaseGSTSummary =
    useMemo(() => {
      const summary = {};

      monthlyPurchases.forEach(
        (purchase) => {
          const items =
            getPurchaseItems(
              purchase
            );

          items.forEach((item) => {
            const gstRate =
              getGSTRate(item);

            const taxable =
              getPurchaseTaxableAmount(
                item
              );

            const gst =
              getPurchaseGSTAmount(
                item
              );

            const quantity =
              getPurchaseQuantity(
                item
              );

            const total =
              getPurchaseItemTotal(
                item
              );

            if (
              !summary[gstRate]
            ) {
              summary[gstRate] = {
                rate: gstRate,
                quantity: 0,
                taxable: 0,
                gst: 0,
                cgst: 0,
                sgst: 0,
                total: 0,
                items: 0,
              };
            }

            summary[gstRate]
              .quantity += quantity;

            summary[gstRate]
              .taxable += taxable;

            summary[gstRate]
              .gst += gst;

            summary[gstRate]
              .cgst += gst / 2;

            summary[gstRate]
              .sgst += gst / 2;

            summary[gstRate]
              .total += total;

            summary[gstRate]
              .items += 1;
          });
        }
      );

      return Object.values(
        summary
      ).sort(
        (a, b) =>
          a.rate - b.rate
      );
    }, [monthlyPurchases]);

  // =====================================================
  // PURCHASE ITEM-WISE DETAILS
  // =====================================================

  const monthlyPurchaseItems =
    useMemo(() => {
      const rows = [];

      monthlyPurchases.forEach(
        (purchase, purchaseIndex) => {
          const items =
            getPurchaseItems(
              purchase
            );

          items.forEach(
            (item, itemIndex) => {
              rows.push({
                ...item,

                _purchaseIndex:
                  purchaseIndex,

                _itemIndex:
                  itemIndex,

                _date:
                  formatDate(
                    purchase
                  ),

                _supplier:
                  getSupplierName(
                    purchase
                  ),

                _medicine:
                  getItemName(item),

                _quantity:
                  getPurchaseQuantity(
                    item
                  ),

                _rate:
                  getPurchaseRate(
                    item
                  ),

                _gstRate:
                  getGSTRate(item),

                _taxable:
                  getPurchaseTaxableAmount(
                    item
                  ),

                _gst:
                  getPurchaseGSTAmount(
                    item
                  ),

                _total:
                  getPurchaseItemTotal(
                    item
                  ),
              });
            }
          );
        }
      );

      return rows;
    }, [monthlyPurchases]);

  // =====================================================
  // PURCHASE GST TOTALS
  // =====================================================

  const monthlyPurchaseTaxable =
    useMemo(
      () =>
        monthlyPurchaseGSTSummary.reduce(
          (sum, item) =>
            sum + item.taxable,
          0
        ),
      [monthlyPurchaseGSTSummary]
    );

  const monthlyPurchaseGST =
    useMemo(
      () =>
        monthlyPurchaseGSTSummary.reduce(
          (sum, item) =>
            sum + item.gst,
          0
        ),
      [monthlyPurchaseGSTSummary]
    );

  const monthlyPurchaseCGST =
    useMemo(
      () =>
        monthlyPurchaseGSTSummary.reduce(
          (sum, item) =>
            sum + item.cgst,
          0
        ),
      [monthlyPurchaseGSTSummary]
    );

  const monthlyPurchaseSGST =
    useMemo(
      () =>
        monthlyPurchaseGSTSummary.reduce(
          (sum, item) =>
            sum + item.sgst,
          0
        ),
      [monthlyPurchaseGSTSummary]
    );

  // =====================================================
  // SALE ITEMS
  // =====================================================

  const getSaleItems = (bill) => {
    const items =
      bill?.items ??
      bill?.cart ??
      bill?.products ??
      bill?.medicines ??
      bill?.details ??
      [];

    return Array.isArray(items)
      ? items
      : [];
  };

  // =====================================================
  // SALE TAXABLE AMOUNT
  // =====================================================

  const getItemTaxableAmount = (
    item
  ) => {
    const directAmount =
      item?.taxableAmount ??
      item?.taxable ??
      item?.netAmount;

    if (
      directAmount !== undefined &&
      directAmount !== null
    ) {
      return Math.max(
        num(directAmount),
        0
      );
    }

    const qty = num(
      item?.quantity ??
        item?.qty ??
        1
    );

    const rate = num(
      item?.saleRate ??
        item?.sellingRate ??
        item?.rate ??
        item?.price ??
        item?.mrp ??
        0
    );

    const gross = qty * rate;

    const gstRate =
      getGSTRate(item);

    if (gstRate > 0) {
      return (
        gross /
        (1 + gstRate / 100)
      );
    }

    return gross;
  };

  // =====================================================
  // SALE GST AMOUNT
  // =====================================================

  const getItemGSTAmount = (
    item
  ) => {
    const directGST =
      item?.gstAmount ??
      item?.taxAmount ??
      item?.gstValue ??
      item?.taxValue;

    if (
      directGST !== undefined &&
      directGST !== null
    ) {
      return Math.max(
        num(directGST),
        0
      );
    }

    const taxable =
      getItemTaxableAmount(item);

    const gstRate =
      getGSTRate(item);

    return (
      taxable *
      gstRate /
      100
    );
  };

  // =====================================================
  // SALE GST SUMMARY
  // =====================================================

  const monthlyGSTSummary =
    useMemo(() => {
      const summary = {};

      monthlyBills.forEach(
        (bill) => {
          const items =
            getSaleItems(bill);

          if (items.length === 0) {
            const gstRate =
              getGSTRate(bill);

            if (gstRate > 0) {
              const gstAmount =
                num(
                  bill?.gstAmount ??
                    bill?.taxAmount ??
                    bill?.gstValue ??
                    0
                );

              const taxableAmount =
                num(
                  bill?.taxableAmount ??
                    bill?.taxable ??
                    (
                      getBillTotal(
                        bill
                      ) -
                      gstAmount
                    )
                );

              if (
                !summary[gstRate]
              ) {
                summary[gstRate] = {
                  rate: gstRate,
                  taxable: 0,
                  gst: 0,
                  cgst: 0,
                  sgst: 0,
                  bills: 0,
                };
              }

              summary[gstRate]
                .taxable +=
                taxableAmount;

              summary[gstRate]
                .gst +=
                gstAmount;

              summary[gstRate]
                .cgst +=
                gstAmount / 2;

              summary[gstRate]
                .sgst +=
                gstAmount / 2;

              summary[gstRate]
                .bills += 1;
            }

            return;
          }

          items.forEach(
            (item) => {
              const gstRate =
                getGSTRate(item);

              const taxable =
                getItemTaxableAmount(
                  item
                );

              const gst =
                getItemGSTAmount(
                  item
                );

              if (
                !summary[gstRate]
              ) {
                summary[gstRate] = {
                  rate: gstRate,
                  taxable: 0,
                  gst: 0,
                  cgst: 0,
                  sgst: 0,
                  bills: 0,
                };
              }

              summary[gstRate]
                .taxable +=
                taxable;

              summary[gstRate]
                .gst += gst;

              summary[gstRate]
                .cgst +=
                gst / 2;

              summary[gstRate]
                .sgst +=
                gst / 2;
            }
          );
        }
      );

      return Object.values(
        summary
      ).sort(
        (a, b) =>
          a.rate - b.rate
      );
    }, [monthlyBills]);

  // =====================================================
  // SALE GST TOTALS
  // =====================================================

  const monthlyTotalTaxable =
    useMemo(
      () =>
        monthlyGSTSummary.reduce(
          (sum, item) =>
            sum + item.taxable,
          0
        ),
      [monthlyGSTSummary]
    );

  const monthlyTotalGST =
    useMemo(
      () =>
        monthlyGSTSummary.reduce(
          (sum, item) =>
            sum + item.gst,
          0
        ),
      [monthlyGSTSummary]
    );

  const monthlyTotalCGST =
    useMemo(
      () =>
        monthlyGSTSummary.reduce(
          (sum, item) =>
            sum + item.cgst,
          0
        ),
      [monthlyGSTSummary]
    );

  const monthlyTotalSGST =
    useMemo(
      () =>
        monthlyGSTSummary.reduce(
          (sum, item) =>
            sum + item.sgst,
          0
        ),
      [monthlyGSTSummary]
    );

  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = (pageName) => {
    if (
      typeof setPage ===
      "function"
    ) {
      setPage(pageName);
    }
  };

  // =====================================================
  // REPORT TEXT
  // =====================================================

  const generateMonthlyText = () => {
    const gstText =
      monthlyGSTSummary.length > 0
        ? monthlyGSTSummary
            .map(
              (item) =>
                `${item.rate}% GST
Taxable: ${money(
                  item.taxable
                )}
CGST: ${money(
                  item.cgst
                )}
SGST: ${money(
                  item.sgst
                )}
Total GST: ${money(
                  item.gst
                )}`
            )
            .join("\n\n")
        : "No GST data found";

    const purchaseGSTText =
      monthlyPurchaseGSTSummary.length >
      0
        ? monthlyPurchaseGSTSummary
            .map(
              (item) =>
                `${item.rate}% GST PURCHASE
Quantity: ${item.quantity}
Taxable: ${money(
                  item.taxable
                )}
CGST: ${money(
                  item.cgst
                )}
SGST: ${money(
                  item.sgst
                )}
GST: ${money(
                  item.gst
                )}
Total: ${money(
                  item.total
                )}`
            )
            .join("\n\n")
        : "No Purchase GST data found";

    return `SHIVAM MEDICAL ERP
Monthly Business Report
Month: ${formatMonth(
      selectedMonth
    )}

--------------------------------
Total Sale: ${money(
      monthlySale
    )}
Bill Paid: ${money(
      monthlyBillPaid
    )}
Customer Payment: ${money(
      monthlyCustomerPayment
    )}
Customer Udhari: ${money(
      Math.max(
        monthlyBillUdhari -
          monthlyCustomerPayment,
        0
      )
    )}

Total Purchase: ${money(
      monthlyPurchase
    )}
Purchase Paid: ${money(
      monthlyPurchasePaid
    )}
Supplier Payment: ${money(
      monthlySupplierPayment
    )}
Supplier Udhari: ${money(
      Math.max(
        monthlyPurchaseUdhari -
          monthlySupplierPayment,
        0
      )
    )}

Total Profit: ${money(
      monthlyProfit
    )}
Net Cash: ${money(
      monthlyNetCash
    )}

--------------------------------
SALE GST SUMMARY

Taxable Amount: ${money(
      monthlyTotalTaxable
    )}
Total GST: ${money(
      monthlyTotalGST
    )}
CGST: ${money(
      monthlyTotalCGST
    )}
SGST: ${money(
      monthlyTotalSGST
    )}

${gstText}

--------------------------------
PURCHASE GST-WISE SUMMARY

Purchase Taxable: ${money(
      monthlyPurchaseTaxable
    )}
Purchase GST: ${money(
      monthlyPurchaseGST
    )}
Purchase CGST: ${money(
      monthlyPurchaseCGST
    )}
Purchase SGST: ${money(
      monthlyPurchaseSGST
    )}

${purchaseGSTText}

--------------------------------
PURCHASE ITEM GST DETAILS

${monthlyPurchaseItems
  .map(
    (item, index) =>
      `${index + 1}. ${
        item._medicine
      }
Supplier: ${
        item._supplier
      }
Qty: ${
        item._quantity
      }
Purchase Rate: ${money(
        item._rate
      )}
GST: ${
        item._gstRate
      }%
GST Amount: ${money(
        item._gst
      )}
Total: ${money(
        item._total
      )}`
  )
  .join("\n\n")}

--------------------------------
Bills: ${
      monthlyBills.length
    }
Sales Entries: ${
      monthlySales.length
    }
Purchase Entries: ${
      monthlyPurchases.length
    }

--------------------------------
Shivam Medical ERP`;
  };

  // =====================================================
  // SHARE
  // =====================================================

  const shareMonthlyReport =
    async () => {
      const text =
        generateMonthlyText();

      if (navigator.share) {
        try {
          await navigator.share({
            title:
              "Shivam Medical ERP - Monthly Report",
            text,
          });

          return;
        } catch (error) {
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }
        }
      }

      try {
        await navigator.clipboard.writeText(
          text
        );

        alert(
          "✅ Monthly Report copy हो गया है।"
        );
      } catch {
        alert(text);
      }
    };

  // =====================================================
  // PRINT
  // =====================================================

  const printMonthlyReport = () => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1100,height=800"
      );

    if (!printWindow) {
      alert(
        "⚠️ Print window open नहीं हुई।"
      );
      return;
    }

    const rows =
      monthlyBills
        .map(
          (bill, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(
            bill
          )}</td>
          <td>${getCustomerName(
            bill
          )}</td>
          <td>${money(
            getBillTotal(bill)
          )}</td>
          <td>${money(
            getBillPaid(bill)
          )}</td>
          <td>${money(
            getBillUdhari(bill)
          )}</td>
        </tr>
      `
        )
        .join("");

    const gstRows =
      monthlyGSTSummary
        .map(
          (item) => `
        <tr>
          <td>${item.rate}%</td>
          <td>${money(
            item.taxable
          )}</td>
          <td>${money(
            item.cgst
          )}</td>
          <td>${money(
            item.sgst
          )}</td>
          <td>${money(
            item.gst
          )}</td>
        </tr>
      `
        )
        .join("");

    // ===================================================
    // PURCHASE GST ROWS
    // ===================================================

    const purchaseGSTRows =
      monthlyPurchaseGSTSummary
        .map(
          (item) => `
        <tr>
          <td><b>${item.rate}%</b></td>
          <td>${item.quantity}</td>
          <td>${money(
            item.taxable
          )}</td>
          <td>${money(
            item.cgst
          )}</td>
          <td>${money(
            item.sgst
          )}</td>
          <td>${money(
            item.gst
          )}</td>
          <td>${money(
            item.total
          )}</td>
        </tr>
      `
        )
        .join("");

    // ===================================================
    // PURCHASE ITEM ROWS
    // ===================================================

    const purchaseItemRows =
      monthlyPurchaseItems
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item._date}</td>
          <td>${item._supplier}</td>
          <td><b>${item._medicine}</b></td>
          <td>${item._quantity}</td>
          <td>${money(
            item._rate
          )}</td>
          <td>
            <b class="gst-rate">
              ${item._gstRate}%
            </b>
          </td>
          <td>${money(
            item._taxable
          )}</td>
          <td>${money(
            item._gst
          )}</td>
          <td>${money(
            item._total
          )}</td>
        </tr>
      `
        )
        .join("");

    printWindow.document.write(`
      <html>

      <head>

        <title>
          Shivam Medical ERP Report
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #263238;
          }

          h1 {
            color: #1565c0;
          }

          h2 {
            margin-top: 30px;
            color: #1565c0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }

          th {
            background: #f1f5f9;
          }

          .total {
            font-weight: bold;
            background: #f1f5f9;
          }

          .gst {
            color: #2e7d32;
            font-weight: bold;
          }

          .gst-rate {
            color: #1565c0;
            font-size: 16px;
          }

          .purchase-title {
            color: #ef6c00;
          }

        </style>

      </head>

      <body>

        <h1>
          Shivam Medical ERP
        </h1>

        <h3>
          Monthly Business Report
        </h3>

        <h4>
          ${formatMonth(
            selectedMonth
          )}
        </h4>

        <p>
          Total Sale:
          <b>
            ${money(
              monthlySale
            )}
          </b>
        </p>

        <p>
          Total Purchase:
          <b>
            ${money(
              monthlyPurchase
            )}
          </b>
        </p>

        <p>
          Total Profit:
          <b>
            ${money(
              monthlyProfit
            )}
          </b>
        </p>

        <h2>
          Sale GST Summary
        </h2>

        <p>
          Total Taxable Amount:
          <b>
            ${money(
              monthlyTotalTaxable
            )}
          </b>
        </p>

        <p>
          Total GST:
          <b class="gst">
            ${money(
              monthlyTotalGST
            )}
          </b>
        </p>

        <p>
          CGST:
          <b>
            ${money(
              monthlyTotalCGST
            )}
          </b>
        </p>

        <p>
          SGST:
          <b>
            ${money(
              monthlyTotalSGST
            )}
          </b>
        </p>

        <table>

          <thead>

            <tr>
              <th>GST Rate</th>
              <th>Taxable Amount</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Total GST</th>
            </tr>

          </thead>

          <tbody>

            ${
              gstRows ||
              `
              <tr>
                <td colspan="5">
                  No GST data found
                </td>
              </tr>
              `
            }

            <tr class="total">

              <td>TOTAL</td>

              <td>
                ${money(
                  monthlyTotalTaxable
                )}
              </td>

              <td>
                ${money(
                  monthlyTotalCGST
                )}
              </td>

              <td>
                ${money(
                  monthlyTotalSGST
                )}
              </td>

              <td>
                ${money(
                  monthlyTotalGST
                )}
              </td>

            </tr>

          </tbody>

        </table>

        <!-- =========================================
             PURCHASE GST SUMMARY
        ========================================== -->

        <h2 class="purchase-title">
          🛒 Purchase GST-wise Summary
        </h2>

        <p>
          Purchase Taxable Amount:
          <b>
            ${money(
              monthlyPurchaseTaxable
            )}
          </b>
        </p>

        <p>
          Purchase GST:
          <b class="gst">
            ${money(
              monthlyPurchaseGST
            )}
          </b>
        </p>

        <table>

          <thead>

            <tr>
              <th>GST Rate</th>
              <th>Quantity</th>
              <th>Taxable</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>GST</th>
              <th>Total</th>
            </tr>

          </thead>

          <tbody>

            ${
              purchaseGSTRows ||
              `
              <tr>
                <td colspan="7">
                  No Purchase GST data found
                </td>
              </tr>
              `
            }

            <tr class="total">

              <td>TOTAL</td>

              <td>
                ${monthlyPurchaseGSTSummary.reduce(
                  (sum, item) =>
                    sum +
                    item.quantity,
                  0
                )}
              </td>

              <td>
                ${money(
                  monthlyPurchaseTaxable
                )}
              </td>

              <td>
                ${money(
                  monthlyPurchaseCGST
                )}
              </td>

              <td>
                ${money(
                  monthlyPurchaseSGST
                )}
              </td>

              <td>
                ${money(
                  monthlyPurchaseGST
                )}
              </td>

              <td>
                ${money(
                  monthlyPurchaseTaxable +
                    monthlyPurchaseGST
                )}
              </td>

            </tr>

          </tbody>

        </table>

        <!-- =========================================
             PURCHASE ITEM GST DETAILS
        ========================================== -->

        <h2 class="purchase-title">
          💊 Purchase Item-wise GST Details
        </h2>

        <p>
          इस table में प्रत्येक purchased item का
          GST rate दिखाई देगा।
        </p>

        <table>

          <thead>

            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Purchase Rate</th>
              <th>GST %</th>
              <th>Taxable</th>
              <th>GST Amount</th>
              <th>Total</th>
            </tr>

          </thead>

          <tbody>

            ${
              purchaseItemRows ||
              `
              <tr>
                <td colspan="10">
                  No Purchase Item GST data found
                </td>
              </tr>
              `
            }

          </tbody>

        </table>

        <!-- =========================================
             MONTHLY BILLS
        ========================================== -->

        <h2>
          Monthly Bills
        </h2>

        <table>

          <thead>

            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Udhari</th>
            </tr>

          </thead>

          <tbody>

            ${
              rows ||
              `
              <tr>
                <td colspan="6">
                  No bills found
                </td>
              </tr>
              `
            }

          </tbody>

        </table>

      </body>

      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  useEffect(() => {
    const refreshReports = () => {
      setRefresh(
        (value) => value + 1
      );
    };

    const events = [
      "storage",
      "billUpdated",
      "saleUpdated",
      "purchaseUpdated",
      "customerPaymentUpdated",
      "customerLedgerUpdated",
      "supplierPaymentUpdated",
      "supplierLedgerUpdated",
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        refreshReports
      );
    });

    const timer =
      setInterval(
        refreshReports,
        1000
      );

    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          refreshReports
        );
      });

      clearInterval(timer);
    };
  }, []);

  // =====================================================
  // CLICKABLE CARD
  // =====================================================

  const ClickableCard = ({
    title,
    value,
    icon,
    color,
    onClick,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...summaryCardStyle,
          borderLeft:
            `5px solid ${color}`,
        }}
        title={`Open ${title}`}
      >
        <div
          style={{
            fontSize: 27,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            color: "#6b7280",
            fontSize: 13,
            marginTop: 7,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color,
            fontSize: 21,
            fontWeight: "bold",
            marginTop: 5,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "#64748b",
          }}
        >
          👆 Details खोलें
        </div>
      </button>
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

          <h1
            style={{
              margin: 0,
            }}
          >
            📊 Reports
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.9,
            }}
          >
            Shivam Medical ERP
          </div>

        </div>

        <button
          type="button"
          onClick={
            goBack ||
            (() =>
              navigate(
                "dashboard"
              ))
          }
          style={backHeaderButton}
        >
          ⬅️ Dashboard
        </button>

      </div>

      {/* REPORT PERIOD */}

      <div style={cardStyle}>

        <h2 style={titleStyle}>
          📅 Report Period
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}
        >

          <div>

            <label style={labelStyle}>
              Report Type
            </label>

            <select
              value={reportType}
              onChange={(e) =>
                setReportType(
                  e.target.value
                )
              }
              style={inputStyle}
            >

              <option value="monthly">
                📅 Monthly Report
              </option>

              <option value="today">
                📆 Today Report
              </option>

            </select>

          </div>

          {reportType ===
            "monthly" && (

            <div>

              <label style={labelStyle}>
                Month Select करें
              </label>

              <input
                type="month"
                value={
                  selectedMonth
                }
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

            </div>

          )}

        </div>

      </div>

      {/* TODAY */}

      {reportType === "today" && (
        <>

          <div style={sectionTitleBox}>
            📆 आज का हिसाब
          </div>

          <div style={summaryGrid}>

            <ClickableCard
              title="आज की Sale"
              value={money(
                todaySale
              )}
              icon="💰"
              color="#1565c0"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

            <ClickableCard
              title="आज की Purchase"
              value={money(
                todayPurchase
              )}
              icon="🛒"
              color="#ef6c00"
              onClick={() =>
                navigate(
                  "purchaseHistory"
                )
              }
            />

            <ClickableCard
              title="आज के Bills"
              value={
                todayBills.length
              }
              icon="🧾"
              color="#6a1b9a"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

          </div>

        </>
      )}

      {/* MONTHLY */}

      {reportType ===
        "monthly" && (
        <>

          <div style={sectionTitleBox}>
            📊 {formatMonth(
              selectedMonth
            )} का पूरा हिसाब
          </div>

          {/* SUMMARY */}

          <div style={summaryGrid}>

            <ClickableCard
              title="Total Sale"
              value={money(
                monthlySale
              )}
              icon="💰"
              color="#1565c0"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

            <ClickableCard
              title="Bill Paid"
              value={money(
                monthlyBillPaid
              )}
              icon="💵"
              color="#2e7d32"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

            <ClickableCard
              title="Customer Udhari"
              value={money(
                Math.max(
                  monthlyBillUdhari -
                    monthlyCustomerPayment,
                  0
                )
              )}
              icon="👤"
              color="#d32f2f"
              onClick={() =>
                navigate(
                  "customerLedger"
                )
              }
            />

            <ClickableCard
              title="Total Purchase"
              value={money(
                monthlyPurchase
              )}
              icon="🛒"
              color="#ef6c00"
              onClick={() =>
                navigate(
                  "purchaseHistory"
                )
              }
            />

            <ClickableCard
              title="Supplier Paid"
              value={money(
                monthlySupplierPayment
              )}
              icon="🏭"
              color="#00838f"
              onClick={() =>
                navigate(
                  "supplierPayment"
                )
              }
            />

            <ClickableCard
              title="Supplier Udhari"
              value={money(
                Math.max(
                  monthlyPurchaseUdhari -
                    monthlySupplierPayment,
                  0
                )
              )}
              icon="📒"
              color="#d32f2f"
              onClick={() =>
                navigate(
                  "supplierLedger"
                )
              }
            />

            <ClickableCard
              title="Total Profit"
              value={money(
                monthlyProfit
              )}
              icon="📈"
              color="#2e7d32"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

            <ClickableCard
              title="Net Cash"
              value={money(
                monthlyNetCash
              )}
              icon="💰"
              color="#6a1b9a"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
            />

          </div>

          {/* COUNTS */}

          <div style={countBox}>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
              style={countButton}
            >
              🧾 Bills:
              <b>
                {monthlyBills.length}
              </b>
              <span>
                → Open
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "salesHistory"
                )
              }
              style={countButton}
            >
              💊 Sales Entries:
              <b>
                {monthlySales.length}
              </b>
              <span>
                → Open
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "purchaseHistory"
                )
              }
              style={countButton}
            >
              🛒 Purchase Entries:
              <b>
                {monthlyPurchases.length}
              </b>
              <span>
                → Open
              </span>
            </button>

          </div>

          {/* SHARE / PRINT */}

          <div style={actionCard}>

            <h2 style={titleStyle}>
              📤 Monthly Report
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(200px,1fr))",
                gap: 10,
              }}
            >

              <button
                type="button"
                onClick={
                  shareMonthlyReport
                }
                style={shareButton}
              >
                📤 Share Monthly Report
              </button>

              <button
                type="button"
                onClick={
                  printMonthlyReport
                }
                style={printButton}
              >
                🖨️ Print Monthly Report
              </button>

            </div>

          </div>

          {/* =================================================
              SALE GST REPORT
          ================================================= */}

          <div style={cardStyle}>

            <h2 style={titleStyle}>
              🧾 Sale GST-wise Report
            </h2>

            <div style={summaryGrid}>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #1565c0",
                  cursor: "default",
                }}
              >

                <div>📊</div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Total Taxable Amount
                </div>

                <div
                  style={{
                    color: "#1565c0",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyTotalTaxable
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #2e7d32",
                  cursor: "default",
                }}
              >

                <div>🧾</div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Total GST
                </div>

                <div
                  style={{
                    color: "#2e7d32",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyTotalGST
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #ef6c00",
                  cursor: "default",
                }}
              >

                <div>📘</div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Total CGST
                </div>

                <div
                  style={{
                    color: "#ef6c00",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyTotalCGST
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #6a1b9a",
                  cursor: "default",
                }}
              >

                <div>📗</div>

                <div
                  style={{
                    color: "#6a1b9a",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Total SGST
                </div>

                <div
                  style={{
                    color: "#6a1b9a",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyTotalSGST
                  )}
                </div>

              </div>

            </div>

            {monthlyGSTSummary.length ===
            0 ? (

              <div style={emptyStyle}>
                इस महीने Sale GST data नहीं मिला।
              </div>

            ) : (

              <div style={tableWrapper}>

                <table
                  style={tableStyle}
                >

                  <thead>

                    <tr>

                      <th>GST Rate</th>
                      <th>Taxable Amount</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>Total GST</th>

                    </tr>

                  </thead>

                  <tbody>

                    {monthlyGSTSummary.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          <td
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#1565c0",
                            }}
                          >
                            {item.rate}%
                          </td>

                          <td>
                            {money(
                              item.taxable
                            )}
                          </td>

                          <td>
                            {money(
                              item.cgst
                            )}
                          </td>

                          <td>
                            {money(
                              item.sgst
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              item.gst
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* =================================================
              PURCHASE GST-WISE REPORT
          ================================================= */}

          <div style={cardStyle}>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >

              <div>

                <h2
                  style={{
                    ...titleStyle,
                    color: "#ef6c00",
                  }}
                >
                  🛒 Purchase GST-wise Report
                </h2>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  कौन-सा item कितने % GST में आया
                  यह यहाँ दिखाई देगा।
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "purchaseHistory"
                  )
                }
                style={{
                  background:
                    "#ef6c00",
                  color: "white",
                  border: "none",
                  padding:
                    "10px 14px",
                  borderRadius: 8,
                  fontWeight:
                    "bold",
                  cursor: "pointer",
                }}
              >
                🛒 Purchase History →
              </button>

            </div>

            {/* PURCHASE GST CARDS */}

            <div
              style={{
                ...summaryGrid,
                marginTop: 15,
              }}
            >

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #ef6c00",
                  cursor: "default",
                }}
              >

                <div
                  style={{
                    fontSize: 25,
                  }}
                >
                  🛒
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Purchase Taxable
                </div>

                <div
                  style={{
                    color: "#ef6c00",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyPurchaseTaxable
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #2e7d32",
                  cursor: "default",
                }}
              >

                <div
                  style={{
                    fontSize: 25,
                  }}
                >
                  🧾
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Purchase GST
                </div>

                <div
                  style={{
                    color: "#2e7d32",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyPurchaseGST
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #1565c0",
                  cursor: "default",
                }}
              >

                <div
                  style={{
                    fontSize: 25,
                  }}
                >
                  📘
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Purchase CGST
                </div>

                <div
                  style={{
                    color: "#1565c0",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyPurchaseCGST
                  )}
                </div>

              </div>

              <div
                style={{
                  ...summaryCardStyle,
                  borderLeft:
                    "5px solid #6a1b9a",
                  cursor: "default",
                }}
              >

                <div
                  style={{
                    fontSize: 25,
                  }}
                >
                  📗
                </div>

                <div
                  style={{
                    color: "#6a1b9a",
                    fontSize: 13,
                    marginTop: 7,
                  }}
                >
                  Purchase SGST
                </div>

                <div
                  style={{
                    color: "#6a1b9a",
                    fontSize: 20,
                    fontWeight:
                      "bold",
                    marginTop: 5,
                  }}
                >
                  {money(
                    monthlyPurchaseSGST
                  )}
                </div>

              </div>

            </div>

            {/* GST RATE SUMMARY */}

            <h3
              style={{
                marginTop: 22,
                color: "#ef6c00",
              }}
            >
              📊 Purchase GST Rate Summary
            </h3>

            {monthlyPurchaseGSTSummary.length ===
            0 ? (

              <div style={emptyStyle}>
                इस महीने Purchase GST data नहीं मिला।
                <br />
                <small>
                  Purchase में GST Rate save होना
                  चाहिए।
                </small>
              </div>

            ) : (

              <div style={tableWrapper}>

                <table
                  style={tableStyle}
                >

                  <thead>

                    <tr>

                      <th>
                        GST Rate
                      </th>

                      <th>
                        Items
                      </th>

                      <th>
                        Quantity
                      </th>

                      <th>
                        Taxable
                      </th>

                      <th>
                        CGST
                      </th>

                      <th>
                        SGST
                      </th>

                      <th>
                        GST
                      </th>

                      <th>
                        Total Purchase
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {monthlyPurchaseGSTSummary.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          <td
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#1565c0",
                              fontSize: 16,
                            }}
                          >
                            {item.rate}%
                          </td>

                          <td>
                            {item.items}
                          </td>

                          <td>
                            {item.quantity}
                          </td>

                          <td>
                            {money(
                              item.taxable
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#1565c0",
                            }}
                          >
                            {money(
                              item.cgst
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#6a1b9a",
                            }}
                          >
                            {money(
                              item.sgst
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              item.gst
                            )}
                          </td>

                          <td
                            style={{
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              item.total
                            )}
                          </td>

                        </tr>

                      )
                    )}

                    <tr
                      style={{
                        background:
                          "#f1f5f9",
                        fontWeight:
                          "bold",
                      }}
                    >

                      <td>
                        TOTAL
                      </td>

                      <td>
                        {monthlyPurchaseGSTSummary.reduce(
                          (sum, item) =>
                            sum +
                            item.items,
                          0
                        )}
                      </td>

                      <td>
                        {monthlyPurchaseGSTSummary.reduce(
                          (sum, item) =>
                            sum +
                            item.quantity,
                          0
                        )}
                      </td>

                      <td>
                        {money(
                          monthlyPurchaseTaxable
                        )}
                      </td>

                      <td>
                        {money(
                          monthlyPurchaseCGST
                        )}
                      </td>

                      <td>
                        {money(
                          monthlyPurchaseSGST
                        )}
                      </td>

                      <td>
                        {money(
                          monthlyPurchaseGST
                        )}
                      </td>

                      <td>
                        {money(
                          monthlyPurchaseTaxable +
                            monthlyPurchaseGST
                        )}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            )}

            {/* =================================================
                ITEM-WISE PURCHASE GST
            ================================================= */}

            <h3
              style={{
                marginTop: 28,
                color: "#ef6c00",
              }}
            >
              💊 Purchase Item-wise GST Details
            </h3>

            <div
              style={{
                padding: 12,
                marginBottom: 12,
                background:
                  "#fff7ed",
                border:
                  "1px solid #fed7aa",
                borderRadius: 8,
                color: "#9a3412",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              उदाहरण:
              Paracetamol → 5% GST
              <br />
              Azithromycin → 12% GST
              <br />
              कोई item 18% GST में आया है तो
              वह भी अलग दिखाई देगा।
            </div>

            {monthlyPurchaseItems.length ===
            0 ? (

              <div style={emptyStyle}>
                इस महीने कोई Purchase Item नहीं मिला।
              </div>

            ) : (

              <div style={tableWrapper}>

                <table
                  style={{
                    ...tableStyle,
                    minWidth: 1050,
                  }}
                >

                  <thead>

                    <tr>

                      <th>#</th>

                      <th>
                        Date
                      </th>

                      <th>
                        Supplier
                      </th>

                      <th>
                        Item
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Purchase Rate
                      </th>

                      <th
                        style={{
                          background:
                            "#fff3e0",
                          color:
                            "#e65100",
                        }}
                      >
                        GST %
                      </th>

                      <th>
                        Taxable
                      </th>

                      <th>
                        GST Amount
                      </th>

                      <th>
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {monthlyPurchaseItems.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={`${item._purchaseIndex}-${item._itemIndex}-${index}`}
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {item._date}
                          </td>

                          <td>
                            {item._supplier}
                          </td>

                          <td
                            style={{
                              fontWeight:
                                "bold",
                            }}
                          >
                            {item._medicine}
                          </td>

                          <td>
                            {item._quantity}
                          </td>

                          <td>
                            {money(
                              item._rate
                            )}
                          </td>

                          {/* IMPORTANT GST % */}

                          <td
                            style={{
                              background:
                                "#fff8e1",
                              color:
                                "#e65100",
                              fontWeight:
                                "bold",
                              fontSize: 17,
                              textAlign:
                                "center",
                            }}
                          >
                            {item._gstRate}%
                          </td>

                          <td>
                            {money(
                              item._taxable
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              item._gst
                            )}
                          </td>

                          <td
                            style={{
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              item._total
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* MONTHLY BILLS */}

          <div
            style={{
              ...cardStyle,
              cursor: "pointer",
            }}
            onClick={() =>
              navigate(
                "salesHistory"
              )
            }
          >

            <div
              style={
                clickSectionHeader
              }
            >

              <h2 style={titleStyle}>
                🧾 Monthly Bills
              </h2>

              <span>
                Open Sales History →
              </span>

            </div>

            {monthlyBills.length ===
            0 ? (

              <div style={emptyStyle}>
                इस महीने कोई Bill नहीं मिला।
              </div>

            ) : (

              <div
                style={tableWrapper}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <table
                  style={tableStyle}
                >

                  <thead>

                    <tr>

                      <th>#</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Udhari</th>

                    </tr>

                  </thead>

                  <tbody>

                    {monthlyBills.map(
                      (
                        bill,
                        index
                      ) => (

                        <tr
                          key={
                            bill?.id ??
                            index
                          }
                          onClick={() =>
                            navigate(
                              "salesHistory"
                            )
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {formatDate(
                              bill
                            )}
                          </td>

                          <td>
                            {getCustomerName(
                              bill
                            )}
                          </td>

                          <td>
                            {money(
                              getBillTotal(
                                bill
                              )
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              getBillPaid(
                                bill
                              )
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#d32f2f",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              getBillUdhari(
                                bill
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* PURCHASE */}

          <div
            style={{
              ...cardStyle,
              cursor: "pointer",
            }}
            onClick={() =>
              navigate(
                "purchaseHistory"
              )
            }
          >

            <div
              style={
                clickSectionHeader
              }
            >

              <h2 style={titleStyle}>
                🛒 Monthly Purchase
              </h2>

              <span>
                Open Purchase History →
              </span>

            </div>

            {monthlyPurchases.length ===
            0 ? (

              <div style={emptyStyle}>
                इस महीने कोई Purchase नहीं मिली।
              </div>

            ) : (

              <div
                style={tableWrapper}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <table
                  style={tableStyle}
                >

                  <thead>

                    <tr>

                      <th>#</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Purchase</th>
                      <th>Paid</th>
                      <th>Udhari</th>

                    </tr>

                  </thead>

                  <tbody>

                    {monthlyPurchases.map(
                      (
                        purchase,
                        index
                      ) => (

                        <tr
                          key={
                            purchase?.id ??
                            index
                          }
                          onClick={() =>
                            navigate(
                              "purchaseHistory"
                            )
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {formatDate(
                              purchase
                            )}
                          </td>

                          <td>
                            {getSupplierName(
                              purchase
                            )}
                          </td>

                          <td>
                            {money(
                              getPurchaseTotal(
                                purchase
                              )
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              getPurchasePaid(
                                purchase
                              )
                            )}
                          </td>

                          <td
                            style={{
                              color:
                                "#d32f2f",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              getPurchaseUdhari(
                                purchase
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* PAYMENTS */}

          <div style={cardStyle}>

            <h2 style={titleStyle}>
              💳 Monthly Payments
            </h2>

            <div
              style={paymentGrid}
            >

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "customerPayment"
                  )
                }
                style={
                  paymentBoxButton
                }
              >

                <span>
                  👤 Customer Payment
                </span>

                <b
                  style={{
                    color:
                      "#2e7d32",
                  }}
                >
                  {money(
                    monthlyCustomerPayment
                  )}
                </b>

                <small>
                  Open Customer Payment →
                </small>

              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "supplierPayment"
                  )
                }
                style={
                  paymentBoxButton
                }
              >

                <span>
                  🏭 Supplier Payment
                </span>

                <b
                  style={{
                    color:
                      "#ef6c00",
                  }}
                >
                  {money(
                    monthlySupplierPayment
                  )}
                </b>

                <small>
                  Open Supplier Payment →
                </small>

              </button>

            </div>

          </div>

        </>
      )}

      {/* BACK */}

      <button
        type="button"
        onClick={
          goBack ||
          (() =>
            navigate(
              "dashboard"
            ))
        }
        style={
          bottomBackButton
        }
      >
        ⬅️ वापस Dashboard
      </button>

    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  minHeight: "100vh",
  padding: 18,
  background:
    "linear-gradient(135deg,#eef3f8,#f7f9fc)",
  fontFamily:
    "Arial, sans-serif",
  boxSizing: "border-box",
  color: "#263238",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#0d47a1,#1565c0,#42a5f5)",
  color: "white",
  padding: "18px 20px",
  borderRadius: 14,
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const backHeaderButton = {
  background: "white",
  color: "#1565c0",
  border: "none",
  padding: "10px 15px",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const cardStyle = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.06)",
  border:
    "1px solid #e7ebef",
};

const titleStyle = {
  marginTop: 0,
  marginBottom: 8,
  color: "#263238",
  fontSize: 19,
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  fontSize: 13,
  marginBottom: 7,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 7,
  fontSize: 16,
};

const sectionTitleBox = {
  background:
    "linear-gradient(135deg,#1565c0,#42a5f5)",
  color: "white",
  padding: "15px 18px",
  borderRadius: 10,
  marginBottom: 14,
  fontWeight: "bold",
  fontSize: 18,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: 12,
  marginBottom: 16,
};

const summaryCardStyle = {
  background: "white",
  borderTop: "none",
  borderRight: "none",
  borderBottom: "none",
  borderLeft: "5px solid",
  borderRadius: 12,
  padding: 16,
  textAlign: "left",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.07)",
  cursor: "pointer",
  transition:
    "transform 0.15s ease, box-shadow 0.15s ease",
};

const countBox = {
  background: "white",
  padding: 14,
  borderRadius: 10,
  marginBottom: 16,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: 10,
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.05)",
};

const countButton = {
  border:
    "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 13,
  borderRadius: 8,
  cursor: "pointer",
  textAlign: "left",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const actionCard = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.06)",
};

const shareButton = {
  width: "100%",
  padding: 14,
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
};

const printButton = {
  width: "100%",
  padding: 14,
  background: "#1565c0",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
};

const clickSectionHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 10,
  color: "#1565c0",
};

const paymentGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const paymentBoxButton = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
  padding: 15,
  background: "#f8fafc",
  borderRadius: 8,
  border:
    "1px solid #e5e7eb",
  cursor: "pointer",
  textAlign: "left",
  fontSize: 14,
};

const tableWrapper = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 650,
};

const emptyStyle = {
  padding: 20,
  textAlign: "center",
  color: "#777",
  background: "#f8fafc",
  borderRadius: 8,
};

const bottomBackButton = {
  width: "100%",
  padding: 14,
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: 20,
};

export default Reports;