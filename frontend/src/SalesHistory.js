
import React, { useMemo, useState } from "react";

function SaleHistory({ goBack }) {
  const [search, setSearch] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);

  // =====================================================
  // GET SALES
  // =====================================================
  const getSales = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem("sales") || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const sales = getSales();

  // =====================================================
  // GET STOCK
  // =====================================================
  const getStock = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem("stock") || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const stock = getStock();

  // =====================================================
  // NUMBER
  // =====================================================
  const toNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const n = Number(
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .trim()
    );

    return Number.isFinite(n) ? n : 0;
  };

  // =====================================================
  // TEXT
  // =====================================================
  const textValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "object" ||
      Array.isArray(value)
    ) {
      return "";
    }

    return String(value).trim();
  };

  // =====================================================
  // FIND VALUE
  // Direct + nested + arrays
  // =====================================================
  const findValue = (sale, fields) => {
    if (!sale || typeof sale !== "object") {
      return "";
    }

    // ---------------------------------------------------
    // 1. DIRECT
    // ---------------------------------------------------
    for (const field of fields) {
      const value = sale[field];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    // ---------------------------------------------------
    // 2. NESTED OBJECTS
    // ---------------------------------------------------
    const nestedObjects = [
      sale.item,
      sale.product,
      sale.medicineItem,
      sale.saleItem,
      sale.selectedItem,
      sale.stockItem,
      sale.medicineData,
      sale.productData,
    ];

    for (const item of nestedObjects) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        continue;
      }

      for (const field of fields) {
        const value = item[field];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          return value;
        }
      }
    }

    // ---------------------------------------------------
    // 3. ARRAYS
    // ---------------------------------------------------
    const arrays = [
      sale.items,
      sale.products,
      sale.saleItems,
      sale.billItems,
      sale.medicines,
      sale.entries,
      sale.cart,
    ];

    for (const arr of arrays) {
      if (!Array.isArray(arr)) {
        continue;
      }

      for (const item of arr) {
        if (
          !item ||
          typeof item !== "object"
        ) {
          continue;
        }

        for (const field of fields) {
          const value = item[field];

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            return value;
          }
        }
      }
    }

    return "";
  };

  // =====================================================
  // GET SALE ITEMS
  // =====================================================
  const getSaleItems = (sale) => {
    if (!sale || typeof sale !== "object") {
      return [];
    }

    if (Array.isArray(sale.items)) {
      return sale.items;
    }

    if (Array.isArray(sale.saleItems)) {
      return sale.saleItems;
    }

    if (Array.isArray(sale.billItems)) {
      return sale.billItems;
    }

    if (Array.isArray(sale.products)) {
      return sale.products;
    }

    if (Array.isArray(sale.medicines)) {
      return sale.medicines;
    }

    if (Array.isArray(sale.entries)) {
      return sale.entries;
    }

    if (Array.isArray(sale.cart)) {
      return sale.cart;
    }

    return [];
  };

  // =====================================================
  // GET STOCK ITEM USING STOCK ID
  // =====================================================
  const getStockItem = (saleItem) => {
    if (!saleItem || typeof saleItem !== "object") {
      return null;
    }

    const stockId = textValue(
      saleItem.stockId ||
      saleItem.stockID ||
      saleItem.stock_id
    );

    // ---------------------------------------------------
    // FIRST: MATCH BY stockId
    // ---------------------------------------------------
    if (stockId) {
      const foundById = stock.find(
        (item) =>
          String(item?.id || "") ===
          String(stockId)
      );

      if (foundById) {
        return foundById;
      }
    }

    // ---------------------------------------------------
    // SECOND: MATCH BY BARCODE
    // ---------------------------------------------------
    const barcode = textValue(
      saleItem.barcode ||
      saleItem.barCode ||
      saleItem.Barcode
    );

    if (barcode) {
      const foundByBarcode = stock.find(
        (item) =>
          textValue(
            item?.barcode ||
            item?.barCode ||
            item?.Barcode
          ) === barcode
      );

      if (foundByBarcode) {
        return foundByBarcode;
      }
    }

    // ---------------------------------------------------
    // THIRD: MATCH BY MEDICINE + BATCH
    // ---------------------------------------------------
    const medicine = textValue(
      saleItem.medicine ||
      saleItem.medicineName ||
      saleItem.name ||
      saleItem.productName
    ).toLowerCase();

    const batch = textValue(
      saleItem.batch ||
      saleItem.batchNo ||
      saleItem.batchNumber
    ).toLowerCase();

    if (medicine) {
      const foundByMedicineBatch =
        stock.find((item) => {
          const stockMedicine =
            textValue(
              item?.medicine ||
              item?.name ||
              item?.medicineName
            ).toLowerCase();

          const stockBatch =
            textValue(
              item?.batch ||
              item?.batchNo ||
              item?.batchNumber
            ).toLowerCase();

          if (
            stockMedicine !== medicine
          ) {
            return false;
          }

          if (batch) {
            return stockBatch === batch;
          }

          return true;
        });

      if (foundByMedicineBatch) {
        return foundByMedicineBatch;
      }
    }

    return null;
  };

  // =====================================================
  // PURCHASE RATE FROM STOCK
  // =====================================================
  const getPurchaseRateFromStock = (
    saleItem
  ) => {
    const stockItem =
      getStockItem(saleItem);

    if (!stockItem) {
      return 0;
    }

    // IMPORTANT:
    // Profit uses actual purchaseRate ₹50
    // NOT purchaseRateWithGST ₹52.50
    const purchaseRate =
      toNumber(
        stockItem.purchaseRate
      );

    if (purchaseRate > 0) {
      return purchaseRate;
    }

    // Backup fields
    return toNumber(
      stockItem.basePurchaseRate ??
      stockItem.rate ??
      stockItem.purchase ??
      0
    );
  };

  // =====================================================
  // BILL NO
  // =====================================================
  const getBillNumber = (sale) => {
    return textValue(
      findValue(sale, [
        "billNumber",
        "billNo",
        "invoiceNumber",
        "invoiceNo",
        "invoice",
        "bill",
        "receiptNo",
        "receiptNumber",
        "saleBillNo",
        "saleInvoiceNo",
        "number",
      ])
    );
  };

  // =====================================================
  // MEDICINE
  // =====================================================
  const getMedicine = (sale) => {
    return textValue(
      findValue(sale, [
        "medicine",
        "medicineName",
        "name",
        "productName",
        "itemName",
        "drugName",
        "medicine_name",
        "product",
        "item",
      ])
    );
  };

  // =====================================================
  // COMPANY
  // =====================================================
  const getCompany = (sale) => {
    return textValue(
      findValue(sale, [
        "company",
        "companyName",
        "manufacturer",
        "manufacturerName",
        "firm",
      ])
    );
  };

  // =====================================================
  // BARCODE
  // =====================================================
  const getBarcode = (sale) => {
    return textValue(
      findValue(sale, [
        "barcode",
        "barCode",
        "Barcode",
        "itemBarcode",
        "productBarcode",
        "medicineBarcode",
        "barcodeNo",
        "barcodeNumber",
      ])
    );
  };

  // =====================================================
  // BATCH
  // =====================================================
  const getBatch = (sale) => {
    return textValue(
      findValue(sale, [
        "batch",
        "batchNo",
        "batchNumber",
        "batch_no",
        "batchCode",
        "lot",
        "lotNo",
        "lotNumber",
      ])
    );
  };

  // =====================================================
  // CUSTOMER
  // =====================================================
  const getCustomer = (sale) => {
    return (
      textValue(
        findValue(sale, [
          "customer",
          "customerName",
          "customer_name",
          "nameOfCustomer",
          "party",
          "partyName",
        ])
      ) || "Cash Customer"
    );
  };

  // =====================================================
  // MOBILE
  // =====================================================
  const getMobile = (sale) => {
    return textValue(
      findValue(sale, [
        "mobile",
        "customerMobile",
        "customerPhone",
        "phone",
        "phoneNumber",
        "mobileNumber",
      ])
    );
  };

  // =====================================================
  // DATE
  // =====================================================
  const getDate = (sale) => {
    return textValue(
      findValue(sale, [
        "date",
        "saleDate",
        "billDate",
        "invoiceDate",
        "createdDate",
      ])
    );
  };

  // =====================================================
  // TIME
  // =====================================================
  const getTime = (sale) => {
    return textValue(
      findValue(sale, [
        "time",
        "saleTime",
        "billTime",
        "invoiceTime",
        "createdTime",
      ])
    );
  };

  // =====================================================
  // QUANTITY
  // =====================================================
  const getSaleQuantity = (sale) => {
    if (!sale || typeof sale !== "object") {
      return 0;
    }

    const fields = [
      "quantity",
      "qty",
      "qtySold",
      "itemQuantity",
      "saleQty",
      "soldQty",
      "units",
      "count",
      "quantitySold",
      "soldQuantity",
      "billingQty",
      "billQty",
      "totalQty",
      "saleQuantity",
      "sellingQuantity",
    ];

    // Direct / nested
    const direct = toNumber(
      findValue(sale, fields)
    );

    if (direct > 0) {
      return direct;
    }

    // Arrays - total quantity
    const arrays = [
      sale.items,
      sale.products,
      sale.saleItems,
      sale.billItems,
      sale.medicines,
      sale.entries,
      sale.cart,
    ];

    for (const arr of arrays) {
      if (!Array.isArray(arr)) {
        continue;
      }

      let total = 0;

      arr.forEach((item) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return;
        }

        for (const field of fields) {
          const value = toNumber(
            item[field]
          );

          if (value > 0) {
            total += value;
            break;
          }
        }
      });

      if (total > 0) {
        return total;
      }
    }

    // Amount / rate fallback
    const amount = getSaleAmount(sale);
    const rate = getSaleRate(sale);

    if (amount > 0 && rate > 0) {
      const qty = amount / rate;

      if (
        Number.isFinite(qty) &&
        qty > 0
      ) {
        return qty;
      }
    }

    return 0;
  };

  // =====================================================
  // SALE RATE
  // =====================================================
  const getSaleRate = (sale) => {
    const value = findValue(sale, [
      "saleRate",
      "sellingRate",
      "sellRate",
      "rate",
      "sale_price",
      "sellingPrice",
      "sellPrice",
      "price",
      "mrp",
    ]);

    return toNumber(value);
  };

  // =====================================================
  // AMOUNT
  // =====================================================
  const getSaleAmount = (sale) => {
    const value = findValue(sale, [
      "saleAmount",
      "amount",
      "total",
      "netAmount",
      "finalAmount",
      "billAmount",
      "totalAmount",
      "grandTotal",
      "netTotal",
      "lineTotal",
      "itemTotal",
      "totalPrice",
    ]);

    const amount = toNumber(value);

    if (amount !== 0) {
      return amount;
    }

    const qty =
      getSaleQuantityWithoutAmount(sale);

    const rate =
      getSaleRate(sale);

    if (qty > 0 && rate > 0) {
      return qty * rate;
    }

    return 0;
  };

  // =====================================================
  // QUANTITY WITHOUT AMOUNT FALLBACK
  // =====================================================
  const getSaleQuantityWithoutAmount = (
    sale
  ) => {
    const fields = [
      "quantity",
      "qty",
      "qtySold",
      "itemQuantity",
      "saleQty",
      "soldQty",
      "units",
      "count",
      "quantitySold",
      "soldQuantity",
      "billingQty",
      "billQty",
      "totalQty",
      "saleQuantity",
      "sellingQuantity",
    ];

    const value = findValue(
      sale,
      fields
    );

    return toNumber(value);
  };

  // =====================================================
  // PROFIT FOR ONE SALE ITEM
  // =====================================================
  const getItemProfit = (saleItem) => {
    if (
      !saleItem ||
      typeof saleItem !== "object"
    ) {
      return 0;
    }

    // ---------------------------------------------------
    // 1. If Billing has already saved profit, use it
    // ---------------------------------------------------
    const directProfit = toNumber(
      saleItem.profit ??
      saleItem.saleProfit ??
      saleItem.itemProfit ??
      saleItem.grossProfit ??
      saleItem.profitAmount ??
      saleItem.profitValue ??
      saleItem.profitAmt ??
      saleItem.itemProfitAmount
    );

    if (directProfit !== 0) {
      return directProfit;
    }

    // ---------------------------------------------------
    // 2. Sale Rate
    // ---------------------------------------------------
    const saleRate = toNumber(
      saleItem.saleRate ??
      saleItem.sellingRate ??
      saleItem.sellRate ??
      saleItem.rate ??
      saleItem.price
    );

    // ---------------------------------------------------
    // 3. Purchase Rate FROM STOCK USING stockId
    // ---------------------------------------------------
    const purchaseRate =
      getPurchaseRateFromStock(
        saleItem
      );

    // ---------------------------------------------------
    // 4. Quantity
    // ---------------------------------------------------
    const quantity = toNumber(
      saleItem.quantity ??
      saleItem.qty ??
      saleItem.qtySold ??
      saleItem.itemQuantity ??
      saleItem.saleQty ??
      saleItem.soldQty ??
      saleItem.units ??
      saleItem.quantitySold ??
      saleItem.soldQuantity ??
      saleItem.billingQty ??
      saleItem.billQty ??
      0
    );

    if (
      saleRate > 0 &&
      purchaseRate > 0 &&
      quantity > 0
    ) {
      return (
        (saleRate - purchaseRate) *
        quantity
      );
    }

    return 0;
  };

  // =====================================================
  // PROFIT
  // =====================================================
  const getProfit = (sale) => {
    if (!sale || typeof sale !== "object") {
      return 0;
    }

    // ---------------------------------------------------
    // 1. Direct sale-level profit
    // ---------------------------------------------------
    const directProfit = toNumber(
      sale.profit ??
      sale.saleProfit ??
      sale.grossProfit ??
      sale.profitAmount ??
      sale.totalProfit ??
      sale.profitValue
    );

    if (directProfit !== 0) {
      return directProfit;
    }

    // ---------------------------------------------------
    // 2. Calculate from every item
    // ---------------------------------------------------
    const items = getSaleItems(sale);

    if (items.length > 0) {
      return items.reduce(
        (sum, item) =>
          sum + getItemProfit(item),
        0
      );
    }

    // ---------------------------------------------------
    // 3. Old / fallback sale structure
    // ---------------------------------------------------
    const saleRate =
      getSaleRate(sale);

    let purchaseRate = toNumber(
      findValue(sale, [
        "purchaseRate",
        "buyRate",
        "costRate",
        "costPrice",
        "purchasePrice",
        "buyingRate",
        "ratePurchase",
      ])
    );

    if (purchaseRate <= 0) {
      purchaseRate =
        getPurchaseRateFromStock(
          sale
        );
    }

    const qty =
      getSaleQuantityWithoutAmount(
        sale
      );

    if (
      saleRate > 0 &&
      purchaseRate > 0 &&
      qty > 0
    ) {
      return (
        (saleRate - purchaseRate) *
        qty
      );
    }

    return 0;
  };

  // =====================================================
  // UDHARI
  // =====================================================
  const getUdhari = (sale) => {
    const value = findValue(sale, [
      "pendingAmount",
      "udhari",
      "creditAmount",
      "dueAmount",
      "balance",
      "pending",
      "credit",
      "due",
      "remainingAmount",
      "outstanding",
    ]);

    return toNumber(value);
  };

  // =====================================================
  // FILTER
  // =====================================================
  const filteredSales = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    if (!text) {
      return sales;
    }

    return sales.filter((sale) => {
      return (
        getMedicine(sale)
          .toLowerCase()
          .includes(text) ||
        getCustomer(sale)
          .toLowerCase()
          .includes(text) ||
        getMobile(sale)
          .toLowerCase()
          .includes(text) ||
        getBillNumber(sale)
          .toLowerCase()
          .includes(text) ||
        getBarcode(sale)
          .toLowerCase()
          .includes(text) ||
        getBatch(sale)
          .toLowerCase()
          .includes(text) ||
        getCompany(sale)
          .toLowerCase()
          .includes(text)
      );
    });
  }, [sales, search]);

  // =====================================================
  // SUMMARY
  // =====================================================
  const totalAmount =
    filteredSales.reduce(
      (sum, sale) =>
        sum + getSaleAmount(sale),
      0
    );

  const totalProfit =
    filteredSales.reduce(
      (sum, sale) =>
        sum + getProfit(sale),
      0
    );

  const totalQty =
    filteredSales.reduce(
      (sum, sale) =>
        sum + getSaleQuantity(sale),
      0
    );

  const totalUdhari =
    filteredSales.reduce(
      (sum, sale) =>
        sum + getUdhari(sale),
      0
    );

  // =====================================================
  // MONEY
  // =====================================================
  const money = (value) =>
    `₹${toNumber(value).toFixed(2)}`;

  // =====================================================
  // QTY FORMAT
  // =====================================================
  const formatQty = (value) => {
    const number = toNumber(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return Number.isInteger(number)
      ? String(number)
      : number.toFixed(2);
  };

  // =====================================================
  // OPEN BILL
  // =====================================================
  const openBill = (sale) => {
    const billNo =
      getBillNumber(sale);

    if (!billNo) {
      return;
    }

    setSelectedBill({
      ...sale,
      __billNumber: billNo,
    });
  };

  // =====================================================
  // CLOSE BILL
  // =====================================================
  const closeBill = () => {
    setSelectedBill(null);
  };

  // =====================================================
  // SELECTED BILL SALES
  // =====================================================
  const selectedBillSales =
    useMemo(() => {
      if (!selectedBill) {
        return [];
      }

      const selectedNo =
        getBillNumber(selectedBill);

      if (!selectedNo) {
        return [selectedBill];
      }

      return sales.filter(
        (sale) =>
          String(
            getBillNumber(sale)
          ) === String(selectedNo)
      );
    }, [sales, selectedBill]);

  // =====================================================
  // SELECTED BILL TOTAL
  // =====================================================
  const selectedBillTotal =
    selectedBillSales.reduce(
      (sum, sale) =>
        sum + getSaleAmount(sale),
      0
    );

  const selectedBillQty =
    selectedBillSales.reduce(
      (sum, sale) =>
        sum + getSaleQuantity(sale),
      0
    );

  const selectedBillProfit =
    selectedBillSales.reduce(
      (sum, sale) =>
        sum + getProfit(sale),
      0
    );

  // =====================================================
  // UI
  // =====================================================
  return (
    <div style={pageStyle}>

      {/* HEADER */}
      <div style={headerStyle}>

        <div>
          <h2 style={{ margin: 0 }}>
            📊 Sale History
          </h2>

          <div
            style={{
              fontSize: 13,
              marginTop: 3,
            }}
          >
            Shivam Medical ERP
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
      <div style={boxStyle}>
        <input
          type="text"
          placeholder="🔍 Medicine / Customer / Bill No. / Barcode / Batch"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={inputStyle}
        />
      </div>

      {/* SUMMARY */}
      <div style={summaryGrid}>

        <Summary
          title="Total Quantity"
          value={formatQty(totalQty)}
          color="#1565c0"
        />

        <Summary
          title="Sale Amount"
          value={money(totalAmount)}
          color="#2e7d32"
        />

        <Summary
          title="Profit"
          value={money(totalProfit)}
          color="#00838f"
        />

        <Summary
          title="Total Udhari"
          value={money(totalUdhari)}
          color="#d32f2f"
        />

      </div>

      {/* SALES TABLE */}
      <div style={boxStyle}>

        <h3 style={{ marginTop: 0 }}>
          🧾 Sales
        </h3>

        {filteredSales.length === 0 ? (
          <div style={emptyStyle}>
            कोई Sale History उपलब्ध नहीं है।
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table style={tableStyle}>

              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Bill No.</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Medicine</th>
                  <th style={thStyle}>Barcode</th>
                  <th style={thStyle}>Batch</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Sale Rate</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Profit</th>
                  <th style={thStyle}>Udhari</th>
                </tr>
              </thead>

              <tbody>

                {filteredSales.map(
                  (sale, index) => {

                    const billNo =
                      getBillNumber(sale);

                    const medicine =
                      getMedicine(sale);

                    const company =
                      getCompany(sale);

                    const barcode =
                      getBarcode(sale);

                    const batch =
                      getBatch(sale);

                    const customer =
                      getCustomer(sale);

                    const mobile =
                      getMobile(sale);

                    const date =
                      getDate(sale);

                    const time =
                      getTime(sale);

                    const quantity =
                      getSaleQuantity(sale);

                    const saleRate =
                      getSaleRate(sale);

                    const amount =
                      getSaleAmount(sale);

                    const profit =
                      getProfit(sale);

                    const udhari =
                      getUdhari(sale);

                    return (
                      <tr
                        key={
                          sale.id ||
                          `${billNo || "sale"}-${index}`
                        }
                      >

                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        {/* BILL NO */}
                        <td style={tdStyle}>
                          {billNo ? (
                            <button
                              type="button"
                              onClick={() =>
                                openBill(sale)
                              }
                              style={
                                billButtonStyle
                              }
                            >
                              🧾 {billNo}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* DATE */}
                        <td style={tdStyle}>
                          {date || "-"}

                          {time && (
                            <>
                              <br />
                              <small>
                                {time}
                              </small>
                            </>
                          )}
                        </td>

                        {/* CUSTOMER */}
                        <td style={tdStyle}>
                          {customer}

                          {mobile && (
                            <>
                              <br />
                              <small>
                                📱 {mobile}
                              </small>
                            </>
                          )}
                        </td>

                        {/* MEDICINE */}
                        <td style={tdStyle}>
                          <b>
                            {medicine || "-"}
                          </b>

                          {company && (
                            <>
                              <br />
                              <small>
                                {company}
                              </small>
                            </>
                          )}
                        </td>

                        {/* BARCODE */}
                        <td style={tdStyle}>
                          {barcode || "-"}
                        </td>

                        {/* BATCH */}
                        <td style={tdStyle}>
                          {batch || "-"}
                        </td>

                        {/* QTY */}
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color:
                              quantity > 0
                                ? "#1565c0"
                                : "#d32f2f",
                          }}
                        >
                          {formatQty(
                            quantity
                          )}
                        </td>

                        {/* RATE */}
                        <td style={tdStyle}>
                          {money(
                            saleRate
                          )}
                        </td>

                        {/* AMOUNT */}
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {money(amount)}
                        </td>

                        {/* PROFIT */}
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              profit >= 0
                                ? "#2e7d32"
                                : "#d32f2f",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {money(profit)}
                        </td>

                        {/* UDHARI */}
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              udhari > 0
                                ? "#d32f2f"
                                : "#2e7d32",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {money(udhari)}
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
          BILL DETAILS MODAL
          ================================================= */}
      {selectedBill && (
        <div style={modalOverlayStyle}>

          <div style={modalStyle}>

            {/* HEADER */}
            <div style={modalHeaderStyle}>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                  }}
                >
                  🧾 Bill Details
                </h2>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  Bill No.:{" "}
                  <b>
                    {getBillNumber(
                      selectedBill
                    ) || "-"}
                  </b>
                </div>
              </div>

              <button
                type="button"
                onClick={closeBill}
                style={closeButtonStyle}
              >
                ✕
              </button>

            </div>

            {/* CUSTOMER */}
            <div style={customerBoxStyle}>

              <div>
                <b>Customer:</b>{" "}
                {getCustomer(
                  selectedBill
                )}
              </div>

              {getMobile(selectedBill) && (
                <div>
                  <b>Mobile:</b>{" "}
                  {getMobile(
                    selectedBill
                  )}
                </div>
              )}

              <div>
                <b>Date:</b>{" "}
                {getDate(selectedBill) ||
                  "-"}
              </div>

              {getTime(selectedBill) && (
                <div>
                  <b>Time:</b>{" "}
                  {getTime(
                    selectedBill
                  )}
                </div>
              )}

            </div>

            {/* BILL ITEMS */}
            <div
              style={{
                overflowX: "auto",
              }}
            >

              <table style={tableStyle}>

                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>
                      Medicine
                    </th>
                    <th style={thStyle}>
                      Company
                    </th>
                    <th style={thStyle}>
                      Batch
                    </th>
                    <th style={thStyle}>
                      Barcode
                    </th>
                    <th style={thStyle}>
                      Qty
                    </th>
                    <th style={thStyle}>
                      Rate
                    </th>
                    <th style={thStyle}>
                      Amount
                    </th>
                    <th style={thStyle}>
                      Profit
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {selectedBillSales.map(
                    (sale, index) => {

                      const medicine =
                        getMedicine(sale);

                      const company =
                        getCompany(sale);

                      const batch =
                        getBatch(sale);

                      const barcode =
                        getBarcode(sale);

                      const quantity =
                        getSaleQuantity(sale);

                      const rate =
                        getSaleRate(sale);

                      const amount =
                        getSaleAmount(sale);

                      const profit =
                        getProfit(sale);

                      return (
                        <tr
                          key={
                            sale.id ||
                            `bill-${index}`
                          }
                        >

                          <td style={tdStyle}>
                            {index + 1}
                          </td>

                          <td style={tdStyle}>
                            <b>
                              {medicine ||
                                "-"}
                            </b>
                          </td>

                          <td style={tdStyle}>
                            {company || "-"}
                          </td>

                          <td style={tdStyle}>
                            {batch || "-"}
                          </td>

                          <td style={tdStyle}>
                            {barcode || "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                            }}
                          >
                            {formatQty(
                              quantity
                            )}
                          </td>

                          <td style={tdStyle}>
                            {money(rate)}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(amount)}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              color:
                                profit >= 0
                                  ? "#2e7d32"
                                  : "#d32f2f",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(profit)}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* BILL SUMMARY */}
            <div style={billSummaryStyle}>

              <div>
                <span>
                  Total Qty
                </span>

                <b>
                  {formatQty(
                    selectedBillQty
                  )}
                </b>
              </div>

              <div>
                <span>
                  Total Amount
                </span>

                <b>
                  {money(
                    selectedBillTotal
                  )}
                </b>
              </div>

              <div>
                <span>
                  Total Profit
                </span>

                <b
                  style={{
                    color: "#2e7d32",
                  }}
                >
                  {money(
                    selectedBillProfit
                  )}
                </b>
              </div>

            </div>

            <button
              type="button"
              onClick={closeBill}
              style={modalCloseButtonStyle}
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// SUMMARY
// =====================================================
function Summary({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: 14,
        borderRadius: 9,
        borderLeft:
          `4px solid ${color}`,
        boxShadow:
          "0 2px 7px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#666",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 20,
          fontWeight: "bold",
          color,
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
  padding: 12,
  background: "#f2f5f9",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#1565c0,#42a5f5)",
  color: "white",
  padding: 15,
  borderRadius: 10,
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const boxStyle = {
  background: "white",
  padding: 14,
  borderRadius: 10,
  marginBottom: 12,
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.06)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  border: "1px solid #ccc",
  borderRadius: 7,
  fontSize: 14,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(150px, 1fr))",
  gap: 10,
  marginBottom: 12,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f1f5f9",
  whiteSpace: "nowrap",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: 8,
  whiteSpace: "nowrap",
};

const backButton = {
  background: "white",
  color: "#1565c0",
  border: "none",
  padding: "9px 14px",
  borderRadius: 7,
  fontWeight: "bold",
  cursor: "pointer",
};

const billButtonStyle = {
  background: "#e3f2fd",
  color: "#1565c0",
  border: "1px solid #90caf9",
  padding: "6px 9px",
  borderRadius: 6,
  fontWeight: "bold",
  cursor: "pointer",
};

const emptyStyle = {
  padding: 25,
  textAlign: "center",
  color: "#777",
};

// =====================================================
// MODAL
// =====================================================

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background:
    "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 15,
  zIndex: 9999,
  boxSizing: "border-box",
};

const modalStyle = {
  background: "white",
  width: "100%",
  maxWidth: 1100,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: 12,
  boxShadow:
    "0 10px 40px rgba(0,0,0,0.25)",
  padding: 16,
  boxSizing: "border-box",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background:
    "linear-gradient(135deg,#1565c0,#42a5f5)",
  color: "white",
  padding: 14,
  borderRadius: 9,
  marginBottom: 12,
};

const closeButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "white",
  color: "#d32f2f",
  fontSize: 18,
  fontWeight: "bold",
  cursor: "pointer",
};

const customerBoxStyle = {
  background: "#f5f7fa",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: 8,
  fontSize: 13,
};

const billSummaryStyle = {
  marginTop: 14,
  padding: 14,
  background: "#f5f7fa",
  borderRadius: 8,
  display: "grid",
  gridTemplateColumns:
    "repeat(3,1fr)",
  gap: 10,
};

const modalCloseButtonStyle = {
  display: "block",
  margin: "14px auto 0",
  background: "#1565c0",
  color: "white",
  border: "none",
  padding: "10px 25px",
  borderRadius: 7,
  fontWeight: "bold",
  cursor: "pointer",
};

export default SaleHistory;