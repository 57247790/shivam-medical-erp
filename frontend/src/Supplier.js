
import React, { useEffect, useMemo, useState } from "react";

function Supplier({ goBack }) {
  // =====================================================
  // SUPPLIER
  // =====================================================

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  // =====================================================
  // MEDICINE
  // =====================================================

  const [medicine, setMedicine] = useState("");
  const [company, setCompany] = useState("");
  const [barcode, setBarcode] = useState("");

  const [purchaseRate, setPurchaseRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [saleRate, setSaleRate] = useState("");

  const [gstType, setGstType] = useState(
    localStorage.getItem("purchaseGST") || "+5"
  );

  const [expiry, setExpiry] = useState("");

  // =====================================================
  // DATA
  // =====================================================

  const [suppliers, setSuppliers] = useState([]);
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [supplierHistory, setSupplierHistory] = useState([]);

  // =====================================================
  // SEARCH
  // =====================================================

  const [supplierSearch, setSupplierSearch] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");

  const [showSupplierList, setShowSupplierList] = useState(false);
  const [showMedicineList, setShowMedicineList] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // =====================================================
  // EDIT MODE
  // =====================================================

  const [editingSupplierId, setEditingSupplierId] = useState(null);

  // =====================================================
  // HELPERS
  // =====================================================

  const cleanMobileNumber = (value) => {
    return String(value || "").replace(/\D/g, "").slice(0, 10);
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  const readStorage = (key, fallback = []) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return data ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const makeId = (prefix) => {
    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  };

  const refreshData = () => {
    const supplierData = readStorage("suppliers", []);
    const medicineData = readStorage("medicineMaster", []);
    const historyData = readStorage(
      "supplierMedicineHistory",
      []
    );

    setSuppliers(
      Array.isArray(supplierData) ? supplierData : []
    );

    setMedicineMaster(
      Array.isArray(medicineData) ? medicineData : []
    );

    setSupplierHistory(
      Array.isArray(historyData) ? historyData : []
    );
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    refreshData();

    const handleSupplierUpdate = () => {
      refreshData();
    };

    const handleMedicineUpdate = () => {
      refreshData();
    };

    window.addEventListener(
      "supplierUpdated",
      handleSupplierUpdate
    );

    window.addEventListener(
      "medicineMasterUpdated",
      handleMedicineUpdate
    );

    window.addEventListener(
      "storage",
      handleSupplierUpdate
    );

    return () => {
      window.removeEventListener(
        "supplierUpdated",
        handleSupplierUpdate
      );

      window.removeEventListener(
        "medicineMasterUpdated",
        handleMedicineUpdate
      );

      window.removeEventListener(
        "storage",
        handleSupplierUpdate
      );
    };
  }, []);

  // =====================================================
  // SUPPLIER SEARCH
  // =====================================================

  const filteredSuppliers = useMemo(() => {
    const search = normalizeText(supplierSearch);

    if (!search) {
      return suppliers;
    }

    return suppliers.filter((item) => {
      return (
        normalizeText(item.name).includes(search) ||
        normalizeText(item.mobile).includes(search) ||
        normalizeText(item.whatsapp).includes(search)
      );
    });
  }, [suppliers, supplierSearch]);

  // =====================================================
  // MEDICINE SEARCH
  // =====================================================

  const filteredMedicines = useMemo(() => {
    const search = normalizeText(medicineSearch);

    let list = medicineMaster;

    if (selectedSupplier) {
      list = list.filter(
        (item) =>
          normalizeText(item.supplier) ===
          normalizeText(selectedSupplier.name)
      );
    }

    if (!search) {
      return list.slice(0, 30);
    }

    return list
      .filter((item) => {
        return (
          normalizeText(item.medicine).includes(search) ||
          normalizeText(item.company).includes(search) ||
          normalizeText(item.barcode).includes(search)
        );
      })
      .slice(0, 30);
  }, [
    medicineMaster,
    medicineSearch,
    selectedSupplier,
  ]);

  // =====================================================
  // SELECT SUPPLIER
  // =====================================================

  const selectSupplier = (supplier) => {
    if (!supplier) return;

    setSelectedSupplier(supplier);

    setName(supplier.name || "");

    setMobile(
      supplier.mobile ||
        supplier.whatsapp ||
        ""
    );

    setSupplierSearch(supplier.name || "");

    setShowSupplierList(false);

    setMedicineSearch("");
  };

  // =====================================================
  // SUPPLIER NAME CHANGE
  // =====================================================

  const handleSupplierNameChange = (value) => {
    setName(value);
    setSupplierSearch(value);

    setSelectedSupplier(null);

    setShowSupplierList(true);

    const found = suppliers.find(
      (item) =>
        normalizeText(item.name) ===
        normalizeText(value)
    );

    if (found) {
      setMobile(
        found.mobile ||
          found.whatsapp ||
          ""
      );

      setSelectedSupplier(found);
    }
  };

  // =====================================================
  // MEDICINE SEARCH
  // =====================================================

  const handleMedicineSearch = (value) => {
    setMedicineSearch(value);
    setMedicine(value);
    setShowMedicineList(true);
  };

  // =====================================================
  // SELECT MEDICINE
  // =====================================================

  const selectMedicine = (item) => {
    if (!item) return;

    setMedicine(item.medicine || "");
    setCompany(item.company || "");
    setBarcode(item.barcode || "");

    setPurchaseRate(
      item.purchaseRate ??
        item.purchaseRateWithGST ??
        ""
    );

    setMrp(item.mrp ?? "");
    setSaleRate(item.saleRate ?? "");

    setGstType(item.gstType || "+5");

    setExpiry(item.expiry || "");

    if (item.supplier) {
      setName(item.supplier);
      setSupplierSearch(item.supplier);

      const supplier = suppliers.find(
        (s) =>
          normalizeText(s.name) ===
          normalizeText(item.supplier)
      );

      if (supplier) {
        setSelectedSupplier(supplier);

        setMobile(
          supplier.mobile ||
            supplier.whatsapp ||
            item.supplierMobile ||
            ""
        );
      } else {
        setMobile(
          item.supplierMobile || ""
        );
      }
    }

    setMedicineSearch(item.medicine || "");
    setShowMedicineList(false);
  };

  // =====================================================
  // SUPPLIER HISTORY
  // =====================================================

  const selectedSupplierHistory = useMemo(() => {
    if (!selectedSupplier && !name.trim()) {
      return [];
    }

    const supplierName =
      selectedSupplier?.name || name;

    return supplierHistory
      .filter(
        (item) =>
          normalizeText(item.supplier) ===
          normalizeText(supplierName)
      )
      .sort(
        (a, b) =>
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
      );
  }, [
    supplierHistory,
    selectedSupplier,
    name,
  ]);

  // =====================================================
  // MEDICINE PREVIOUS RATES
  // =====================================================

  const previousRates = useMemo(() => {
    if (!medicine.trim()) {
      return [];
    }

    const medicineName =
      normalizeText(medicine);

    return supplierHistory
      .filter(
        (item) =>
          normalizeText(item.medicine) ===
          medicineName
      )
      .sort(
        (a, b) =>
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
      );
  }, [supplierHistory, medicine]);

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const clearForm = () => {
    setName("");
    setMobile("");

    setMedicine("");
    setCompany("");
    setBarcode("");

    setPurchaseRate("");
    setMrp("");
    setSaleRate("");

    setExpiry("");

    setSupplierSearch("");
    setMedicineSearch("");

    setSelectedSupplier(null);

    setEditingSupplierId(null);

    setShowSupplierList(false);
    setShowMedicineList(false);
  };

  // =====================================================
  // SAVE SUPPLIER + MEDICINE
  // =====================================================

  const saveSupplier = () => {
    const cleanName = name.trim();

    const cleanMobile =
      cleanMobileNumber(mobile);

    const cleanMedicine =
      medicine.trim();

    if (!cleanName) {
      alert("⚠️ Supplier Name डालें");
      return;
    }

    if (
      !cleanMobile ||
      cleanMobile.length !== 10
    ) {
      alert(
        "⚠️ सही 10 digit Mobile Number डालें"
      );
      return;
    }

    if (!cleanMedicine) {
      alert("⚠️ Medicine Name डालें");
      return;
    }

    if (
      mrp &&
      saleRate &&
      Number(saleRate) > Number(mrp)
    ) {
      alert(
        "⚠️ Sale Rate, MRP से ज्यादा नहीं हो सकता"
      );
      return;
    }

    const now = Date.now();

    // ===================================================
    // SUPPLIER MASTER
    // ===================================================

    const existingSupplierIndex =
      suppliers.findIndex(
        (item) =>
          normalizeText(item.name) ===
          normalizeText(cleanName)
      );

    let updatedSuppliers = [
      ...suppliers,
    ];

    if (
      existingSupplierIndex >= 0
    ) {
      const old =
        updatedSuppliers[
          existingSupplierIndex
        ];

      updatedSuppliers[
        existingSupplierIndex
      ] = {
        ...old,

        name: cleanName,

        mobile: cleanMobile,

        whatsapp: cleanMobile,

        updatedAt: now,
      };

      setSelectedSupplier(
        updatedSuppliers[
          existingSupplierIndex
        ]
      );
    } else {
      const newSupplier = {
        id: makeId("SUPPLIER"),

        name: cleanName,

        mobile: cleanMobile,

        whatsapp: cleanMobile,

        createdAt: now,

        updatedAt: now,
      };

      updatedSuppliers = [
        newSupplier,
        ...updatedSuppliers,
      ];

      setSelectedSupplier(
        newSupplier
      );
    }

    writeStorage(
      "suppliers",
      updatedSuppliers
    );

    // ===================================================
    // MEDICINE MASTER
    // ===================================================

    const medicineData = {
      id: makeId("MEDICINE"),

      medicine: cleanMedicine,

      company:
        company.trim(),

      barcode:
        barcode.trim(),

      supplier:
        cleanName,

      supplierMobile:
        cleanMobile,

      purchaseRate:
        purchaseRate,

      mrp:
        mrp,

      saleRate:
        saleRate,

      gstType:
        gstType,

      expiry:
        expiry,

      updatedAt:
        now,
    };

    const existingMedicineIndex =
      medicineMaster.findIndex(
        (item) =>
          normalizeText(
            item.medicine
          ) ===
            normalizeText(
              cleanMedicine
            ) &&
          normalizeText(
            item.supplier
          ) ===
            normalizeText(
              cleanName
            )
      );

    let updatedMedicineMaster = [
      ...medicineMaster,
    ];

    if (
      existingMedicineIndex >= 0
    ) {
      const old =
        updatedMedicineMaster[
          existingMedicineIndex
        ];

      updatedMedicineMaster[
        existingMedicineIndex
      ] = {
        ...old,

        ...medicineData,

        id: old.id,

        updatedAt: now,
      };
    } else {
      updatedMedicineMaster = [
        medicineData,
        ...updatedMedicineMaster,
      ];
    }

    writeStorage(
      "medicineMaster",
      updatedMedicineMaster
    );

    // ===================================================
    // SUPPLIER MEDICINE HISTORY
    // ===================================================

    const historyItem = {
      id: makeId("SUPMED"),

      supplier:
        cleanName,

      supplierName:
        cleanName,

      supplierMobile:
        cleanMobile,

      medicine:
        cleanMedicine,

      company:
        company.trim(),

      barcode:
        barcode.trim(),

      purchaseRate:
        purchaseRate,

      mrp:
        mrp,

      saleRate:
        saleRate,

      gstType:
        gstType,

      expiry:
        expiry,

      createdAt:
        now,
    };

    const updatedHistory = [
      historyItem,
      ...supplierHistory,
    ];

    writeStorage(
      "supplierMedicineHistory",
      updatedHistory
    );

    // ===================================================
    // EVENTS
    // ===================================================

    localStorage.setItem(
      "supplierUpdatedAt",
      String(now)
    );

    localStorage.setItem(
      "medicineMasterUpdatedAt",
      String(now)
    );

    localStorage.setItem(
      "supplierMedicineHistoryUpdatedAt",
      String(now)
    );

    window.dispatchEvent(
      new Event("supplierUpdated")
    );

    window.dispatchEvent(
      new Event("medicineMasterUpdated")
    );

    window.dispatchEvent(
      new Event(
        "supplierMedicineHistoryUpdated"
      )
    );

    // ===================================================
    // UPDATE STATE
    // ===================================================

    setSuppliers(
      updatedSuppliers
    );

    setMedicineMaster(
      updatedMedicineMaster
    );

    setSupplierHistory(
      updatedHistory
    );

    setEditingSupplierId(null);

    alert(
      "✅ Supplier और Medicine Data Successfully Saved"
    );

    // Keep supplier selected
    const savedSupplier =
      updatedSuppliers.find(
        (item) =>
          normalizeText(item.name) ===
          normalizeText(cleanName)
      );

    if (savedSupplier) {
      setSelectedSupplier(
        savedSupplier
      );
    }

    setSupplierSearch(
      cleanName
    );

    setMedicineSearch("");

    setMedicine("");
    setCompany("");
    setBarcode("");

    setPurchaseRate("");
    setMrp("");
    setSaleRate("");

    setExpiry("");

    setShowMedicineList(false);
  };

  // =====================================================
  // EDIT SUPPLIER
  // =====================================================

  const editSupplier = (supplier) => {
    if (!supplier) return;

    setEditingSupplierId(
      supplier.id
    );

    setSelectedSupplier(
      supplier
    );

    setName(
      supplier.name || ""
    );

    setMobile(
      supplier.mobile ||
        supplier.whatsapp ||
        ""
    );

    setSupplierSearch(
      supplier.name || ""
    );

    setShowSupplierList(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE SUPPLIER
  // =====================================================

  const deleteSupplier = (supplier) => {
    if (!supplier) return;

    const ok = window.confirm(
      `क्या आप "${supplier.name}" को Supplier Master से delete करना चाहते हैं?`
    );

    if (!ok) return;

    const updatedSuppliers =
      suppliers.filter(
        (item) =>
          item.id !== supplier.id
      );

    writeStorage(
      "suppliers",
      updatedSuppliers
    );

    setSuppliers(
      updatedSuppliers
    );

    if (
      selectedSupplier?.id ===
      supplier.id
    ) {
      setSelectedSupplier(null);
      setName("");
      setMobile("");
      setSupplierSearch("");
    }

    localStorage.setItem(
      "supplierUpdatedAt",
      String(Date.now())
    );

    window.dispatchEvent(
      new Event("supplierUpdated")
    );

    alert(
      "✅ Supplier deleted"
    );
  };

  // =====================================================
  // WHATSAPP
  // =====================================================

  const openWhatsApp = (supplier) => {
    if (!supplier) return;

    const number =
      cleanMobileNumber(
        supplier.mobile ||
          supplier.whatsapp
      );

    if (number.length !== 10) {
      alert(
        "⚠️ Supplier का valid WhatsApp number नहीं है"
      );
      return;
    }

    const message = encodeURIComponent(
      `नमस्ते ${supplier.name},`
    );

    window.open(
      `https://wa.me/91${number}?text=${message}`,
      "_blank"
    );
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(
        Number(value)
      ).toLocaleString(
        "en-IN"
      );
    } catch {
      return "-";
    }
  };

  // =====================================================
  // UI STYLES
  // =====================================================

  const inputStyle = {
    width: "100%",
    padding: "11px",
    marginBottom: "10px",
    border:
      "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "15px",
  };

  const buttonStyle = {
    padding:
      "10px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "8px",
    marginBottom: "8px",
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <h2>
        🚚 Smart Supplier Master
      </h2>

      {/* =================================================
          SUPPLIER SEARCH
      ================================================= */}

      <div
        style={{
          border:
            "1px solid #ddd",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>
          🔎 Supplier Search
        </h3>

        <input
          type="text"
          placeholder="Supplier Name या Mobile Search करें"
          value={supplierSearch}
          onChange={(e) =>
            handleSupplierNameChange(
              e.target.value
            )
          }
          onFocus={() =>
            setShowSupplierList(true)
          }
          style={inputStyle}
        />

        {showSupplierList &&
          filteredSuppliers.length >
            0 && (
            <div
              style={{
                border:
                  "1px solid #ccc",
                borderRadius: "6px",
                maxHeight: "220px",
                overflowY: "auto",
                marginBottom: "10px",
              }}
            >
              {filteredSuppliers.map(
                (supplier) => (
                  <div
                    key={supplier.id}
                    onMouseDown={() =>
                      selectSupplier(
                        supplier
                      )
                    }
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #eee",
                      cursor:
                        "pointer",
                    }}
                  >
                    <strong>
                      {supplier.name}
                    </strong>

                    <div
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "#666",
                        marginTop:
                          "3px",
                      }}
                    >
                      📱{" "}
                      {supplier.mobile ||
                        supplier.whatsapp ||
                        "-"}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {selectedSupplier && (
          <div
            style={{
              background:
                "#f5f5f5",
              padding: "12px",
              borderRadius:
                "6px",
            }}
          >
            <strong>
              Selected Supplier:
            </strong>{" "}
            {selectedSupplier.name}

            <br />

            📱{" "}
            {selectedSupplier.mobile ||
              selectedSupplier.whatsapp ||
              "-"}

            <div
              style={{
                marginTop: "10px",
              }}
            >
              <button
                onClick={() =>
                  editSupplier(
                    selectedSupplier
                  )
                }
                style={{
                  ...buttonStyle,
                  background:
                    "#eee",
                }}
              >
                ✏️ Edit
              </button>

              <button
                onClick={() =>
                  openWhatsApp(
                    selectedSupplier
                  )
                }
                style={{
                  ...buttonStyle,
                  background:
                    "#eee",
                }}
              >
                📱 WhatsApp
              </button>

              <button
                onClick={() =>
                  deleteSupplier(
                    selectedSupplier
                  )
                }
                style={{
                  ...buttonStyle,
                  background:
                    "#eee",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          SUPPLIER DETAILS
      ================================================= */}

      <div
        style={{
          border:
            "1px solid #ddd",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>
          Supplier Details
        </h3>

        <input
          type="text"
          placeholder="Supplier Name"
          value={name}
          onChange={(e) =>
            handleSupplierNameChange(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          maxLength={10}
          onChange={(e) =>
            setMobile(
              cleanMobileNumber(
                e.target.value
              )
            )
          }
          style={inputStyle}
        />

        {editingSupplierId && (
          <div
            style={{
              padding: "8px",
              background:
                "#fff3cd",
              borderRadius:
                "5px",
              marginBottom:
                "10px",
            }}
          >
            ✏️ Supplier Edit Mode
          </div>
        )}
      </div>

      {/* =================================================
          MEDICINE
      ================================================= */}

      <div
        style={{
          border:
            "1px solid #ddd",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>
          💊 Medicine Details
        </h3>

        <div
          style={{
            position:
              "relative",
          }}
        >
          <input
            type="text"
            placeholder="Medicine Name Search"
            value={medicine}
            onChange={(e) =>
              handleMedicineSearch(
                e.target.value
              )
            }
            onFocus={() =>
              setShowMedicineList(true)
            }
            style={inputStyle}
          />

          {showMedicineList &&
            filteredMedicines.length >
              0 && (
              <div
                style={{
                  position:
                    "absolute",
                  left: 0,
                  right: 0,
                  top: "48px",
                  background:
                    "#fff",
                  border:
                    "1px solid #ccc",
                  zIndex: 9999,
                  maxHeight:
                    "250px",
                  overflowY:
                    "auto",
                }}
              >
                {filteredMedicines.map(
                  (item, index) => (
                    <div
                      key={
                        item.id ||
                        index
                      }
                      onMouseDown={() =>
                        selectMedicine(
                          item
                        )
                      }
                      style={{
                        padding:
                          "11px",
                        cursor:
                          "pointer",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <strong>
                        {
                          item.medicine
                        }
                      </strong>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#666",
                          marginTop:
                            "3px",
                        }}
                      >
                        {item.company ||
                          "-"}

                        {" • "}

                        {item.supplier ||
                          "-"}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          marginTop:
                            "3px",
                        }}
                      >
                        Purchase: ₹
                        {item.purchaseRate ||
                          "-"}{" "}
                        | MRP: ₹
                        {item.mrp ||
                          "-"}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
        </div>

        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) =>
            setCompany(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Barcode"
          value={barcode}
          onChange={(e) =>
            setBarcode(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Purchase Rate"
          value={purchaseRate}
          onChange={(e) =>
            setPurchaseRate(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="MRP"
          value={mrp}
          onChange={(e) =>
            setMrp(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Sale Rate"
          value={saleRate}
          onChange={(e) =>
            setSaleRate(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <select
          value={gstType}
          onChange={(e) => {
            setGstType(
              e.target.value
            );

            localStorage.setItem(
              "purchaseGST",
              e.target.value
            );
          }}
          style={inputStyle}
        >
          <option value="+5">
            +5% GST
          </option>

          <option value="+18">
            +18% GST
          </option>

          <option value="-3">
            -3%
          </option>

          <option value="+5-3">
            +5% - 3%
          </option>
        </select>

        <input
          type="date"
          value={expiry}
          onChange={(e) =>
            setExpiry(
              e.target.value
            )
          }
          style={inputStyle}
        />
      </div>

      {/* =================================================
          PREVIOUS RATES
      ================================================= */}

      {medicine.trim() &&
        previousRates.length >
          0 && (
          <div
            style={{
              border:
                "1px solid #ddd",
              padding: "15px",
              borderRadius:
                "8px",
              marginBottom:
                "20px",
            }}
          >
            <h3>
              💰 Previous Purchase Rates
            </h3>

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
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Supplier
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Purchase Rate
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      MRP
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {previousRates
                    .slice(0, 10)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.id ||
                            index
                          }
                        >
                          <td
                            style={{
                              border:
                                "1px solid #ddd",
                              padding:
                                "8px",
                            }}
                          >
                            {
                              item.supplier
                            }
                          </td>

                          <td
                            style={{
                              border:
                                "1px solid #ddd",
                              padding:
                                "8px",
                            }}
                          >
                            ₹
                            {
                              item.purchaseRate ||
                              "-"
                            }
                          </td>

                          <td
                            style={{
                              border:
                                "1px solid #ddd",
                              padding:
                                "8px",
                            }}
                          >
                            ₹
                            {
                              item.mrp ||
                              "-"
                            }
                          </td>

                          <td
                            style={{
                              border:
                                "1px solid #ddd",
                              padding:
                                "8px",
                            }}
                          >
                            {formatDate(
                              item.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* =================================================
          SAVE BUTTONS
      ================================================= */}

      <div
        style={{
          marginBottom:
            "25px",
        }}
      >
        <button
          onClick={saveSupplier}
          style={{
            ...buttonStyle,
            background:
              "#eee",
            fontWeight:
              "bold",
          }}
        >
          💾{" "}
          {editingSupplierId
            ? "Update Supplier + Medicine"
            : "Save Supplier + Medicine"}
        </button>

        <button
          onClick={clearForm}
          style={{
            ...buttonStyle,
            background:
              "#eee",
          }}
        >
          🧹 Clear
        </button>

        <button
          onClick={goBack}
          style={{
            ...buttonStyle,
            background:
              "#eee",
          }}
        >
          ⬅️ Back
        </button>
      </div>

      {/* =================================================
          SELECTED SUPPLIER MEDICINES
      ================================================= */}

      {selectedSupplier && (
        <div
          style={{
            border:
              "1px solid #ddd",
            padding: "15px",
            borderRadius:
              "8px",
            marginBottom:
              "20px",
          }}
        >
          <h3>
            💊{" "}
            {selectedSupplier.name}
            {" "}की Medicines
          </h3>

          {selectedSupplierHistory.length ===
          0 ? (
            <p>
              इस supplier की medicine
              history अभी नहीं है।
            </p>
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
                    "750px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Medicine
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Company
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Purchase Rate
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      MRP
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Sale Rate
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      GST
                    </th>

                    <th
                      style={{
                        border:
                          "1px solid #ddd",
                        padding:
                          "8px",
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedSupplierHistory.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={
                          item.id ||
                          index
                        }
                        onDoubleClick={() =>
                          selectMedicine(
                            item
                          )
                        }
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >
                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {
                            item.medicine
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {
                            item.company ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          ₹
                          {
                            item.purchaseRate ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          ₹
                          {
                            item.mrp ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          ₹
                          {
                            item.saleRate ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {
                            item.gstType ||
                            "-"
                          }
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {formatDate(
                            item.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              <p
                style={{
                  fontSize:
                    "12px",
                  color:
                    "#666",
                  marginTop:
                    "8px",
                }}
              >
                💡 किसी medicine पर
                double-click करके
                उसे ऊपर form में load
                कर सकते हैं।
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          ALL SUPPLIERS
      ================================================= */}

      <div
        style={{
          border:
            "1px solid #ddd",
          padding: "15px",
          borderRadius:
            "8px",
        }}
      >
        <h3>
          📋 All Suppliers (
          {filteredSuppliers.length}
          )
        </h3>

        {filteredSuppliers.length ===
        0 ? (
          <p>
            कोई supplier नहीं मिला।
          </p>
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
                  "600px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border:
                        "1px solid #ddd",
                      padding:
                        "8px",
                    }}
                  >
                    Supplier
                  </th>

                  <th
                    style={{
                      border:
                        "1px solid #ddd",
                      padding:
                        "8px",
                    }}
                  >
                    Mobile
                  </th>

                  <th
                    style={{
                      border:
                        "1px solid #ddd",
                      padding:
                        "8px",
                    }}
                  >
                    Medicines
                  </th>

                  <th
                    style={{
                      border:
                        "1px solid #ddd",
                      padding:
                        "8px",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map(
                  (
                    supplier,
                    index
                  ) => {
                    const medicineCount =
                      medicineMaster.filter(
                        (item) =>
                          normalizeText(
                            item.supplier
                          ) ===
                          normalizeText(
                            supplier.name
                          )
                      ).length;

                    return (
                      <tr
                        key={
                          supplier.id ||
                          index
                        }
                      >
                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          <strong>
                            {
                              supplier.name
                            }
                          </strong>
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {supplier.mobile ||
                            supplier.whatsapp ||
                            "-"}
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          {medicineCount}
                        </td>

                        <td
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                          }}
                        >
                          <button
                            onClick={() =>
                              selectSupplier(
                                supplier
                              )
                            }
                            style={{
                              ...buttonStyle,
                              background:
                                "#eee",
                            }}
                          >
                            👁️ Open
                          </button>

                          <button
                            onClick={() =>
                              openWhatsApp(
                                supplier
                              )
                            }
                            style={{
                              ...buttonStyle,
                              background:
                                "#eee",
                            }}
                          >
                            📱
                          </button>
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

export default Supplier;