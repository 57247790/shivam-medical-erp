import { useMemo, useState } from "react";

function Sale({ stock, setStock, goBack }) {
  const [medicine, setMedicine] = useState("");
  const [barcode, setBarcode] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [quantity, setQuantity] = useState("");

  // =====================================================
  // CURRENT STOCK
  // =====================================================

  const currentStock = useMemo(
    () => (Array.isArray(stock) ? stock : []),
    [stock]
  );

  // =====================================================
  // SAFE NUMBER
  // =====================================================

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  // =====================================================
  // NORMALIZE TEXT
  // =====================================================

  const normalizeText = (value) =>
    String(value || "").trim().toLowerCase();

  // =====================================================
  // NORMALIZE BARCODE
  // =====================================================

  const normalizeBarcode = (value) =>
    String(value || "").trim().toLowerCase();

  // =====================================================
  // GET ITEM ID
  // =====================================================

  const getItemId = (item, index) => {
    if (item?.id != null && String(item.id).trim() !== "") {
      return String(item.id);
    }

    return `stock-index-${index}`;
  };

  // =====================================================
  // FIND BY BARCODE
  //
  // Barcode OPTIONAL है।
  // =====================================================

  const findByBarcode = (value) => {
    const cleanBarcode = normalizeBarcode(value);

    if (!cleanBarcode) {
      return null;
    }

    return (
      currentStock.find(
        (item) =>
          normalizeBarcode(item?.barcode) === cleanBarcode
      ) || null
    );
  };

  // =====================================================
  // BARCODE ITEM INDEX
  // =====================================================

  const barcodeIndex = useMemo(() => {
    const cleanBarcode = normalizeBarcode(barcode);

    if (!cleanBarcode) {
      return -1;
    }

    return currentStock.findIndex(
      (item) =>
        normalizeBarcode(item?.barcode) === cleanBarcode
    );
  }, [barcode, currentStock]);

  // =====================================================
  // MEDICINE OPTIONS
  //
  // हर stock entry अलग option होगी ताकि same medicine
  // की अलग batch/rate वाली entries भी select हो सकें।
  // =====================================================

  const medicineStockOptions = useMemo(() => {
    return currentStock
      .map((item, index) => {
        const name = String(item?.medicine || "").trim();

        if (!name) {
          return null;
        }

        return {
          item,
          index,
          id: getItemId(item, index),
          medicine: name,
          batch: String(item?.batch || "").trim(),
          barcode: String(item?.barcode || "").trim(),
          quantity: toNumber(item?.quantity),
          saleRate: toNumber(item?.saleRate),
          mrp: toNumber(item?.mrp),
        };
      })
      .filter(Boolean);
  }, [currentStock]);

  // =====================================================
  // SELECTED INDEX
  //
  // Priority:
  // 1. Barcode
  // 2. Selected Stock ID
  // 3. Medicine name
  // =====================================================

  const selectedIndex = useMemo(() => {
    // ---------------------------------------------------
    // BARCODE FIRST
    // ---------------------------------------------------

    const cleanBarcode = normalizeBarcode(barcode);

    if (cleanBarcode) {
      return barcodeIndex;
    }

    // ---------------------------------------------------
    // SELECTED STOCK ID
    // ---------------------------------------------------

    if (selectedStockId) {
      const index = currentStock.findIndex(
        (item, index) =>
          getItemId(item, index) ===
          String(selectedStockId)
      );

      if (index !== -1) {
        return index;
      }
    }

    // ---------------------------------------------------
    // MEDICINE FALLBACK
    // ---------------------------------------------------

    const cleanMedicine = normalizeText(medicine);

    if (!cleanMedicine) {
      return -1;
    }

    return currentStock.findIndex(
      (item) =>
        normalizeText(item?.medicine) === cleanMedicine &&
        toNumber(item?.quantity) > 0
    );
  }, [
    barcode,
    barcodeIndex,
    selectedStockId,
    medicine,
    currentStock,
  ]);

  // =====================================================
  // SELECTED ITEM
  // =====================================================

  const selectedItem =
    selectedIndex >= 0
      ? currentStock[selectedIndex]
      : null;

  // =====================================================
  // RATES
  //
  // Sale Rate NEVER becomes MRP automatically.
  // =====================================================

  const purchaseRate = selectedItem
    ? toNumber(
        selectedItem.purchaseRate ??
          selectedItem.rate
      )
    : 0;

  const saleRate = selectedItem
    ? toNumber(selectedItem.saleRate)
    : 0;

  const mrp = selectedItem
    ? toNumber(selectedItem.mrp)
    : 0;

  // =====================================================
  // AVAILABLE STOCK
  // =====================================================

  const availableQty = selectedItem
    ? toNumber(selectedItem.quantity)
    : 0;

  // =====================================================
  // SALE QUANTITY
  // =====================================================

  const saleQty = toNumber(quantity);

  // =====================================================
  // TOTAL SALE
  // =====================================================

  const totalAmount =
    saleQty * saleRate;

  // =====================================================
  // PURCHASE COST
  // =====================================================

  const totalPurchaseCost =
    saleQty * purchaseRate;

  // =====================================================
  // PROFIT
  // =====================================================

  const profit =
    totalAmount - totalPurchaseCost;

  // =====================================================
  // BARCODE CHANGE
  //
  // Barcode optional है।
  // Empty करने पर medicine manually select कर सकते हैं।
  // =====================================================

  const handleBarcodeChange = (e) => {
    const value = e.target.value;

    setBarcode(value);

    const cleanBarcode =
      normalizeBarcode(value);

    // ---------------------------------------------------
    // BARCODE EMPTY
    // ---------------------------------------------------

    if (!cleanBarcode) {
      setSelectedStockId("");
      setMedicine("");
      return;
    }

    // ---------------------------------------------------
    // FIND BARCODE
    // ---------------------------------------------------

    const found =
      currentStock.find(
        (item) =>
          normalizeBarcode(item?.barcode) ===
          cleanBarcode
      );

    // ---------------------------------------------------
    // FOUND
    // ---------------------------------------------------

    if (found) {
      const index =
        currentStock.findIndex(
          (item) =>
            item === found
        );

      setMedicine(
        found.medicine || ""
      );

      setSelectedStockId(
        getItemId(found, index)
      );

      return;
    }

    // ---------------------------------------------------
    // NOT FOUND
    // ---------------------------------------------------

    setSelectedStockId("");
    setMedicine("");
  };

  // =====================================================
  // MEDICINE CHANGE
  //
  // Barcode खाली हो तो medicine selection से stock
  // entry choose होगी।
  // =====================================================

  const handleMedicineChange = (e) => {
    const value = e.target.value;

    setMedicine(value);

    // ---------------------------------------------------
    // EMPTY
    // ---------------------------------------------------

    if (!value) {
      setSelectedStockId("");
      return;
    }

    // ---------------------------------------------------
    // अगर medicine dropdown से exact stock ID आया है
    // ===================================================

    const foundOption =
      medicineStockOptions.find(
        (option) =>
          option.id === String(value)
      );

    if (foundOption) {
      const index =
        foundOption.index;

      setSelectedStockId(
        getItemId(
          foundOption.item,
          index
        )
      );

      // अगर उस item में barcode है तो barcode भी दिखाएँ।
      // लेकिन barcode optional है।
      setBarcode(
        foundOption.item?.barcode || ""
      );

      setMedicine(
        foundOption.item?.medicine || ""
      );

      return;
    }

    // ---------------------------------------------------
    // FALLBACK: NAME
    // ---------------------------------------------------

    const cleanName =
      normalizeText(value);

    const index =
      currentStock.findIndex(
        (item) =>
          normalizeText(item?.medicine) ===
            cleanName &&
          toNumber(item?.quantity) > 0
      );

    if (index !== -1) {
      const item =
        currentStock[index];

      setSelectedStockId(
        getItemId(item, index)
      );

      setBarcode(
        item?.barcode || ""
      );
    }
  };

  // =====================================================
  // DIRECT MEDICINE SELECT
  //
  // Dropdown option value stock ID है।
  // =====================================================

  const handleStockSelection = (e) => {
    const value = e.target.value;

    setSelectedStockId(value);

    if (!value) {
      setMedicine("");
      setBarcode("");
      return;
    }

    const index =
      currentStock.findIndex(
        (item, index) =>
          getItemId(item, index) ===
          String(value)
      );

    if (index === -1) {
      return;
    }

    const item =
      currentStock[index];

    setMedicine(
      item?.medicine || ""
    );

    setBarcode(
      item?.barcode || ""
    );
  };

  // =====================================================
  // SAVE SALE
  //
  // IMPORTANT:
  // Barcode REQUIRED नहीं है।
  // =====================================================

  const saveSale = () => {
    // ---------------------------------------------------
    // FIND EXACT STOCK ITEM
    // ---------------------------------------------------

    let index = -1;

    const cleanBarcode =
      normalizeBarcode(barcode);

    // ---------------------------------------------------
    // 1. BARCODE AVAILABLE
    // ---------------------------------------------------

    if (cleanBarcode) {
      index =
        currentStock.findIndex(
          (item) =>
            normalizeBarcode(item?.barcode) ===
            cleanBarcode
        );

      if (index === -1) {
        alert(
          "❌ यह Barcode Stock में नहीं मिला।\n\n" +
            "Barcode सही check करें या Barcode खाली करके Medicine select करें।"
        );

        return;
      }
    }

    // ---------------------------------------------------
    // 2. NO BARCODE
    // ---------------------------------------------------

    else {
      // पहले selected stock ID से find करें
      if (selectedStockId) {
        index =
          currentStock.findIndex(
            (item, itemIndex) =>
              getItemId(
                item,
                itemIndex
              ) ===
              String(selectedStockId)
          );
      }

      // -------------------------------------------------
      // Medicine name fallback
      // -------------------------------------------------

      if (index === -1) {
        const cleanMedicine =
          normalizeText(medicine);

        if (!cleanMedicine) {
          alert(
            "⚠️ Barcode नहीं है।\n\n" +
              "Medicine select करें।"
          );

          return;
        }

        index =
          currentStock.findIndex(
            (item) =>
              normalizeText(
                item?.medicine
              ) === cleanMedicine &&
              toNumber(
                item?.quantity
              ) > 0
          );
      }
    }

    // ---------------------------------------------------
    // STOCK NOT FOUND
    // ---------------------------------------------------

    if (index === -1) {
      alert(
        "❌ Stock Item नहीं मिला।\n\n" +
          "Barcode डालें या Medicine select करें।"
      );

      return;
    }

    // ---------------------------------------------------
    // EXACT ITEM
    // ---------------------------------------------------

    const item =
      currentStock[index];

    // ---------------------------------------------------
    // MEDICINE REQUIRED
    // ---------------------------------------------------

    if (
      !String(
        item?.medicine || ""
      ).trim()
    ) {
      alert(
        "❌ इस Stock Item में Medicine Name नहीं है।"
      );

      return;
    }

    // ---------------------------------------------------
    // QUANTITY REQUIRED
    // ---------------------------------------------------

    if (
      String(quantity || "").trim() === ""
    ) {
      alert(
        "⚠️ Quantity भरें।"
      );

      return;
    }

    const requestedQty =
      Number(quantity);

    if (
      !Number.isFinite(
        requestedQty
      ) ||
      requestedQty <= 0
    ) {
      alert(
        "⚠️ Sale Quantity सही डालें।"
      );

      return;
    }

    // ---------------------------------------------------
    // AVAILABLE STOCK
    // ---------------------------------------------------

    const stockQty =
      toNumber(item?.quantity);

    if (stockQty <= 0) {
      alert(
        "❌ Stock पहले से 0 है।\n\n" +
          "Medicine: " +
          (item?.medicine || "-") +
          "\n" +
          "Batch: " +
          (item?.batch || "-")
      );

      return;
    }

    // ---------------------------------------------------
    // STOCK CHECK
    // ---------------------------------------------------

    if (
      requestedQty >
      stockQty
    ) {
      alert(
        "❌ Insufficient Stock!\n\n" +
          "Medicine: " +
          (item?.medicine || "-") +
          "\n" +
          "Batch: " +
          (item?.batch || "-") +
          "\n" +
          "Available: " +
          stockQty +
          "\n" +
          "Sale: " +
          requestedQty
      );

      return;
    }

    // ---------------------------------------------------
    // FINAL RATES
    // ---------------------------------------------------

    const finalPurchaseRate =
      toNumber(
        item?.purchaseRate ??
          item?.rate
      );

    const finalSaleRate =
      toNumber(
        item?.saleRate
      );

    const finalMrp =
      toNumber(item?.mrp);

    // ---------------------------------------------------
    // SALE RATE REQUIRED
    // ---------------------------------------------------

    if (
      finalSaleRate <= 0
    ) {
      alert(
        "❌ Sale Rate उपलब्ध नहीं है।\n\n" +
          "MRP को Sale Rate नहीं माना जाएगा।\n\n" +
          "Purchase Entry में सही Sale Rate डालें।"
      );

      return;
    }

    // ---------------------------------------------------
    // SALE RATE vs MRP
    // ---------------------------------------------------

    if (
      finalMrp > 0 &&
      finalSaleRate >
        finalMrp
    ) {
      alert(
        "❌ Sale Rate, MRP से ज्यादा नहीं हो सकता।\n\n" +
          "Sale Rate: ₹" +
          finalSaleRate.toFixed(2) +
          "\n" +
          "MRP: ₹" +
          finalMrp.toFixed(2)
      );

      return;
    }

    // ---------------------------------------------------
    // REMAINING STOCK
    // ---------------------------------------------------

    const remainingQty =
      stockQty -
      requestedQty;

    const finalRemainingQty =
      Math.max(
        0,
        remainingQty
      );

    // ---------------------------------------------------
    // AMOUNTS
    // ---------------------------------------------------

    const saleAmount =
      requestedQty *
      finalSaleRate;

    const purchaseAmount =
      requestedQty *
      finalPurchaseRate;

    const finalProfit =
      saleAmount -
      purchaseAmount;

    // ---------------------------------------------------
    // DATE / TIME
    // ---------------------------------------------------

    const now =
      new Date();

    const saleDate =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

    const saleId =
      Date.now();

    // ---------------------------------------------------
    // UPDATE STOCK
    //
    // सिर्फ selected stock item की quantity कम होगी।
    // ---------------------------------------------------

    const newStock =
      currentStock.map(
        (
          stockItem,
          stockIndex
        ) => {
          if (
            stockIndex !== index
          ) {
            return stockItem;
          }

          return {
            ...stockItem,

            quantity:
              finalRemainingQty,

            purchaseRate:
              stockItem?.purchaseRate ??
              stockItem?.rate ??
              finalPurchaseRate,

            rate:
              stockItem?.rate ??
              stockItem?.purchaseRate ??
              finalPurchaseRate,

            saleRate:
              stockItem?.saleRate ??
              finalSaleRate,

            mrp:
              stockItem?.mrp ??
              finalMrp,
          };
        }
      );

    // ---------------------------------------------------
    // UPDATE REACT STOCK
    // ---------------------------------------------------

    setStock(newStock);

    // ---------------------------------------------------
    // UPDATE LOCAL STORAGE STOCK
    // ---------------------------------------------------

    localStorage.setItem(
      "stock",
      JSON.stringify(
        newStock
      )
    );

    // ---------------------------------------------------
    // READ SALES
    // ---------------------------------------------------

    let sales = [];

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "sales"
          ) || "[]"
        );

      sales =
        Array.isArray(saved)
          ? saved
          : [];
    } catch {
      sales = [];
    }

    // ---------------------------------------------------
    // SALE RECORD
    //
    // Barcode optional है।
    // ---------------------------------------------------

    const saleRecord = {
      id: saleId,

      medicine:
        item?.medicine || "",

      company:
        item?.company || "",

      batch:
        item?.batch || "",

      barcode:
        item?.barcode || "",

      supplier:
        item?.supplier || "",

      supplierMobile:
        item?.supplierMobile || "",

      quantity:
        requestedQty,

      purchaseRate:
        finalPurchaseRate,

      saleRate:
        finalSaleRate,

      mrp:
        finalMrp,

      purchaseAmount:
        purchaseAmount,

      saleAmount:
        saleAmount,

      profit:
        finalProfit,

      date:
        saleDate,

      time:
        now.toLocaleTimeString(),

      createdAt:
        saleId,
    };

    // ---------------------------------------------------
    // SAVE SALES
    // ---------------------------------------------------

    const updatedSales = [
      saleRecord,
      ...sales,
    ];

    localStorage.setItem(
      "sales",
      JSON.stringify(
        updatedSales
      )
    );

    // ---------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------

    alert(
      "✅ Sale Saved Successfully!\n\n" +
        "💊 Medicine: " +
        (item?.medicine || "-") +
        "\n" +
        "🏢 Company: " +
        (item?.company || "-") +
        "\n" +
        "📦 Batch: " +
        (item?.batch || "-") +
        "\n" +
        "📷 Barcode: " +
        (item?.barcode || "Not Entered") +
        "\n\n" +
        "🔢 Sale Quantity: " +
        requestedQty +
        "\n" +
        "📦 Previous Stock: " +
        stockQty +
        "\n" +
        "📦 Remaining Stock: " +
        finalRemainingQty +
        "\n\n" +
        "🛒 Purchase Rate: ₹" +
        finalPurchaseRate.toFixed(2) +
        "\n" +
        "💰 Sale Rate: ₹" +
        finalSaleRate.toFixed(2) +
        "\n" +
        "🏷️ MRP: ₹" +
        finalMrp.toFixed(2) +
        "\n" +
        "💵 Sale Amount: ₹" +
        saleAmount.toFixed(2) +
        "\n" +
        "📈 Profit: ₹" +
        finalProfit.toFixed(2)
    );

    // ---------------------------------------------------
    // CLEAR
    // ---------------------------------------------------

    setMedicine("");
    setBarcode("");
    setSelectedStockId("");
    setQuantity("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily:
          "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#2e7d32,#66bb6a)",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            margin: 0,
          }}
        >
          💰 Sale Entry
        </h1>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          Barcode या Medicine से Sale
        </p>
      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          maxWidth: "700px",
          margin: "auto",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          📷 Barcode / Medicine Sale
        </h2>

        {/* =================================================
            BARCODE
        ================================================= */}

        <label style={labelStyle}>
          Barcode
          <span
            style={{
              color: "#2e7d32",
              marginLeft: "6px",
            }}
          >
            (Optional)
          </span>
        </label>

        <input
          autoFocus
          placeholder="Barcode Scan / Enter Barcode (Optional)"
          value={barcode}
          onChange={
            handleBarcodeChange
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              e.preventDefault();

              const found =
                findByBarcode(
                  barcode
                );

              if (!barcode.trim()) {
                return;
              }

              if (!found) {
                alert(
                  "❌ Barcode Stock में नहीं मिला।\n\n" +
                    "Barcode खाली करके Medicine select कर सकते हैं।"
                );

                return;
              }

              const index =
                currentStock.findIndex(
                  (item) =>
                    item === found
                );

              setMedicine(
                found.medicine || ""
              );

              setSelectedStockId(
                getItemId(
                  found,
                  index
                )
              );
            }
          }}
          style={{
            ...inputStyle,
            border:
              "2px solid #1976d2",
            fontSize: "18px",
          }}
        />

        {/* BARCODE INFORMATION */}

        <div
          style={{
            background:
              "#e3f2fd",
            border:
              "1px solid #90caf9",
            color:
              "#1565c0",
            padding: "11px",
            borderRadius: "8px",
            marginTop: "-8px",
            marginBottom: "15px",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          📷 Barcode <b>Optional</b> है।
          <br />
          ✅ Barcode डालेंगे तो exact
          stock entry मिलेगी।
          <br />
          ✅ Barcode नहीं डालेंगे तो नीचे
          Medicine select करके Sale कर सकते हैं।
        </div>

        {/* BARCODE NOT FOUND */}

        {barcode.trim() &&
          !selectedItem && (
            <div
              style={{
                background:
                  "#ffebee",
                border:
                  "1px solid #ef9a9a",
                color:
                  "#c62828",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontWeight:
                  "bold",
                fontSize: "13px",
              }}
            >
              ❌ Barcode Stock में नहीं मिला।
              <br />
              Barcode हटाकर Medicine select करें।
            </div>
          )}

        {/* BARCODE FOUND */}

        {selectedItem && (
          <div
            style={{
              background:
                "#e8f5e9",
              border:
                "1px solid #81c784",
              color:
                "#2e7d32",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontWeight:
                "bold",
              fontSize: "13px",
            }}
          >
            ✅ Stock Item Selected
            <br />
            Medicine:{" "}
            {selectedItem?.medicine ||
              "-"}
            <br />
            Batch:{" "}
            {selectedItem?.batch ||
              "-"}
            <br />
            Barcode:{" "}
            {selectedItem?.barcode ||
              "Not Available"}
            <br />
            Available Stock:{" "}
            {availableQty}
          </div>
        )}

        {/* =================================================
            MEDICINE / STOCK SELECTION
        ================================================= */}

        <label style={labelStyle}>
          Medicine / Stock
        </label>

        <select
          value={
            selectedStockId
          }
          onChange={
            handleStockSelection
          }
          style={{
            ...inputStyle,
            cursor: "pointer",
          }}
        >
          <option value="">
            Select Medicine / Batch
          </option>

          {medicineStockOptions.map(
            (option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.medicine}
                {" | Batch: "}
                {option.batch ||
                  "-"}
                {" | Stock: "}
                {option.quantity}
                {" | Sale ₹"}
                {option.saleRate.toFixed(
                  2
                )}
                {option.barcode
                  ? ` | Barcode: ${option.barcode}`
                  : " | No Barcode"}
              </option>
            )
          )}
        </select>

        {/* =================================================
            SIMPLE MEDICINE NAME
        ================================================= */}

        <label style={labelStyle}>
          Medicine Name
        </label>

        <input
          type="text"
          placeholder="Medicine Name"
          value={medicine}
          onChange={(e) => {
            const value =
              e.target.value;

            setMedicine(value);

            // अगर barcode खाली है तो matching
            // medicine की first available entry चुनें।
            if (
              !barcode.trim()
            ) {
              const cleanName =
                normalizeText(
                  value
                );

              if (!cleanName) {
                setSelectedStockId(
                  ""
                );
                return;
              }

              const index =
                currentStock.findIndex(
                  (item) =>
                    normalizeText(
                      item?.medicine
                    ) === cleanName &&
                    toNumber(
                      item?.quantity
                    ) > 0
                );

              if (index !== -1) {
                setSelectedStockId(
                  getItemId(
                    currentStock[index],
                    index
                  )
                );
              }
            }
          }}
          style={inputStyle}
        />

        {/* =================================================
            DETAILS
        ================================================= */}

        {selectedItem && (
          <div
            style={{
              background:
                "#f5f5f5",
              border:
                "1px solid #ddd",
              padding: "15px",
              borderRadius: "8px",
              marginBottom:
                "20px",
            }}
          >
            <p>
              💊 Medicine:{" "}
              <b>
                {selectedItem?.medicine ||
                  "-"}
              </b>
            </p>

            <p>
              📷 Barcode:{" "}
              <b>
                {selectedItem?.barcode ||
                  "Not Available"}
              </b>
            </p>

            <p>
              🏢 Company:{" "}
              <b>
                {selectedItem?.company ||
                  "-"}
              </b>
            </p>

            <p>
              📦 Batch:{" "}
              <b>
                {selectedItem?.batch ||
                  "-"}
              </b>
            </p>

            <p>
              📅 Expiry:{" "}
              <b>
                {selectedItem?.expiry ||
                  "-"}
              </b>
            </p>

            <p>
              📦 Available Stock:{" "}
              <b
                style={{
                  color:
                    availableQty <= 0
                      ? "#d32f2f"
                      : "#2e7d32",
                  fontSize:
                    "18px",
                }}
              >
                {availableQty}
              </b>
            </p>

            <p>
              🛒 Purchase Rate:{" "}
              <b>
                ₹
                {purchaseRate.toFixed(
                  2
                )}
              </b>
            </p>

            <p>
              💰 Sale Rate:{" "}
              <b>
                ₹
                {saleRate.toFixed(
                  2
                )}
              </b>
            </p>

            <p>
              🏷️ MRP:{" "}
              <b>
                ₹
                {mrp.toFixed(2)}
              </b>
            </p>

            {saleRate <= 0 && (
              <div
                style={{
                  padding:
                    "10px",
                  background:
                    "#fff3e0",
                  color:
                    "#e65100",
                  borderRadius:
                    "6px",
                  fontWeight:
                    "bold",
                }}
              >
                ⚠️ Sale Rate नहीं है।
                Purchase Entry में Sale
                Rate डालें।
              </div>
            )}
          </div>
        )}

        {/* =================================================
            QUANTITY
        ================================================= */}

        <label
          style={labelStyle}
        >
          Quantity
        </label>

        <input
          type="number"
          min="1"
          step="1"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          style={inputStyle}
        />

        {/* =================================================
            CALCULATION
        ================================================= */}

        {selectedItem &&
          saleQty > 0 && (
            <div
              style={{
                border:
                  "2px solid #ddd",
                padding: "15px",
                borderRadius:
                  "8px",
                marginTop:
                  "15px",
              }}
            >
              <h3>
                💵 Sale Amount: ₹
                {totalAmount.toFixed(
                  2
                )}
              </h3>

              <p>
                🛒 Purchase Cost: ₹
                {totalPurchaseCost.toFixed(
                  2
                )}
              </p>

              <h3
                style={{
                  color:
                    profit >= 0
                      ? "#2e7d32"
                      : "#d32f2f",
                }}
              >
                📈 Profit: ₹
                {profit.toFixed(
                  2
                )}
              </h3>

              <p
                style={{
                  fontWeight:
                    "bold",
                  color:
                    "#1565c0",
                }}
              >
                📦 Sale के बाद Stock:{" "}
                {Math.max(
                  0,
                  availableQty -
                    saleQty
                )}
              </p>
            </div>
          )}

        {/* =================================================
            SAVE
        ================================================= */}

        <button
          type="button"
          onClick={saveSale}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            fontSize: "17px",
            fontWeight: "bold",
            background:
              "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          💾 Save Sale
        </button>

        {/* =================================================
            BACK
        ================================================= */}

        <button
          type="button"
          onClick={goBack}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "13px",
            background:
              "#555",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ⬅️ Back
        </button>
      </div>
    </div>
  );
}

// =====================================================
// INPUT STYLE
// =====================================================

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginTop: "10px",
  marginBottom: "15px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  background: "white",
};

// =====================================================
// LABEL STYLE
// =====================================================

const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "#555",
  marginBottom: "5px",
  fontWeight: "bold",
};

export default Sale;