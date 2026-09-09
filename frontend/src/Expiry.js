import React, { useEffect, useMemo, useState } from "react";

function Expiry({
  stock,
  goBack,
  initialFilter = "all",
}) {
  // =====================================================
  // STATE
  // =====================================================

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  // Supplier purchase detail popup
  const [selectedSupplierItem, setSelectedSupplierItem] =
    useState(null);

  // =====================================================
  // TODAY
  // =====================================================

  const getToday = () => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  };

  // =====================================================
  // SAFE STOCK
  // =====================================================

  const allStock = useMemo(() => {
    return Array.isArray(stock) ? stock : [];
  }, [stock]);

  // =====================================================
  // SAFE NUMBER
  // =====================================================

  const getNumber = (value) => {
    const num = Number(value);

    return Number.isFinite(num) ? num : 0;
  };

  // =====================================================
  // SUPPLIER NAME
  // =====================================================

  const getSupplierName = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.supplier ||
      item.supplierName ||
      item.supplier_name ||
      item.vendor ||
      item.vendorName ||
      ""
    );
  };

  // =====================================================
  // SUPPLIER MOBILE
  // =====================================================

  const getSupplierMobile = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.supplierMobile ||
      item.supplier_mobile ||
      item.supplierPhone ||
      item.supplier_phone ||
      item.vendorMobile ||
      item.vendorPhone ||
      ""
    );
  };

  // =====================================================
  // PURCHASE DATE
  //
  // अलग-अलग पुराने/new stock fields support
  // =====================================================

  const getPurchaseDate = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.purchaseDate ||
      item.purchase_date ||
      item.purchasedDate ||
      item.purchased_date ||
      item.purchaseEntryDate ||
      item.purchase_entry_date ||
      item.entryDate ||
      item.entry_date ||
      item.date ||
      item.createdAt ||
      item.created_at ||
      ""
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "Purchase Date उपलब्ध नहीं है";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =====================================================
  // PURCHASE TIME
  // =====================================================

  const getPurchaseTime = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.purchaseTime ||
      item.purchase_time ||
      item.entryTime ||
      item.entry_time ||
      ""
    );
  };

  // =====================================================
  // PURCHASE INVOICE
  // =====================================================

  const getPurchaseInvoice = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.invoiceNo ||
      item.invoiceNumber ||
      item.invoice_no ||
      item.billNo ||
      item.billNumber ||
      item.purchaseBillNo ||
      item.purchase_bill_no ||
      ""
    );
  };

  // =====================================================
  // PURCHASE ID
  // =====================================================

  const getPurchaseId = (item) => {
    if (!item) {
      return "";
    }

    return (
      item.purchaseId ||
      item.purchase_id ||
      item.purchaseEntryId ||
      item.purchase_entry_id ||
      ""
    );
  };

  // =====================================================
  // PURCHASE RATE
  // =====================================================

  const getPurchaseRate = (item) => {
    if (!item) {
      return 0;
    }

    return getNumber(
      item.purchaseRate ??
        item.purchase_rate ??
        item.rate ??
        0
    );
  };

  // =====================================================
  // SALE RATE
  // =====================================================

  const getSaleRate = (item) => {
    if (!item) {
      return 0;
    }

    return getNumber(
      item.saleRate ??
        item.sale_rate ??
        0
    );
  };

  // =====================================================
  // MRP
  // =====================================================

  const getMRP = (item) => {
    if (!item) {
      return 0;
    }

    return getNumber(
      item.mrp ??
        item.MRP ??
        0
    );
  };

  // =====================================================
  // EXPIRY STATUS
  // =====================================================

  const getExpiryStatus = (expiry) => {
    if (!expiry) {
      return {
        type: "unknown",
        text: "⚪ Expiry Date नहीं है",
        days: null,
      };
    }

    const expiryDate = new Date(expiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return {
        type: "unknown",
        text: "⚪ Invalid Expiry Date",
        days: null,
      };
    }

    expiryDate.setHours(0, 0, 0, 0);

    const today = getToday();

    const difference =
      expiryDate.getTime() -
      today.getTime();

    const daysLeft = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    // ===================================================
    // EXPIRED
    // ===================================================

    if (daysLeft < 0) {
      return {
        type: "expired",
        text:
          "🔴 Expired " +
          Math.abs(daysLeft) +
          " दिन पहले",
        days: daysLeft,
      };
    }

    // ===================================================
    // TODAY
    // ===================================================

    if (daysLeft === 0) {
      return {
        type: "warning",
        text: "🟡 आज Expiry है",
        days: 0,
      };
    }

    // ===================================================
    // NEAR EXPIRY
    // ===================================================

    if (daysLeft <= 30) {
      return {
        type: "warning",
        text:
          "🟡 Expiry in " +
          daysLeft +
          " दिन",
        days: daysLeft,
      };
    }

    // ===================================================
    // NORMAL
    // ===================================================

    return {
      type: "normal",
      text:
        "🟢 " +
        daysLeft +
        " दिन बाकी",
      days: daysLeft,
    };
  };

  // =====================================================
  // COUNTS
  // =====================================================

  const expiredCount = useMemo(() => {
    return allStock.filter((item) => {
      return (
        getExpiryStatus(
          item?.expiry ||
            item?.expiryDate ||
            item?.expiry_date
        ).type === "expired"
      );
    }).length;
  }, [allStock]);

  const warningCount = useMemo(() => {
    return allStock.filter((item) => {
      return (
        getExpiryStatus(
          item?.expiry ||
            item?.expiryDate ||
            item?.expiry_date
        ).type === "warning"
      );
    }).length;
  }, [allStock]);

  const normalCount = useMemo(() => {
    return allStock.filter((item) => {
      return (
        getExpiryStatus(
          item?.expiry ||
            item?.expiryDate ||
            item?.expiry_date
        ).type === "normal"
      );
    }).length;
  }, [allStock]);

  const unknownCount = useMemo(() => {
    return allStock.filter((item) => {
      return (
        getExpiryStatus(
          item?.expiry ||
            item?.expiryDate ||
            item?.expiry_date
        ).type === "unknown"
      );
    }).length;
  }, [allStock]);

  // =====================================================
  // FILTER + SEARCH
  // =====================================================

  const filteredStock = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    const result = allStock.filter((item) => {
      const status = getExpiryStatus(
        item?.expiry ||
          item?.expiryDate ||
          item?.expiry_date
      );

      // -------------------------------------------------
      // STATUS FILTER
      // -------------------------------------------------

      if (
        filter !== "all" &&
        status.type !== filter
      ) {
        return false;
      }

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      if (!searchText) {
        return true;
      }

      const medicine = String(
        item?.medicine || ""
      ).toLowerCase();

      const company = String(
        item?.company || ""
      ).toLowerCase();

      const batch = String(
        item?.batch || ""
      ).toLowerCase();

      const barcode = String(
        item?.barcode || ""
      ).toLowerCase();

      const supplier = String(
        getSupplierName(item)
      ).toLowerCase();

      const supplierMobile = String(
        getSupplierMobile(item)
      ).toLowerCase();

      return (
        medicine.includes(searchText) ||
        company.includes(searchText) ||
        batch.includes(searchText) ||
        barcode.includes(searchText) ||
        supplier.includes(searchText) ||
        supplierMobile.includes(searchText)
      );
    });

    // ---------------------------------------------------
    // SORT
    //
    // Expired first
    // Then nearest expiry
    // Then normal
    // ---------------------------------------------------

    return result.sort((a, b) => {
      const statusA = getExpiryStatus(
        a?.expiry ||
          a?.expiryDate ||
          a?.expiry_date
      );

      const statusB = getExpiryStatus(
        b?.expiry ||
          b?.expiryDate ||
          b?.expiry_date
      );

      // Unknown नीचे
      if (
        statusA.type === "unknown" &&
        statusB.type !== "unknown"
      ) {
        return 1;
      }

      if (
        statusA.type !== "unknown" &&
        statusB.type === "unknown"
      ) {
        return -1;
      }

      if (
        statusA.days !== null &&
        statusB.days !== null
      ) {
        return (
          statusA.days -
          statusB.days
        );
      }

      return 0;
    });
  }, [
    allStock,
    filter,
    search,
  ]);

  // =====================================================
  // FILTER BUTTON
  // =====================================================

  const FilterButton = ({
    value,
    icon,
    title,
    count,
    color,
    background,
  }) => {
    const active =
      filter === value;

    return (
      <button
        type="button"
        onClick={() =>
          setFilter(value)
        }
        style={{
          position: "relative",
          border: active
            ? `2px solid ${color}`
            : "1px solid #ddd",
          background: active
            ? background
            : "white",
          color: active
            ? color
            : "#444",
          borderRadius: 10,
          padding:
            "12px 16px",
          cursor: "pointer",
          fontWeight: "bold",
          minWidth: 145,
          transition:
            "all 0.15s ease",
          boxShadow: active
            ? `0 3px 10px ${color}33`
            : "0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            fontSize: 19,
            marginRight: 5,
          }}
        >
          {icon}
        </span>

        {title}

        <span
          style={{
            marginLeft: 8,
            background: active
              ? color
              : "#eef1f5",
            color: active
              ? "white"
              : "#555",
            borderRadius: 20,
            padding:
              "3px 8px",
            fontSize: 12,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  // =====================================================
  // KEYBOARD
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag =
        event.target?.tagName?.toLowerCase();

      const typing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        event.target?.isContentEditable;

      // Popup open हो तो Escape पहले popup बंद करेगा
      if (
        event.key === "Escape" &&
        selectedSupplierItem
      ) {
        event.preventDefault();

        setSelectedSupplierItem(null);

        return;
      }

      if (
        event.key === "Escape" &&
        !typing
      ) {
        event.preventDefault();

        if (goBack) {
          goBack();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    goBack,
    selectedSupplierItem,
  ]);

  // =====================================================
  // FILTER TITLE
  // =====================================================

  const getFilterTitle = () => {
    switch (filter) {
      case "expired":
        return "🔴 Expired Medicines";

      case "warning":
        return "🟡 Near Expiry Medicines";

      case "normal":
        return "🟢 Normal Medicines";

      case "unknown":
        return "⚪ Unknown Expiry";

      default:
        return "📋 All Medicines";
    }
  };

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    setSearch("");
  };

  // =====================================================
  // OPEN SUPPLIER PURCHASE DETAIL
  // =====================================================

  const openSupplierPurchase = (item) => {
    if (!item) {
      return;
    }

    setSelectedSupplierItem(item);
  };

  // =====================================================
  // CLOSE SUPPLIER DETAIL
  // =====================================================

  const closeSupplierPurchase = () => {
    setSelectedSupplierItem(null);
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f2f5f9",
        padding:
          "18px",
        fontFamily:
          "Arial, sans-serif",
        boxSizing:
          "border-box",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1565c0,#42a5f5)",
          color: "white",
          borderRadius: 12,
          padding:
            "16px 20px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 15,
          flexWrap:
            "wrap",
          marginBottom: 16,
          boxShadow:
            "0 4px 14px rgba(21,101,192,0.18)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            📅 Expiry Management
          </h1>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            Shivam Medical ERP
          </div>
        </div>

        <button
          type="button"
          onClick={goBack}
          style={{
            background:
              "white",
            color:
              "#1565c0",
            border:
              "none",
            padding:
              "10px 16px",
            borderRadius: 8,
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          ⬅️ Dashboard
        </button>
      </div>

      {/* =================================================
          SUMMARY FILTERS
      ================================================= */}

      <div
        style={{
          background:
            "white",
          borderRadius: 12,
          padding: 15,
          marginBottom: 15,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 12,
            fontSize: 18,
          }}
        >
          🔎 Expiry Filter
        </h2>

        <div
          style={{
            display:
              "flex",
            gap: 10,
            flexWrap:
              "wrap",
          }}
        >
          <FilterButton
            value="all"
            icon="📋"
            title="All"
            count={
              allStock.length
            }
            color="#1565c0"
            background="#eaf3ff"
          />

          <FilterButton
            value="expired"
            icon="🔴"
            title="Expired"
            count={
              expiredCount
            }
            color="#d32f2f"
            background="#ffebee"
          />

          <FilterButton
            value="warning"
            icon="🟡"
            title="Near Expiry"
            count={
              warningCount
            }
            color="#ef6c00"
            background="#fff3e0"
          />

          <FilterButton
            value="normal"
            icon="🟢"
            title="Normal"
            count={
              normalCount
            }
            color="#2e7d32"
            background="#e8f5e9"
          />

          <FilterButton
            value="unknown"
            icon="⚪"
            title="Unknown"
            count={
              unknownCount
            }
            color="#607d8b"
            background="#eceff1"
          />
        </div>
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div
        style={{
          background:
            "white",
          borderRadius: 12,
          padding: 15,
          marginBottom: 15,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display:
              "flex",
            gap: 10,
            alignItems:
              "center",
            flexWrap:
              "wrap",
          }}
        >
          <div
            style={{
              position:
                "relative",
              flex:
                "1 1 350px",
              maxWidth:
                700,
            }}
          >
            <input
              type="text"
              placeholder="🔍 Medicine / Company / Batch / Barcode / Supplier"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                padding:
                  "12px 42px 12px 13px",
                border:
                  "1px solid #ccc",
                borderRadius: 8,
                fontSize: 14,
                outline:
                  "none",
                boxSizing:
                  "border-box",
              }}
            />

            {search && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                style={{
                  position:
                    "absolute",
                  right: 8,
                  top: 7,
                  border:
                    "none",
                  background:
                    "#eee",
                  width: 28,
                  height: 28,
                  borderRadius:
                    "50%",
                  cursor:
                    "pointer",
                  fontWeight:
                    "bold",
                }}
              >
                ×
              </button>
            )}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#555",
              fontWeight:
                "bold",
            }}
          >
            {getFilterTitle()}
          </div>
        </div>
      </div>

      {/* =================================================
          RESULT SUMMARY
      ================================================= */}

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
          gap: 10,
          background:
            "white",
          borderRadius: 10,
          padding:
            "11px 15px",
          marginBottom: 10,
          boxShadow:
            "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <b>
          📦 {getFilterTitle()}
        </b>

        <span
          style={{
            color: "#666",
            fontSize: 13,
          }}
        >
          {filteredStock.length} Medicine
          {filteredStock.length !== 1
            ? "s"
            : ""} मिली
        </span>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      {filteredStock.length === 0 ? (
        <div
          style={{
            background:
              "white",
            borderRadius: 12,
            padding: 40,
            textAlign:
              "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 45,
              marginBottom: 10,
            }}
          >
            📭
          </div>

          <h3
            style={{
              margin: 0,
              color: "#555",
            }}
          >
            कोई Medicine नहीं मिली
          </h3>

          <p
            style={{
              color: "#888",
              marginBottom: 0,
            }}
          >
            Search या दूसरा filter try करें।
          </p>
        </div>
      ) : (
        <div
          style={{
            background:
              "white",
            borderRadius: 12,
            padding: 10,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
            overflowX:
              "auto",
          }}
        >
          <table
            style={{
              borderCollapse:
                "collapse",
              width:
                "100%",
              minWidth:
                1150,
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#1565c0",
                  color:
                    "white",
                }}
              >
                <th
                  style={thStyle}
                >
                  #
                </th>

                <th
                  style={thStyle}
                >
                  Medicine
                </th>

                <th
                  style={thStyle}
                >
                  Company
                </th>

                <th
                  style={thStyle}
                >
                  Batch
                </th>

                <th
                  style={thStyle}
                >
                  Barcode
                </th>

                <th
                  style={thStyle}
                >
                  Stock
                </th>

                {/* NEW SUPPLIER */}
                <th
                  style={thStyle}
                >
                  Supplier
                </th>

                <th
                  style={thStyle}
                >
                  Expiry Date
                </th>

                <th
                  style={thStyle}
                >
                  Status
                </th>

                <th
                  style={thStyle}
                >
                  Purchase
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStock.map(
                (
                  item,
                  index
                ) => {
                  const status =
                    getExpiryStatus(
                      item?.expiry ||
                        item?.expiryDate ||
                        item?.expiry_date
                    );

                  const supplier =
                    getSupplierName(item);

                  const supplierMobile =
                    getSupplierMobile(item);

                  const purchaseDate =
                    getPurchaseDate(item);

                  let background =
                    "#ffffff";

                  if (
                    status.type ===
                    "expired"
                  ) {
                    background =
                      "#ffebee";
                  }

                  if (
                    status.type ===
                    "warning"
                  ) {
                    background =
                      "#fff8e1";
                  }

                  if (
                    status.type ===
                    "normal"
                  ) {
                    background =
                      "#f7fff8";
                  }

                  if (
                    status.type ===
                    "unknown"
                  ) {
                    background =
                      "#f5f5f5";
                  }

                  return (
                    <tr
                      key={
                        item?.id ||
                        `${item?.barcode}-${item?.batch}-${index}`
                      }
                      style={{
                        background,
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {/* # */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {index + 1}
                      </td>

                      {/* MEDICINE */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                        }}
                      >
                        {item?.medicine ||
                          "-"}
                      </td>

                      {/* COMPANY */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {item?.company ||
                          "-"}
                      </td>

                      {/* BATCH */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {item?.batch ||
                          "-"}
                      </td>

                      {/* BARCODE */}

                      <td
                        style={{
                          ...tdStyle,
                          fontFamily:
                            "monospace",
                        }}
                      >
                        {item?.barcode ||
                          "-"}
                      </td>

                      {/* STOCK */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            Number(
                              item?.quantity ||
                                0
                            ) <= 0
                              ? "#d32f2f"
                              : "#1565c0",
                        }}
                      >
                        {item?.quantity ??
                          0}
                      </td>

                      {/* =================================================
                          SUPPLIER
                          CLICKABLE
                      ================================================= */}

                      <td
                        style={{
                          ...tdStyle,
                          minWidth: 170,
                        }}
                      >
                        {supplier ? (
                          <button
                            type="button"
                            onClick={() =>
                              openSupplierPurchase(
                                item
                              )
                            }
                            title="Supplier purchase details देखने के लिए क्लिक करें"
                            style={{
                              border:
                                "none",
                              background:
                                "transparent",
                              padding: 0,
                              margin: 0,
                              cursor:
                                "pointer",
                              textAlign:
                                "left",
                              color:
                                "#1565c0",
                              fontWeight:
                                "bold",
                              textDecoration:
                                "underline",
                              fontSize: 13,
                            }}
                          >
                            🏢 {supplier}
                          </button>
                        ) : (
                          <span
                            style={{
                              color:
                                "#999",
                            }}
                          >
                            Supplier नहीं है
                          </span>
                        )}

                        {supplierMobile && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color:
                                "#666",
                            }}
                          >
                            📱{" "}
                            {supplierMobile}
                          </div>
                        )}

                        {supplier && (
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              color:
                                "#888",
                            }}
                          >
                            👆 Click for purchase
                          </div>
                        )}
                      </td>

                      {/* EXPIRY DATE */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {item?.expiry ||
                          item?.expiryDate ||
                          item?.expiry_date ||
                          "-"}
                      </td>

                      {/* STATUS */}

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            status.type ===
                            "expired"
                              ? "#d32f2f"
                              : status.type ===
                                "warning"
                              ? "#ef6c00"
                              : status.type ===
                                "normal"
                              ? "#2e7d32"
                              : "#607d8b",
                        }}
                      >
                        {status.text}
                      </td>

                      {/* PURCHASE DATE QUICK VIEW */}

                      <td
                        style={{
                          ...tdStyle,
                          minWidth: 130,
                        }}
                      >
                        {purchaseDate ? (
                          <button
                            type="button"
                            onClick={() =>
                              openSupplierPurchase(
                                item
                              )
                            }
                            style={{
                              border:
                                "1px solid #1565c0",
                              background:
                                "#eaf3ff",
                              color:
                                "#1565c0",
                              borderRadius:
                                6,
                              padding:
                                "6px 9px",
                              cursor:
                                "pointer",
                              fontWeight:
                                "bold",
                              fontSize: 11,
                            }}
                          >
                            📦{" "}
                            {formatDate(
                              purchaseDate
                            )}
                          </button>
                        ) : (
                          <span
                            style={{
                              color:
                                "#999",
                              fontSize: 11,
                            }}
                          >
                            Date नहीं है
                          </span>
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

      {/* =================================================
          SUPPLIER PURCHASE DETAIL MODAL
      ================================================= */}

      {selectedSupplierItem && (
        <div
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSupplierPurchase();
            }
          }}
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.55)",
            display:
              "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            padding: 15,
            zIndex: 9999,
            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              width:
                "100%",
              maxWidth:
                550,
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              background:
                "white",
              borderRadius:
                14,
              boxShadow:
                "0 10px 35px rgba(0,0,0,0.3)",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                background:
                  "linear-gradient(135deg,#1565c0,#42a5f5)",
                color:
                  "white",
                padding:
                  "16px 18px",
                borderRadius:
                  "14px 14px 0 0",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      19,
                    fontWeight:
                      "bold",
                  }}
                >
                  🏢 Supplier Purchase Details
                </div>

                <div
                  style={{
                    fontSize:
                      12,
                    marginTop:
                      4,
                    opacity:
                      0.9,
                  }}
                >
                  इस Medicine को किस Supplier से
                  और कब खरीदा गया था
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeSupplierPurchase
                }
                style={{
                  border:
                    "none",
                  background:
                    "rgba(255,255,255,0.2)",
                  color:
                    "white",
                  width: 35,
                  height: 35,
                  borderRadius:
                    "50%",
                  cursor:
                    "pointer",
                  fontSize:
                    20,
                  fontWeight:
                    "bold",
                }}
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div
              style={{
                padding:
                  18,
              }}
            >
              {/* SUPPLIER CARD */}

              <div
                style={{
                  background:
                    "#eaf3ff",
                  border:
                    "1px solid #bbdefb",
                  borderRadius:
                    10,
                  padding:
                    14,
                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    fontSize:
                      12,
                    color:
                      "#555",
                    marginBottom:
                      5,
                  }}
                >
                  SUPPLIER
                </div>

                <div
                  style={{
                    fontSize:
                      19,
                    fontWeight:
                      "bold",
                    color:
                      "#1565c0",
                  }}
                >
                  🏢{" "}
                  {getSupplierName(
                    selectedSupplierItem
                  ) || "Supplier उपलब्ध नहीं है"}
                </div>

                {getSupplierMobile(
                  selectedSupplierItem
                ) && (
                  <div
                    style={{
                      marginTop:
                        7,
                      fontSize:
                        14,
                      color:
                        "#444",
                    }}
                  >
                    📱{" "}
                    {getSupplierMobile(
                      selectedSupplierItem
                    )}
                  </div>
                )}
              </div>

              {/* PURCHASE DATE CARD */}

              <div
                style={{
                  background:
                    "#f8f9fa",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    10,
                  padding:
                    14,
                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    fontSize:
                      12,
                    color:
                      "#666",
                    marginBottom:
                      5,
                  }}
                >
                  PURCHASE DATE
                </div>

                <div
                  style={{
                    fontSize:
                      20,
                    fontWeight:
                      "bold",
                    color:
                      "#2e7d32",
                  }}
                >
                  📅{" "}
                  {formatDate(
                    getPurchaseDate(
                      selectedSupplierItem
                    )
                  )}
                </div>

                {getPurchaseTime(
                  selectedSupplierItem
                ) && (
                  <div
                    style={{
                      marginTop:
                        5,
                      fontSize:
                        13,
                      color:
                        "#666",
                    }}
                  >
                    ⏰{" "}
                    {getPurchaseTime(
                      selectedSupplierItem
                    )}
                  </div>
                )}
              </div>

              {/* MEDICINE DETAILS */}

              <div
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    10,
                  overflow:
                    "hidden",
                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    background:
                      "#f1f3f5",
                    padding:
                      "10px 12px",
                    fontWeight:
                      "bold",
                    color:
                      "#333",
                  }}
                >
                  💊 Medicine Details
                </div>

                <DetailRow
                  label="Medicine"
                  value={
                    selectedSupplierItem
                      ?.medicine ||
                    "-"
                  }
                />

                <DetailRow
                  label="Company"
                  value={
                    selectedSupplierItem
                      ?.company ||
                    "-"
                  }
                />

                <DetailRow
                  label="Batch"
                  value={
                    selectedSupplierItem
                      ?.batch ||
                    "-"
                  }
                />

                <DetailRow
                  label="Barcode"
                  value={
                    selectedSupplierItem
                      ?.barcode ||
                    "-"
                  }
                />

                <DetailRow
                  label="Current Stock"
                  value={
                    selectedSupplierItem
                      ?.quantity ??
                    0
                  }
                />

                <DetailRow
                  label="Expiry"
                  value={
                    selectedSupplierItem
                      ?.expiry ||
                    selectedSupplierItem
                      ?.expiryDate ||
                    selectedSupplierItem
                      ?.expiry_date ||
                    "-"
                  }
                />
              </div>

              {/* RATE DETAILS */}

              <div
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    10,
                  overflow:
                    "hidden",
                  marginBottom:
                    12,
                }}
              >
                <div
                  style={{
                    background:
                      "#f1f3f5",
                    padding:
                      "10px 12px",
                    fontWeight:
                      "bold",
                    color:
                      "#333",
                  }}
                >
                  💰 Rate Details
                </div>

                <DetailRow
                  label="Purchase Rate"
                  value={`₹${getPurchaseRate(
                    selectedSupplierItem
                  ).toFixed(2)}`}
                />

                <DetailRow
                  label="Sale Rate"
                  value={`₹${getSaleRate(
                    selectedSupplierItem
                  ).toFixed(2)}`}
                />

                <DetailRow
                  label="MRP"
                  value={`₹${getMRP(
                    selectedSupplierItem
                  ).toFixed(2)}`}
                />
              </div>

              {/* INVOICE DETAILS */}

              <div
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    10,
                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    background:
                      "#f1f3f5",
                    padding:
                      "10px 12px",
                    fontWeight:
                      "bold",
                    color:
                      "#333",
                  }}
                >
                  🧾 Purchase Reference
                </div>

                <DetailRow
                  label="Invoice No."
                  value={
                    getPurchaseInvoice(
                      selectedSupplierItem
                    ) || "-"
                  }
                />

                <DetailRow
                  label="Purchase ID"
                  value={
                    getPurchaseId(
                      selectedSupplierItem
                    ) || "-"
                  }
                />

                <DetailRow
                  label="Purchase Date"
                  value={formatDate(
                    getPurchaseDate(
                      selectedSupplierItem
                    )
                  )}
                />
              </div>

              {/* CLOSE */}

              <button
                type="button"
                onClick={
                  closeSupplierPurchase
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    15,
                  padding:
                    "12px",
                  border:
                    "none",
                  borderRadius:
                    8,
                  background:
                    "#555",
                  color:
                    "white",
                  fontWeight:
                    "bold",
                  fontSize:
                    15,
                  cursor:
                    "pointer",
                }}
              >
                ✖️ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        style={{
          textAlign:
            "center",
          color:
            "#888",
          fontSize: 12,
          padding:
            "18px 10px 5px",
        }}
      >
        Press <b>Esc</b> to return to Dashboard
      </div>
    </div>
  );
}

// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
        gap: 15,
        padding:
          "10px 12px",
        borderTop:
          "1px solid #eee",
      }}
    >
      <span
        style={{
          color:
            "#666",
          fontSize:
            13,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#222",
          fontSize:
            13,
          textAlign:
            "right",
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// TABLE STYLES
// =====================================================

const thStyle = {
  padding: "11px 9px",
  textAlign: "left",
  whiteSpace: "nowrap",
  borderRight:
    "1px solid rgba(255,255,255,0.2)",
};

const tdStyle = {
  padding: "11px 9px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export default Expiry;