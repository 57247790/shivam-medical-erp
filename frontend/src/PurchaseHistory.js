import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

function PurchaseHistory({ goBack }) {
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] =
    useState("All");

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  const [purchases, setPurchases] = useState([]);

  // =====================================================
  // LOAD PURCHASE HISTORY
  // =====================================================

  const loadPurchases = useCallback(() => {
    try {
      const saved = localStorage.getItem(
        "purchaseHistory"
      );

      if (!saved) {
        setPurchases([]);
        return;
      }

      const data = JSON.parse(saved);

      if (Array.isArray(data)) {
        setPurchases(data);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error(
        "Purchase history load error:",
        error
      );

      setPurchases([]);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD + LIVE UPDATE
  // =====================================================

  useEffect(() => {
    loadPurchases();

    const handlePurchaseUpdated = () => {
      loadPurchases();
    };

    const handleStockUpdated = () => {
      loadPurchases();
    };

    const handleStorage = (event) => {
      if (
        event.key === "purchaseHistory" ||
        event.key === "stockUpdatedAt"
      ) {
        loadPurchases();
      }
    };

    window.addEventListener(
      "purchaseUpdated",
      handlePurchaseUpdated
    );

    window.addEventListener(
      "stockUpdated",
      handleStockUpdated
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "purchaseUpdated",
        handlePurchaseUpdated
      );

      window.removeEventListener(
        "stockUpdated",
        handleStockUpdated
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [loadPurchases]);

  // =====================================================
  // SUPPLIER LIST
  // =====================================================

  const suppliers = useMemo(() => {
    const names = purchases
      .map((item) =>
        String(
          item?.supplier ||
            item?.supplierName ||
            "Unknown"
        ).trim()
      )
      .filter(Boolean);

    return [
      "All",
      ...new Set(names),
    ];
  }, [purchases]);

  // =====================================================
  // GET PURCHASE AMOUNT
  // =====================================================

  const getPurchaseAmount = (purchase) => {
    if (!purchase) {
      return 0;
    }

    const savedAmount = Number(
      purchase.purchaseAmount
    );

    if (
      Number.isFinite(savedAmount) &&
      savedAmount !== 0
    ) {
      return savedAmount;
    }

    const quantity = Number(
      purchase.quantity || 0
    );

    const rate = Number(
      purchase.purchaseRateWithGST ??
        purchase.rate ??
        purchase.purchaseRate ??
        purchase.basePurchaseRate ??
        0
    );

    return quantity * rate;
  };

  // =====================================================
  // GET PURCHASE RATE
  // =====================================================

  const getPurchaseRate = (purchase) => {
    if (!purchase) {
      return 0;
    }

    // Final GST rate first
    if (
      purchase.purchaseRateWithGST !==
      undefined
    ) {
      const finalRate = Number(
        purchase.purchaseRateWithGST
      );

      if (Number.isFinite(finalRate)) {
        return finalRate;
      }
    }

    const rate = Number(
      purchase.rate ??
        purchase.purchaseRate ??
        purchase.basePurchaseRate ??
        0
    );

    return Number.isFinite(rate)
      ? rate
      : 0;
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredPurchases = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    return purchases.filter(
      (purchase) => {
        const medicine = String(
          purchase?.medicine || ""
        ).toLowerCase();

        const company = String(
          purchase?.company || ""
        ).toLowerCase();

        const supplier = String(
          purchase?.supplier ||
            purchase?.supplierName ||
            "Unknown"
        ).toLowerCase();

        const batch = String(
          purchase?.batch || ""
        ).toLowerCase();

        const barcode = String(
          purchase?.barcode || ""
        ).toLowerCase();

        const date = String(
          purchase?.date ||
            purchase?.purchaseDate ||
            ""
        ).toLowerCase();

        const matchesSearch =
          !text ||
          medicine.includes(text) ||
          company.includes(text) ||
          supplier.includes(text) ||
          batch.includes(text) ||
          barcode.includes(text) ||
          date.includes(text);

        const currentSupplier =
          String(
            purchase?.supplier ||
              purchase?.supplierName ||
              "Unknown"
          ).trim();

        const matchesSupplier =
          supplierFilter === "All" ||
          currentSupplier ===
            supplierFilter;

        return (
          matchesSearch &&
          matchesSupplier
        );
      }
    );
  }, [
    purchases,
    search,
    supplierFilter,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalPurchaseAmount =
    filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        getPurchaseAmount(purchase),
      0
    );

  const totalQuantity =
    filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        Number(
          purchase?.quantity || 0
        ),
      0
    );

  // =====================================================
  // TOTAL GST
  // =====================================================

  const totalGST =
    filteredPurchases.reduce(
      (sum, purchase) => {
        const qty =
          Number(
            purchase?.quantity || 0
          );

        const gstPerItem =
          Number(
            purchase?.gstAmountPerItem ||
              0
          );

        return (
          sum +
          qty * gstPerItem
        );
      },
      0
    );

  // =====================================================
  // DELETE PURCHASE
  // =====================================================

  const deletePurchase = (purchase) => {
    if (!purchase) {
      return;
    }

    const confirmDelete =
      window.confirm(
        "क्या आप यह Purchase History delete करना चाहते हैं?\n\nध्यान दें: इससे केवल History entry delete होगी। Stock वापस नहीं बदलेगा।"
      );

    if (!confirmDelete) {
      return;
    }

    const purchaseId =
      purchase.id;

    let updatedPurchases;

    if (purchaseId !== undefined) {
      let deleted = false;

      updatedPurchases =
        purchases.filter(
          (item) => {
            if (
              !deleted &&
              item?.id === purchaseId
            ) {
              deleted = true;
              return false;
            }

            return true;
          }
        );
    } else {
      const index =
        purchases.indexOf(
          purchase
        );

      if (index === -1) {
        return;
      }

      updatedPurchases = [
        ...purchases,
      ];

      updatedPurchases.splice(
        index,
        1
      );
    }

    localStorage.setItem(
      "purchaseHistory",
      JSON.stringify(
        updatedPurchases
      )
    );

    setPurchases(
      updatedPurchases
    );

    if (
      selectedPurchase ===
      purchase
    ) {
      setSelectedPurchase(null);
    }

    alert(
      "✅ Purchase History entry delete हो गई।"
    );
  };

  // =====================================================
  // CLEAR ALL HISTORY
  // =====================================================

  const clearHistory = () => {
    if (purchases.length === 0) {
      alert(
        "Purchase History पहले से खाली है।"
      );
      return;
    }

    const confirmClear =
      window.confirm(
        "⚠️ क्या आप पूरी Purchase History delete करना चाहते हैं?\n\nयह केवल History delete करेगा। Stock पर कोई असर नहीं पड़ेगा।\n\nयह action वापस नहीं किया जा सकता।"
      );

    if (!confirmClear) {
      return;
    }

    localStorage.removeItem(
      "purchaseHistory"
    );

    setPurchases([]);

    setSelectedPurchase(null);

    alert(
      "✅ पूरी Purchase History delete हो गई।"
    );
  };

  // =====================================================
  // MANUAL REFRESH
  // =====================================================

  const refreshHistory = () => {
    loadPurchases();

    alert(
      "🔄 Purchase History refresh हो गई।"
    );
  };

  // =====================================================
  // SELECTED PURCHASE DETAIL
  // =====================================================

  if (selectedPurchase) {
    const amount =
      getPurchaseAmount(
        selectedPurchase
      );

    const rate =
      getPurchaseRate(
        selectedPurchase
      );

    const baseRate = Number(
      selectedPurchase?.basePurchaseRate ??
        selectedPurchase?.purchaseRate ??
        selectedPurchase?.rate ??
        0
    );

    const quantity = Number(
      selectedPurchase?.quantity ||
        0
    );

    const gstPerItem = Number(
      selectedPurchase?.gstAmountPerItem ||
        0
    );

    const totalGSTAmount =
      quantity * gstPerItem;

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
        {/* HEADER */}

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto 20px",
          }}
        >
          <button
            onClick={() =>
              setSelectedPurchase(
                null
              )
            }
            style={backButtonStyle}
          >
            ⬅️ Purchase History
          </button>
        </div>

        {/* DETAIL CARD */}

        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background: "white",
            padding: "25px",
            borderRadius: "14px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
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
            <h1
              style={{
                margin: 0,
              }}
            >
              🧾 Purchase Details
            </h1>

            <button
              onClick={() =>
                deletePurchase(
                  selectedPurchase
                )
              }
              style={{
                padding:
                  "10px 15px",
                background:
                  "#d32f2f",
                color: "white",
                border: "none",
                borderRadius:
                  "7px",
                cursor: "pointer",
                fontWeight:
                  "bold",
              }}
            >
              🗑️ Delete History
            </button>
          </div>

          <hr />

          {/* DETAILS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "15px",
            }}
          >
            <InfoBox
              title="💊 Medicine"
              value={
                selectedPurchase
                  ?.medicine || "-"
              }
            />

            <InfoBox
              title="🏢 Company"
              value={
                selectedPurchase
                  ?.company || "-"
              }
            />

            <InfoBox
              title="🏭 Supplier"
              value={
                selectedPurchase
                  ?.supplier ||
                selectedPurchase
                  ?.supplierName ||
                "Unknown"
              }
            />

            <InfoBox
              title="📱 Supplier Mobile"
              value={
                selectedPurchase
                  ?.supplierMobile ||
                "-"
              }
            />

            <InfoBox
              title="🔢 Batch"
              value={
                selectedPurchase
                  ?.batch || "-"
              }
            />

            <InfoBox
              title="📷 Barcode"
              value={
                selectedPurchase
                  ?.barcode || "-"
              }
            />

            <InfoBox
              title="📦 Quantity"
              value={quantity}
            />

            <InfoBox
              title="💰 Base Purchase Rate"
              value={
                "₹" +
                baseRate.toFixed(2)
              }
            />

            <InfoBox
              title="🧾 GST"
              value={
                selectedPurchase
                  ?.gstType || "0"
              }
            />

            <InfoBox
              title="➕ GST / Adjustment Per Item"
              value={
                "₹" +
                gstPerItem.toFixed(2)
              }
            />

            <InfoBox
              title="💵 Final Purchase Rate"
              value={
                "₹" +
                rate.toFixed(2)
              }
            />

            <InfoBox
              title="💰 Purchase Amount"
              value={
                "₹" +
                amount.toFixed(2)
              }
            />

            <InfoBox
              title="🧾 Total GST Amount"
              value={
                "₹" +
                totalGSTAmount.toFixed(
                  2
                )
              }
            />

            <InfoBox
              title="💵 MRP"
              value={
                "₹" +
                Number(
                  selectedPurchase?.mrp ||
                    0
                ).toFixed(2)
              }
            />

            <InfoBox
              title="💸 Sale Rate"
              value={
                "₹" +
                Number(
                  selectedPurchase
                    ?.saleRate || 0
                ).toFixed(2)
              }
            />

            <InfoBox
              title="📅 Purchase Date"
              value={
                selectedPurchase
                  ?.purchaseDate ||
                selectedPurchase
                  ?.date ||
                "-"
              }
            />

            <InfoBox
              title="⏰ Purchase Time"
              value={
                selectedPurchase
                  ?.time || "-"
              }
            />

            <InfoBox
              title="📅 Expiry"
              value={
                selectedPurchase
                  ?.expiry || "-"
              }
            />

            <InfoBox
              title="📦 Stock Status"
              value={
                selectedPurchase
                  ?.stockMerged
                  ? "Quantity Merged"
                  : "New Stock Entry"
              }
            />
          </div>

          {/* TOTAL */}

          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#e8f5e9",
              borderRadius: "10px",
              textAlign: "center",
              border:
                "1px solid #a5d6a7",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#555",
                marginBottom:
                  "5px",
              }}
            >
              {quantity} × ₹
              {rate.toFixed(2)}
            </div>

            <h2
              style={{
                margin: 0,
                color: "#2e7d32",
              }}
            >
              Total Purchase: ₹
              {amount.toFixed(2)}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
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
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#6a1b9a,#ab47bc)",
          color: "white",
          padding: "25px",
          borderRadius: "14px",
          marginBottom: "20px",
          boxSizing: "border-box",
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
            <h1
              style={{
                margin: 0,
              }}
            >
              🧾 Purchase History
            </h1>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              सभी Purchase Entries की
              पूरी history
            </p>
          </div>

          <button
            onClick={refreshHistory}
            style={{
              padding:
                "10px 15px",
              background:
                "rgba(255,255,255,0.2)",
              color: "white",
              border:
                "1px solid rgba(255,255,255,0.5)",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* BACK BUTTON */}

      <button
        onClick={goBack}
        style={backButtonStyle}
      >
        ⬅️ Dashboard
      </button>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(200px,1fr))",
          gap: "15px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        {/* ENTRIES */}

        <div
          style={summaryCardStyle}
        >
          <b>🧾 Total Entries</b>

          <h2
            style={{
              marginBottom: 0,
              color: "#6a1b9a",
            }}
          >
            {filteredPurchases.length}
          </h2>
        </div>

        {/* QTY */}

        <div
          style={summaryCardStyle}
        >
          <b>📦 Total Quantity</b>

          <h2
            style={{
              marginBottom: 0,
              color: "#1976d2",
            }}
          >
            {totalQuantity}
          </h2>
        </div>

        {/* AMOUNT */}

        <div
          style={summaryCardStyle}
        >
          <b>💰 Total Purchase</b>

          <h2
            style={{
              marginBottom: 0,
              color: "#2e7d32",
            }}
          >
            ₹
            {totalPurchaseAmount.toFixed(
              2
            )}
          </h2>
        </div>

        {/* GST */}

        <div
          style={summaryCardStyle}
        >
          <b>🧾 Total GST / Adjustment</b>

          <h2
            style={{
              marginBottom: 0,
              color:
                totalGST >= 0
                  ? "#2e7d32"
                  : "#d32f2f",
            }}
          >
            ₹
            {totalGST.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* SEARCH */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Medicine / Supplier / Company / Batch / Barcode Search करें"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding: "13px",
            fontSize: "16px",
            border:
              "1px solid #ccc",
            borderRadius: "7px",
            marginBottom:
              "12px",
          }}
        />

        <select
          value={supplierFilter}
          onChange={(e) =>
            setSupplierFilter(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "13px",
            fontSize: "16px",
            border:
              "1px solid #ccc",
            borderRadius: "7px",
            boxSizing:
              "border-box",
          }}
        >
          {suppliers.map(
            (
              supplier,
              index
            ) => (
              <option
                key={index}
                value={supplier}
              >
                {supplier ===
                "All"
                  ? "🏭 सभी Supplier"
                  : supplier}
              </option>
            )
          )}
        </select>
      </div>

      {/* ACTION */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom:
            "20px",
        }}
      >
        <button
          onClick={refreshHistory}
          style={{
            padding:
              "11px 18px",
            background:
              "#1976d2",
            color: "white",
            border: "none",
            borderRadius:
              "7px",
            cursor:
              "pointer",
            fontWeight:
              "bold",
          }}
        >
          🔄 Refresh History
        </button>

        <button
          onClick={clearHistory}
          style={{
            padding:
              "11px 18px",
            background:
              "#d32f2f",
            color: "white",
            border: "none",
            borderRadius:
              "7px",
            cursor:
              "pointer",
            fontWeight:
              "bold",
          }}
        >
          🗑️ Clear Purchase History
        </button>
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          overflowX: "auto",
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
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
          <h2>
            📋 Purchase Entries
          </h2>

          <span
            style={{
              background:
                "#f3e5f5",
              color:
                "#6a1b9a",
              padding:
                "7px 12px",
              borderRadius:
                "20px",
              fontWeight:
                "bold",
            }}
          >
            {filteredPurchases.length} Entries
          </span>
        </div>

        {filteredPurchases.length ===
        0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize:
                  "50px",
                marginBottom:
                  "10px",
              }}
            >
              📭
            </div>

            <h3>
              कोई Purchase Record
              नहीं मिला।
            </h3>

            <p
              style={{
                color: "#666",
              }}
            >
              Purchase करने के बाद
              entries यहाँ दिखाई
              देंगी।
            </p>

            <button
              onClick={
                refreshHistory
              }
              style={{
                padding:
                  "10px 18px",
                background:
                  "#1976d2",
                color: "white",
                border: "none",
                borderRadius:
                  "7px",
                cursor:
                  "pointer",
              }}
            >
              🔄 अभी Refresh करें
            </button>
          </div>
        ) : (
          <table
            border="1"
            cellPadding="9"
            style={{
              borderCollapse:
                "collapse",
              width: "100%",
              minWidth:
                "1400px",
            }}
          >
            <thead
              style={{
                background:
                  "#f3e5f5",
              }}
            >
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Medicine</th>
                <th>Company</th>
                <th>Supplier</th>
                <th>Batch</th>
                <th>Barcode</th>
                <th>Qty</th>
                <th>Base Rate</th>
                <th>GST</th>
                <th>Final Rate</th>
                <th>Amount</th>
                <th>Sale Rate</th>
                <th>MRP</th>
                <th>Expiry</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.map(
                (
                  purchase,
                  index
                ) => {
                  const amount =
                    getPurchaseAmount(
                      purchase
                    );

                  const rate =
                    getPurchaseRate(
                      purchase
                    );

                  const baseRate =
                    Number(
                      purchase?.basePurchaseRate ??
                        purchase?.purchaseRate ??
                        purchase?.rate ??
                        0
                    );

                  const quantity =
                    Number(
                      purchase?.quantity ||
                        0
                    );

                  return (
                    <tr
                      key={
                        purchase?.id ||
                        `${purchase?.medicine}-${purchase?.batch}-${index}`
                      }
                    >
                      {/* NUMBER */}

                      <td>
                        {index + 1}
                      </td>

                      {/* DATE */}

                      <td>
                        {purchase?.date ||
                          purchase?.purchaseDate ||
                          "-"}

                        <br />

                        <small>
                          {purchase?.time ||
                            ""}
                        </small>
                      </td>

                      {/* MEDICINE */}

                      <td>
                        <b>
                          {purchase?.medicine ||
                            "-"}
                        </b>
                      </td>

                      {/* COMPANY */}

                      <td>
                        {purchase?.company ||
                          "-"}
                      </td>

                      {/* SUPPLIER */}

                      <td>
                        {purchase?.supplier ||
                          purchase?.supplierName ||
                          "Unknown"}
                      </td>

                      {/* BATCH */}

                      <td>
                        {purchase?.batch ||
                          "-"}
                      </td>

                      {/* BARCODE */}

                      <td>
                        {purchase?.barcode ||
                          "-"}
                      </td>

                      {/* QTY */}

                      <td>
                        {quantity}
                      </td>

                      {/* BASE RATE */}

                      <td>
                        ₹
                        {baseRate.toFixed(
                          2
                        )}
                      </td>

                      {/* GST */}

                      <td>
                        {purchase?.gstType ||
                          "0"}
                      </td>

                      {/* FINAL RATE */}

                      <td
                        style={{
                          fontWeight:
                            "bold",
                          color:
                            "#6a1b9a",
                        }}
                      >
                        ₹
                        {rate.toFixed(
                          2
                        )}
                      </td>

                      {/* AMOUNT */}

                      <td
                        style={{
                          fontWeight:
                            "bold",
                          color:
                            "#2e7d32",
                        }}
                      >
                        ₹
                        {amount.toFixed(
                          2
                        )}
                      </td>

                      {/* SALE RATE */}

                      <td>
                        ₹
                        {Number(
                          purchase?.saleRate ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* MRP */}

                      <td>
                        ₹
                        {Number(
                          purchase?.mrp ||
                            0
                        ).toFixed(2)}
                      </td>

                      {/* EXPIRY */}

                      <td>
                        {purchase?.expiry ||
                          "-"}
                      </td>

                      {/* STOCK STATUS */}

                      <td>
                        {purchase?.stockMerged ? (
                          <span
                            style={{
                              background:
                                "#fff3cd",
                              color:
                                "#856404",
                              padding:
                                "5px 8px",
                              borderRadius:
                                "5px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            Merged
                          </span>
                        ) : (
                          <span
                            style={{
                              background:
                                "#e8f5e9",
                              color:
                                "#2e7d32",
                              padding:
                                "5px 8px",
                              borderRadius:
                                "5px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            New
                          </span>
                        )}
                      </td>

                      {/* ACTION */}

                      <td>
                        <button
                          onClick={() =>
                            setSelectedPurchase(
                              purchase
                            )
                          }
                          style={{
                            padding:
                              "7px 10px",
                            background:
                              "#1976d2",
                            color:
                              "white",
                            border:
                              "none",
                            borderRadius:
                              "5px",
                            cursor:
                              "pointer",
                            marginRight:
                              "5px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          👁️ View
                        </button>

                        <button
                          onClick={() =>
                            deletePurchase(
                              purchase
                            )
                          }
                          style={{
                            padding:
                              "7px 10px",
                            background:
                              "#d32f2f",
                            color:
                              "white",
                            border:
                              "none",
                            borderRadius:
                              "5px",
                            cursor:
                              "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =====================================================
// INFO BOX
// =====================================================

function InfoBox({
  title,
  value,
}) {
  return (
    <div
      style={{
        padding: "16px",
        background: "#f5f5f5",
        borderRadius: "9px",
        border:
          "1px solid #e0e0e0",
        wordBreak:
          "break-word",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "17px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

const summaryCardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.07)",
  boxSizing: "border-box",
};

// =====================================================
// BACK BUTTON STYLE
// =====================================================

const backButtonStyle = {
  padding: "11px 20px",
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontSize: "15px",
};

export default PurchaseHistory;