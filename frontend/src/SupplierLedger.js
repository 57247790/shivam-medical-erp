
import React, { useMemo, useState } from "react";

function SupplierLedger({
  stock = [],
  setPage,
  goBack,
}) {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [showEditSupplier, setShowEditSupplier] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    mobile: "",
    address: "",
    gst: "",
    contactPerson: "",
    note: "",
  });

  const safeStock = Array.isArray(stock) ? stock : [];

  // =====================================================
  // STORAGE HELPERS
  // =====================================================

  const loadArray = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const loadObject = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "{}"
      );

      return data &&
        typeof data === "object" &&
        !Array.isArray(data)
        ? data
        : {};
    } catch {
      return {};
    }
  };

  const purchases = useMemo(
    () => loadArray("purchaseHistory"),
    [refresh]
  );

  const supplierPayments = useMemo(
    () => loadArray("supplierPayments"),
    [refresh]
  );

  const advances = useMemo(
    () => loadObject("supplierAdvances"),
    [refresh]
  );

  const supplierDetails = useMemo(
    () => loadObject("supplierDetails"),
    [refresh]
  );

  // =====================================================
  // HELPERS
  // =====================================================

  const getSupplierName = (item) => {
    return String(
      item?.supplier ||
        item?.supplierName ||
        item?.vendor ||
        ""
    ).trim();
  };

  const makeSupplierKey = (name) => {
    return String(name || "")
      .trim()
      .toLowerCase();
  };

  const getPurchaseAmount = (item) => {
    if (item?.purchaseAmount != null) {
      return Number(item.purchaseAmount) || 0;
    }

    if (item?.totalAmount != null) {
      return Number(item.totalAmount) || 0;
    }

    if (item?.amount != null) {
      return Number(item.amount) || 0;
    }

    const quantity = Number(
      item?.quantity ?? item?.qty ?? 0
    );

    const rate = Number(
      item?.purchaseRate ?? item?.rate ?? 0
    );

    return quantity * rate;
  };

  const getPaymentAmount = (item) => {
    return Number(
      item?.amount ??
        item?.paidAmount ??
        item?.payment ??
        0
    );
  };

  const getPaymentType = (item) => {
    return item?.paymentType || "udhari_settlement";
  };

  // =====================================================
  // LATEST ACTIVITY DATE/TIME
  // =====================================================

  const getItemDateTime = (item) => {
    if (item?.createdAt) {
      const t = new Date(item.createdAt).getTime();

      if (Number.isFinite(t)) {
        return t;
      }
    }

    if (item?.updatedAt) {
      const t = new Date(item.updatedAt).getTime();

      if (Number.isFinite(t)) {
        return t;
      }
    }

    const dateValue =
      item?.date ||
      item?.purchaseDate ||
      item?.createdDate ||
      item?.billDate ||
      "";

    const timeValue = item?.time || "";

    const raw = `${dateValue} ${timeValue}`.trim();

    let t = new Date(raw).getTime();

    if (Number.isFinite(t)) {
      return t;
    }

    const match = String(dateValue).match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/
    );

    if (match) {
      const [, d, m, y] = match;

      const year =
        y.length === 2
          ? 2000 + Number(y)
          : Number(y);

      t = new Date(
        year,
        Number(m) - 1,
        Number(d)
      ).getTime();

      if (Number.isFinite(t)) {
        return t;
      }
    }

    return 0;
  };

  const formatLatestDate = (timestamp) => {
    if (!timestamp) {
      return "-";
    }

    try {
      return new Date(timestamp).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "-";
    }
  };

  // =====================================================
  // SUPPLIER ROWS
  // LATEST SUPPLIER FIRST
  // =====================================================

  const supplierRows = useMemo(() => {
    const map = new Map();

    const addSupplier = (
      name,
      latestTime = 0
    ) => {
      const cleanName = String(name || "").trim();

      if (!cleanName) {
        return;
      }

      const key = makeSupplierKey(cleanName);

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          name: cleanName,
          latestTime,
        });
      } else if (
        latestTime > existing.latestTime
      ) {
        existing.latestTime = latestTime;
      }
    };

    // PURCHASES
    purchases.forEach((item) => {
      addSupplier(
        getSupplierName(item),
        getItemDateTime(item)
      );
    });

    // PAYMENTS
    supplierPayments.forEach((item) => {
      addSupplier(
        getSupplierName(item),
        getItemDateTime(item)
      );
    });

    // STOCK
    safeStock.forEach((item) => {
      addSupplier(
        getSupplierName(item),
        getItemDateTime(item)
      );
    });

    // ADVANCES
    Object.keys(advances).forEach((key) => {
      if (!key) {
        return;
      }

      const found = [
        ...purchases,
        ...supplierPayments,
        ...safeStock,
      ].find(
        (item) =>
          makeSupplierKey(
            getSupplierName(item)
          ) === key
      );

      if (found) {
        addSupplier(
          getSupplierName(found),
          getItemDateTime(found)
        );
      }
    });

    // SUPPLIER DETAILS
    Object.keys(supplierDetails).forEach(
      (key) => {
        const detail = supplierDetails[key];

        if (detail?.name) {
          addSupplier(
            detail.name,
            getItemDateTime(detail)
          );
        }
      }
    );

    // LATEST FIRST
    return Array.from(map.values()).sort(
      (a, b) => {
        if (
          b.latestTime !== a.latestTime
        ) {
          return (
            b.latestTime -
            a.latestTime
          );
        }

        return a.name.localeCompare(
          b.name
        );
      }
    );
  }, [
    purchases,
    supplierPayments,
    safeStock,
    advances,
    supplierDetails,
  ]);

  const supplierNames = useMemo(
    () =>
      supplierRows.map(
        (row) => row.name
      ),
    [supplierRows]
  );

  const filteredSuppliers =
    supplierRows.filter((row) =>
      row.name
        .toLowerCase()
        .includes(
          search
            .trim()
            .toLowerCase()
        )
    );

  // =====================================================
  // SUPPLIER DATA
  // =====================================================

  const getSupplierData = (
    supplier
  ) => {
    const key = makeSupplierKey(
      supplier
    );

    const supplierPurchases =
      purchases.filter(
        (item) =>
          makeSupplierKey(
            getSupplierName(item)
          ) === key
      );

    const supplierPaymentList =
      supplierPayments.filter(
        (item) =>
          makeSupplierKey(
            getSupplierName(item)
          ) === key
      );

    const purchaseTotal =
      supplierPurchases.reduce(
        (sum, item) =>
          sum +
          getPurchaseAmount(item),
        0
      );

    const udhariPaid =
      supplierPaymentList
        .filter(
          (item) =>
            getPaymentType(item) ===
            "udhari_settlement"
        )
        .reduce(
          (sum, item) =>
            sum +
            getPaymentAmount(item),
          0
        );

    const advance = Number(
      advances[key] || 0
    );

    // IMPORTANT:
    // Advance is NOT deducted here.
    const pending = Math.max(
      purchaseTotal -
        udhariPaid,
      0
    );

    return {
      supplierPurchases,
      supplierPayments:
        supplierPaymentList,
      purchaseTotal,
      paidTotal:
        udhariPaid,
      pending,
      advance,
    };
  };

  const selectedData =
    selectedSupplier
      ? getSupplierData(
          selectedSupplier
        )
      : null;

  // =====================================================
  // MONEY
  // =====================================================

  const money = (value) =>
    `₹${Number(
      value || 0
    ).toFixed(2)}`;

  // =====================================================
  // SUPPLIER DETAILS
  // =====================================================

  const getSupplierDetails = (
    supplier
  ) => {
    const key =
      makeSupplierKey(
        supplier
      );

    return (
      supplierDetails[key] || {
        name: supplier,
        mobile: "",
        address: "",
        gst: "",
        contactPerson: "",
        note: "",
      }
    );
  };

  // =====================================================
  // OPEN SUPPLIER
  // =====================================================

  const openSupplier = (
    supplier
  ) => {
    setSelectedSupplier(
      supplier
    );

    localStorage.setItem(
      "selectedSupplierForPayment",
      supplier
    );
  };

  // =====================================================
  // SUPPLIER PAYMENT
  // =====================================================

  const openPayment = () => {
    if (!selectedSupplier) {
      alert(
        "⚠️ पहले Supplier select करें।"
      );
      return;
    }

    localStorage.setItem(
      "selectedSupplierForPayment",
      selectedSupplier
    );

    if (
      typeof setPage ===
      "function"
    ) {
      setPage(
        "supplierPayment"
      );
    }
  };

  // =====================================================
  // CLOSE SUPPLIER
  // =====================================================

  const closeSupplier = () => {
    setSelectedSupplier("");
    setShowEditSupplier(false);
  };

  // =====================================================
  // EDIT SUPPLIER
  // =====================================================

  const openEditSupplier = () => {
    if (!selectedSupplier) {
      alert(
        "⚠️ पहले Supplier select करें।"
      );
      return;
    }

    const details =
      getSupplierDetails(
        selectedSupplier
      );

    setSupplierForm({
      name:
        details.name ||
        selectedSupplier,
      mobile:
        details.mobile || "",
      address:
        details.address || "",
      gst:
        details.gst || "",
      contactPerson:
        details.contactPerson ||
        "",
      note:
        details.note || "",
    });

    setShowEditSupplier(true);
  };

  // =====================================================
  // SAVE SUPPLIER DETAILS
  // =====================================================

  const saveSupplierDetails =
    () => {
      const oldName =
        selectedSupplier.trim();

      const newName =
        supplierForm.name.trim();

      if (!newName) {
        alert(
          "⚠️ Supplier Name जरूरी है।"
        );
        return;
      }

      const oldKey =
        makeSupplierKey(
          oldName
        );

      const newKey =
        makeSupplierKey(
          newName
        );

      let details =
        loadObject(
          "supplierDetails"
        );

      details[newKey] = {
        name: newName,
        mobile:
          supplierForm.mobile.trim(),
        address:
          supplierForm.address.trim(),
        gst:
          supplierForm.gst.trim(),
        contactPerson:
          supplierForm.contactPerson.trim(),
        note:
          supplierForm.note.trim(),
        updatedAt: Date.now(),
      };

      if (
        oldKey !== newKey
      ) {
        delete details[oldKey];
      }

      localStorage.setItem(
        "supplierDetails",
        JSON.stringify(details)
      );

      setSelectedSupplier(
        newName
      );

      localStorage.setItem(
        "selectedSupplierForPayment",
        newName
      );

      setShowEditSupplier(false);

      setRefresh(
        (value) =>
          value + 1
      );

      window.dispatchEvent(
        new Event(
          "supplierDetailsUpdated"
        )
      );

      localStorage.setItem(
        "supplierDetailsUpdatedAt",
        String(Date.now())
      );

      alert(
        "✅ Supplier Details Successfully Saved\n\n" +
          "Supplier: " +
          newName +
          "\n" +
          "Mobile: " +
          (supplierForm.mobile ||
            "-")
      );
    };

  // =====================================================
  // TOTALS
  // =====================================================

  const totalPurchase =
    purchases.reduce(
      (sum, item) =>
        sum +
        getPurchaseAmount(item),
      0
    );

  const totalUdhariPaid =
    supplierPayments
      .filter(
        (item) =>
          getPaymentType(item) ===
          "udhari_settlement"
      )
      .reduce(
        (sum, item) =>
          sum +
          getPaymentAmount(item),
        0
      );

  const totalAdvance =
    Object.values(
      advances
    ).reduce(
      (sum, value) =>
        sum +
        Number(value || 0),
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
          <h1 style={headerTitle}>
            🏢 Supplier Ledger
          </h1>

          <div style={subtitle}>
            Purchase • Payment • Advance • Pending
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

      {/* SUMMARY */}

      <div style={summaryGrid}>
        <SummaryCard
          title="Total Purchase"
          value={money(
            totalPurchase
          )}
          color="#ef6c00"
        />

        <SummaryCard
          title="Udhari Paid"
          value={money(
            totalUdhariPaid
          )}
          color="#2e7d32"
        />

        <SummaryCard
          title="Total Advance"
          value={money(
            totalAdvance
          )}
          color="#6a1b9a"
        />

        <SummaryCard
          title="Suppliers"
          value={
            supplierNames.length
          }
          color="#1565c0"
        />
      </div>

      {/* ACTIONS */}

      <div style={actionBox}>
        {selectedSupplier ? (
          <button
            type="button"
            onClick={openPayment}
            style={paymentButton}
          >
            💳 Supplier Payment
          </button>
        ) : (
          <div
            style={{
              padding:
                "10px 14px",
              background:
                "#fff3cd",
              color:
                "#856404",
              borderRadius: 7,
              fontWeight:
                "bold",
            }}
          >
            👆 पहले Supplier select करें
          </div>
        )}

        {selectedSupplier && (
          <>
            <button
              type="button"
              onClick={
                openEditSupplier
              }
              style={editButton}
            >
              ✏️ Edit Supplier
            </button>

            <button
              type="button"
              onClick={
                closeSupplier
              }
              style={
                backSupplierButton
              }
            >
              ⬅️ All Suppliers
            </button>
          </>
        )}
      </div>

      {/* SEARCH */}

      <div style={sectionStyle}>
        <input
          type="text"
          placeholder="🔎 Supplier Name Search करें..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={searchInput}
        />
      </div>

      {/* EDIT SUPPLIER */}

      {showEditSupplier &&
        selectedSupplier && (
          <div
            style={
              editSectionStyle
            }
          >
            <div
              style={
                editHeaderStyle
              }
            >
              <div>
                <div
                  style={
                    smallLabel
                  }
                >
                  Supplier Details
                </div>

                <h2
                  style={{
                    margin:
                      "4px 0",
                  }}
                >
                  ✏️ Edit Supplier
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditSupplier(
                    false
                  )
                }
                style={
                  closeEditButton
                }
              >
                ✕
              </button>
            </div>

            <div
              style={
                formGrid
              }
            >
              <div>
                <label
                  style={
                    fieldLabel
                  }
                >
                  Supplier Name *
                </label>

                <input
                  type="text"
                  value={
                    supplierForm.name
                  }
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        name:
                          e.target
                            .value,
                      }
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    fieldLabel
                  }
                >
                  📱 Mobile Number
                </label>

                <input
                  type="tel"
                  value={
                    supplierForm.mobile
                  }
                  placeholder="Mobile Number"
                  maxLength={15}
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        mobile:
                          e.target
                            .value,
                      }
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    fieldLabel
                  }
                >
                  🧾 GST Number
                </label>

                <input
                  type="text"
                  value={
                    supplierForm.gst
                  }
                  placeholder="GST Number"
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        gst:
                          e.target.value.toUpperCase(),
                      }
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div>
                <label
                  style={
                    fieldLabel
                  }
                >
                  👤 Contact Person
                </label>

                <input
                  type="text"
                  value={
                    supplierForm.contactPerson
                  }
                  placeholder="Contact Person"
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        contactPerson:
                          e.target
                            .value,
                      }
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    fieldLabel
                  }
                >
                  📍 Address
                </label>

                <textarea
                  value={
                    supplierForm.address
                  }
                  placeholder="Supplier Address"
                  rows={3}
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        address:
                          e.target
                            .value,
                      }
                    )
                  }
                  style={
                    textareaStyle
                  }
                />
              </div>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={
                    fieldLabel
                  }
                >
                  📝 Note
                </label>

                <textarea
                  value={
                    supplierForm.note
                  }
                  placeholder="Supplier के बारे में Note"
                  rows={2}
                  onChange={(e) =>
                    setSupplierForm(
                      {
                        ...supplierForm,
                        note:
                          e.target
                            .value,
                      }
                    )
                  }
                  style={
                    textareaStyle
                  }
                />
              </div>
            </div>

            <div
              style={
                editActions
              }
            >
              <button
                type="button"
                onClick={
                  saveSupplierDetails
                }
                style={
                  saveButton
                }
              >
                💾 Save Supplier Details
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowEditSupplier(
                    false
                  )
                }
                style={
                  cancelButton
                }
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      {/* =================================================
          SELECTED SUPPLIER DETAIL
      ================================================= */}

      {selectedSupplier &&
      selectedData ? (
        <div
          style={
            sectionStyle
          }
        >
          <div
            style={
              supplierHeader
            }
          >
            <div>
              <div
                style={
                  smallLabel
                }
              >
                Selected Supplier
              </div>

              <h2
                style={{
                  margin:
                    "3px 0",
                }}
              >
                🏢{" "}
                {getSupplierDetails(
                  selectedSupplier
                ).name ||
                  selectedSupplier}
              </h2>

              {getSupplierDetails(
                selectedSupplier
              ).mobile && (
                <div
                  style={
                    contactLine
                  }
                >
                  📱{" "}
                  <b>
                    {
                      getSupplierDetails(
                        selectedSupplier
                      ).mobile
                    }
                  </b>
                </div>
              )}

              {getSupplierDetails(
                selectedSupplier
              ).contactPerson && (
                <div
                  style={
                    contactLine
                  }
                >
                  👤{" "}
                  {
                    getSupplierDetails(
                      selectedSupplier
                    ).contactPerson
                  }
                </div>
              )}

              {getSupplierDetails(
                selectedSupplier
              ).gst && (
                <div
                  style={
                    contactLine
                  }
                >
                  🧾 GST:{" "}
                  {
                    getSupplierDetails(
                      selectedSupplier
                    ).gst
                  }
                </div>
              )}

              {getSupplierDetails(
                selectedSupplier
              ).address && (
                <div
                  style={
                    contactLine
                  }
                >
                  📍{" "}
                  {
                    getSupplierDetails(
                      selectedSupplier
                    ).address
                  }
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={
                openEditSupplier
              }
              style={
                editSmallButton
              }
            >
              ✏️ Edit
            </button>
          </div>

          {/* DETAIL SUMMARY */}

          <div
            style={
              detailGrid
            }
          >
            <SummaryCard
              title="Purchase"
              value={money(
                selectedData.purchaseTotal
              )}
              color="#ef6c00"
            />

            <SummaryCard
              title="Udhari Paid"
              value={money(
                selectedData.paidTotal
              )}
              color="#2e7d32"
            />

            <SummaryCard
              title="Pending"
              value={money(
                selectedData.pending
              )}
              color="#d32f2f"
            />

            <SummaryCard
              title="Advance"
              value={money(
                selectedData.advance
              )}
              color="#6a1b9a"
            />
          </div>

          {/* NOTE */}

          {getSupplierDetails(
            selectedSupplier
          ).note && (
            <div
              style={
                noteBox
              }
            >
              📝 <b>Note:</b>{" "}
              {
                getSupplierDetails(
                  selectedSupplier
                ).note
              }
            </div>
          )}

          {/* ADVANCE */}

          {selectedData.advance >
            0 && (
            <div
              style={
                advanceBox
              }
            >
              💜{" "}
              <b>
                Supplier Advance:
              </b>{" "}
              {money(
                selectedData.advance
              )}
              <br />
              यह amount Supplier को पहले से दिया गया है और
              आगे की Purchase में adjust किया जा सकता है।
            </div>
          )}

          {/* PURCHASE HISTORY */}

          <h3
            style={
              subHeading
            }
          >
            🛒 Purchase History
          </h3>

          {selectedData
            .supplierPurchases
            .length === 0 ? (
            <div
              style={
                emptyBox
              }
            >
              इस Supplier की Purchase entry नहीं मिली।
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={
                  tableStyle
                }
              >
                <thead>
                  <tr>
                    <th
                      style={
                        thStyle
                      }
                    >
                      Date
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Medicine
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Batch
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Qty
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Purchase Rate
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedData.supplierPurchases.map(
                    (
                      purchase,
                      index
                    ) => (
                      <tr
                        key={
                          purchase?.id ||
                          index
                        }
                      >
                        <td
                          style={
                            tdStyle
                          }
                        >
                          {purchase?.date ||
                            purchase?.purchaseDate ||
                            "-"}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <b>
                            {
                              purchase?.medicine ||
                              "-"
                            }
                          </b>
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {purchase?.batch ||
                            "-"}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {purchase?.quantity ??
                            purchase?.qty ??
                            0}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {money(
                            purchase?.purchaseRate ??
                              purchase?.rate ??
                              0
                          )}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {money(
                            getPurchaseAmount(
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

          {/* PAYMENTS */}

          <h3
            style={
              subHeading
            }
          >
            💳 Supplier Payments
          </h3>

          {selectedData
            .supplierPayments
            .length === 0 ? (
            <div
              style={
                emptyBox
              }
            >
              इस Supplier को कोई Payment नहीं किया गया है।
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={
                  tableStyle
                }
              >
                <thead>
                  <tr>
                    <th
                      style={
                        thStyle
                      }
                    >
                      Date
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Amount
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Mode
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Type
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedData.supplierPayments.map(
                    (
                      payment,
                      index
                    ) => {
                      const type =
                        getPaymentType(
                          payment
                        );

                      return (
                        <tr
                          key={
                            payment?.id ||
                            index
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment?.date ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                              color:
                                type ===
                                "advance"
                                  ? "#6a1b9a"
                                  : "#2e7d32",
                            }}
                          >
                            {money(
                              getPaymentAmount(
                                payment
                              )
                            )}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {payment?.paymentMode ||
                              payment?.mode ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                "bold",
                              color:
                                type ===
                                "advance"
                                  ? "#6a1b9a"
                                  : "#2e7d32",
                            }}
                          >
                            {type ===
                            "advance"
                              ? "💜 Advance"
                              : "🔴 Udhari Settlement"}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
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
      ) : (
        /* =================================================
           ALL SUPPLIERS TABLE
        ================================================= */

        <div
          style={
            sectionStyle
          }
        >
          <h2
            style={
              sectionTitle
            }
          >
            🏢 Suppliers
          </h2>

          {filteredSuppliers.length ===
          0 ? (
            <div
              style={
                emptyBox
              }
            >
              ⚠️ कोई Supplier उपलब्ध नहीं है।
              <br />
              <br />
              पहले Purchase Entry में Supplier का नाम save करें।
            </div>
          ) : (
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={
                  supplierTableStyle
                }
              >
                <thead>
                  <tr>
                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Supplier
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Mobile
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Purchase
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Udhari Paid
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Pending
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Advance
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Latest
                    </th>

                    <th
                      style={
                        supplierThStyle
                      }
                    >
                      Open
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSuppliers.map(
                    ({
                      name: supplier,
                      latestTime,
                    }) => {
                      const data =
                        getSupplierData(
                          supplier
                        );

                      const details =
                        getSupplierDetails(
                          supplier
                        );

                      return (
                        <tr
                          key={
                            supplier
                          }
                          onClick={() =>
                            openSupplier(
                              supplier
                            )
                          }
                          onKeyDown={(
                            e
                          ) => {
                            if (
                              e.key ===
                                "Enter" ||
                              e.key ===
                                " "
                            ) {
                              e.preventDefault();

                              openSupplier(
                                supplier
                              );
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          title="Supplier Ledger खोलें"
                          style={{
                            ...supplierClickableRow,
                            borderLeft:
                              data.pending >
                              0
                                ? "5px solid #d32f2f"
                                : data.advance >
                                  0
                                ? "5px solid #6a1b9a"
                                : "5px solid #2e7d32",
                          }}
                        >
                          <td
                            style={{
                              ...supplierTdStyle,
                              fontWeight:
                                "bold",
                              color:
                                "#1565c0",
                            }}
                          >
                            🏢{" "}
                            {details.name ||
                              supplier}
                          </td>

                          <td
                            style={
                              supplierTdStyle
                            }
                          >
                            {details.mobile ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...supplierTdStyle,
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              data.purchaseTotal
                            )}
                          </td>

                          <td
                            style={{
                              ...supplierTdStyle,
                              color:
                                "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              data.paidTotal
                            )}
                          </td>

                          <td
                            style={{
                              ...supplierTdStyle,
                              color:
                                data.pending >
                                0
                                  ? "#d32f2f"
                                  : "#2e7d32",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              data.pending
                            )}
                          </td>

                          <td
                            style={{
                              ...supplierTdStyle,
                              color:
                                "#6a1b9a",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {money(
                              data.advance
                            )}
                          </td>

                          <td
                            style={
                              supplierTdStyle
                            }
                          >
                            {formatLatestDate(
                              latestTime
                            )}
                          </td>

                          <td
                            style={{
                              ...supplierTdStyle,
                              color:
                                "#1565c0",
                              fontWeight:
                                "bold",
                              textAlign:
                                "center",
                            }}
                          >
                            Open →
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
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 8,
        borderLeft:
          `4px solid ${color}`,
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#777",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 19,
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
  fontFamily:
    "Arial, sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#0d47a1,#1976d2,#42a5f5)",
  color: "white",
  padding: 17,
  borderRadius: 11,
  marginBottom: 13,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.12)",
};

const headerTitle = {
  margin: 0,
  fontSize: 24,
};

const subtitle = {
  marginTop: 4,
  fontSize: 13,
};

const backButton = {
  padding: "9px 14px",
  background:
    "rgba(255,255,255,0.18)",
  color: "white",
  border:
    "1px solid rgba(255,255,255,0.4)",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: 9,
  marginBottom: 13,
};

const actionBox = {
  background: "white",
  padding: 10,
  borderRadius: 9,
  marginBottom: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const paymentButton = {
  padding: "10px 14px",
  background: "#6a1b9a",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};

const editButton = {
  padding: "10px 14px",
  background: "#1565c0",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};

const backSupplierButton = {
  padding: "10px 14px",
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};

const sectionStyle = {
  background: "white",
  padding: 14,
  borderRadius: 10,
  marginBottom: 13,
  boxShadow:
    "0 2px 7px rgba(0,0,0,0.06)",
};

const editSectionStyle = {
  background: "white",
  padding: 16,
  borderRadius: 10,
  marginBottom: 13,
  border:
    "2px solid #1976d2",
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.10)",
};

const editHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 15,
};

const closeEditButton = {
  width: 38,
  height: 38,
  border: "none",
  borderRadius: 7,
  background: "#ffebee",
  color: "#c62828",
  fontSize: 18,
  fontWeight: "bold",
  cursor: "pointer",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const fieldLabel = {
  display: "block",
  fontSize: 13,
  fontWeight: "bold",
  color: "#444",
  marginBottom: 5,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  border:
    "1px solid #ccc",
  borderRadius: 7,
  fontSize: 15,
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 11,
  border:
    "1px solid #ccc",
  borderRadius: 7,
  fontSize: 15,
  resize: "vertical",
  fontFamily:
    "Arial, sans-serif",
};

const editActions = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap",
  marginTop: 15,
};

const saveButton = {
  flex: "1 1 220px",
  padding: "12px 15px",
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: 7,
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
};

const cancelButton = {
  flex: "0 1 130px",
  padding: "12px 15px",
  background: "#777",
  color: "white",
  border: "none",
  borderRadius: 7,
  fontWeight: "bold",
  cursor: "pointer",
};

const sectionTitle = {
  margin: "0 0 10px",
  fontSize: 18,
};

const searchInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  border:
    "1px solid #ccc",
  borderRadius: 7,
  fontSize: 14,
};

// =====================================================
// SUPPLIER TABLE
// =====================================================

const supplierTableStyle = {
  width: "100%",
  minWidth: 900,
  borderCollapse:
    "collapse",
  fontSize: 12,
};

const supplierThStyle = {
  border:
    "1px solid #ddd",
  padding: 9,
  background:
    "#eaf2ff",
  whiteSpace:
    "nowrap",
  textAlign: "left",
};

const supplierTdStyle = {
  border:
    "1px solid #ddd",
  padding: 9,
  whiteSpace:
    "nowrap",
  background:
    "#fff",
};

const supplierClickableRow = {
  cursor: "pointer",
  transition:
    "background 0.15s",
};

// =====================================================
// SUPPLIER DETAIL
// =====================================================

const supplierHeader = {
  padding: 12,
  background:
    "#f5f7fa",
  borderRadius: 8,
  marginBottom: 12,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const smallLabel = {
  fontSize: 12,
  color: "#777",
};

const contactLine = {
  marginTop: 5,
  fontSize: 13,
  color: "#444",
};

const editSmallButton = {
  padding: "9px 13px",
  background: "#1565c0",
  color: "white",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(170px,1fr))",
  gap: 9,
  marginBottom: 15,
};

const noteBox = {
  background:
    "#fff8e1",
  border:
    "1px solid #ffe082",
  color: "#795548",
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
};

const advanceBox = {
  background:
    "#f3e5f5",
  border:
    "1px solid #ce93d8",
  color: "#6a1b9a",
  padding: 13,
  borderRadius: 8,
  marginBottom: 15,
  lineHeight: 1.6,
};

const subHeading = {
  margin:
    "16px 0 9px",
  fontSize: 16,
};

const emptyBox = {
  padding: 20,
  textAlign: "center",
  color: "#777",
  background:
    "#f7f8fa",
  borderRadius: 7,
};

// =====================================================
// DETAIL TABLE
// =====================================================

const tableStyle = {
  width: "100%",
  minWidth: 650,
  borderCollapse:
    "collapse",
  fontSize: 12,
};

const thStyle = {
  border:
    "1px solid #ddd",
  padding: 8,
  background:
    "#f1f5f9",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  border:
    "1px solid #ddd",
  padding: 8,
  whiteSpace:
    "nowrap",
};

export default SupplierLedger;