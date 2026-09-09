import React, { useEffect, useMemo, useState } from "react";

function PurchaseScheme({ stock, setStock, goBack }) {
  // =========================================================
  // FORM
  // =========================================================

  const [medicine, setMedicine] = useState("");
  const [company, setCompany] = useState("");
  const [batch, setBatch] = useState("");
  const [barcode, setBarcode] = useState("");

  const [supplier, setSupplier] = useState("");
  const [supplierMobile, setSupplierMobile] = useState("");

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("STRIP");

  const [purchaseRate, setPurchaseRate] = useState("");

  const [gstType, setGstType] = useState("0");
  const [schemePercent, setSchemePercent] = useState("");
  const [divideBy, setDivideBy] = useState("");
  const [marginPercent, setMarginPercent] = useState("");

  const [mrp, setMrp] = useState("");
  const [saleRate, setSaleRate] = useState("");
  const [expiry, setExpiry] = useState("");

  // =========================================================
  // SEARCH
  // =========================================================

  const [medicineSearch, setMedicineSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const [medicineHighlight, setMedicineHighlight] = useState(-1);
  const [supplierHighlight, setSupplierHighlight] = useState(-1);

  // =========================================================
  // MESSAGE
  // =========================================================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================================================
  // SCANNER
  // =========================================================

  const [scannerItems, setScannerItems] = useState([]);
  const [scannerLoaded, setScannerLoaded] = useState(false);

  // =========================================================
  // CURRENT STOCK
  // =========================================================

  const currentStock = useMemo(
    () => (Array.isArray(stock) ? stock : []),
    [stock]
  );

  // =========================================================
  // HELPERS
  // =========================================================

  const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (value) => num(value).toFixed(2);

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const cleanMobile = (value) =>
    String(value || "")
      .replace(/\D/g, "")
      .slice(-10);

  const makeId = () =>
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  const todayDate = new Date()
    .toISOString()
    .split("T")[0];

  const currentTime = new Date().toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );

  // =========================================================
  // LOAD SCANNER
  // =========================================================

  const loadScannerItems = () => {
    try {
      let saved = [];

      const primary = localStorage.getItem(
        "billScannerPurchaseItems"
      );

      if (primary) {
        saved = JSON.parse(primary);
      }

      if (!Array.isArray(saved) || saved.length === 0) {
        const fallback = localStorage.getItem(
          "billScannerItems"
        );

        saved = fallback
          ? JSON.parse(fallback)
          : [];
      }

      if (Array.isArray(saved) && saved.length > 0) {
        setScannerItems(saved);
        setScannerLoaded(true);
        return saved;
      }
    } catch (error) {
      console.error("Scanner load error:", error);
    }

    setScannerItems([]);
    setScannerLoaded(false);
    return [];
  };

  // =========================================================
  // APPLY SCANNER ENTRY
  // =========================================================

  const applyScannedItem = (item) => {
    if (!item) return;

    console.log("=================================");
    console.log("USE ENTRY CLICKED");
    console.log("SCANNER ITEM:", item);
    console.log("=================================");

    const med =
      item.medicine ||
      item.medicineName ||
      item.name ||
      "";

    const sup =
      item.supplier ||
      item.supplierName ||
      "";

    const rate =
      item.purchaseRate ??
      item.rate ??
      item.basePurchaseRate ??
      "";

    setMedicine(String(med));
    setMedicineSearch("");
    setMedicineHighlight(-1);

    setCompany(
      item.company ||
        item.companyName ||
        ""
    );

    setSupplier(String(sup));
    setSupplierSearch("");
    setSupplierHighlight(-1);

    setSupplierMobile(
      cleanMobile(
        item.supplierMobile ||
          item.mobile ||
          ""
      )
    );

    if (
      item.quantity !== undefined &&
      item.quantity !== ""
    ) {
      setQuantity(item.quantity);
    } else if (
      item.qty !== undefined &&
      item.qty !== ""
    ) {
      setQuantity(item.qty);
    }

    if (item.unit) {
      const incomingUnit =
        String(item.unit).toUpperCase();

      if (
        ["STRIP", "KG", "PCS"].includes(
          incomingUnit
        )
      ) {
        setUnit(incomingUnit);
      }
    }

    if (rate !== "") {
      setPurchaseRate(rate);
    }

    setBatch(
      item.batch ??
        item.batchNo ??
        ""
    );

    setBarcode(
      item.barcode ??
        ""
    );

    setMrp(
      item.mrp ??
        ""
    );

    setSaleRate(
      item.saleRate ??
        ""
    );

    setExpiry(
      item.expiry ??
        ""
    );

    // =======================================================
    // GST
    // =======================================================

    let incomingGST =
      item.gstType ??
      "";

    if (
      incomingGST === 5 ||
      incomingGST === "5"
    ) {
      incomingGST = "+5";
    }

    if (
      incomingGST === 18 ||
      incomingGST === "18"
    ) {
      incomingGST = "+18";
    }

    if (
      incomingGST === -3 ||
      incomingGST === "-3"
    ) {
      incomingGST = "-3";
    }

    if (
      incomingGST === 0 ||
      incomingGST === "0"
    ) {
      incomingGST = "0";
    }

    if (
      [
        "0",
        "-3",
        "+5",
        "+18",
        "+5-3",
      ].includes(String(incomingGST))
    ) {
      setGstType(String(incomingGST));
    }

    setSchemePercent(
      item.schemePercent ??
        ""
    );

    setDivideBy(
      item.divideBy ??
        ""
    );

    setMarginPercent(
      item.marginPercent ??
        ""
    );

    setMessage(
      `📦 Scanner Entry loaded: ${med}`
    );

    setMessageType("success");

    // ऊपर form पर scroll
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  // =========================================================
  // FIRST SCANNER ENTRY
  // =========================================================

  const applyFirstScannedItem = (items) => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return;
    }

    const first =
      items.find(
        (item) =>
          !item?.saved &&
          !item?.processed
      ) || items[0];

    applyScannedItem(first);
  };

  // =========================================================
  // SCANNER INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const items = loadScannerItems();

    if (items.length > 0) {
      applyFirstScannedItem(items);
    }
  }, []);

  // =========================================================
  // SCANNER EVENTS
  // =========================================================

  useEffect(() => {
    const handleScannerReady = () => {
      const items = loadScannerItems();

      if (items.length > 0) {
        applyFirstScannedItem(items);
      }
    };

    window.addEventListener(
      "billScannerPurchaseReady",
      handleScannerReady
    );

    window.addEventListener(
      "billScannerUpdated",
      handleScannerReady
    );

    return () => {
      window.removeEventListener(
        "billScannerPurchaseReady",
        handleScannerReady
      );

      window.removeEventListener(
        "billScannerUpdated",
        handleScannerReady
      );
    };
  }, []);

  // =========================================================
  // MEDICINE SEARCH
  // =========================================================

  const medicineSuggestions = useMemo(() => {
    const map = new Map();

    currentStock.forEach((item) => {
      const name =
        item?.medicine ||
        item?.name ||
        "";

      if (!name) return;

      const key = normalize(name);

      if (!map.has(key)) {
        map.set(key, {
          medicine: name,
          company:
            item?.company ||
            "",
        });
      }
    });

    scannerItems.forEach((item) => {
      const name =
        item?.medicine ||
        item?.medicineName ||
        item?.name ||
        "";

      if (!name) return;

      const key = normalize(name);

      if (!map.has(key)) {
        map.set(key, {
          medicine: name,
          company:
            item?.company ||
            "",
        });
      }
    });

    try {
      const master = JSON.parse(
        localStorage.getItem(
          "medicineMaster"
        ) || "[]"
      );

      if (Array.isArray(master)) {
        master.forEach((item) => {
          const name =
            item?.medicine ||
            item?.name ||
            "";

          if (!name) return;

          const key =
            normalize(name);

          if (!map.has(key)) {
            map.set(key, {
              medicine: name,
              company:
                item?.company ||
                "",
            });
          }
        });
      }
    } catch (e) {}

    let list =
      Array.from(map.values());

    const search =
      medicineSearch
        .trim()
        .toLowerCase();

    if (search.length >= 2) {
      list = list.filter(
        (item) =>
          String(
            item.medicine
          )
            .toLowerCase()
            .includes(search)
      );
    }

    return list.slice(0, 10);
  }, [
    currentStock,
    scannerItems,
    medicineSearch,
  ]);

  // =========================================================
  // SUPPLIER SEARCH
  // =========================================================

  const supplierSuggestions = useMemo(() => {
    const map = new Map();

    currentStock.forEach((item) => {
      const name =
        item?.supplier ||
        item?.supplierName ||
        "";

      if (!name) return;

      const key = normalize(name);

      if (!map.has(key)) {
        map.set(key, {
          supplier: name,
          mobile:
            item?.supplierMobile ||
            "",
        });
      }
    });

    scannerItems.forEach((item) => {
      const name =
        item?.supplier ||
        item?.supplierName ||
        "";

      if (!name) return;

      const key = normalize(name);

      if (!map.has(key)) {
        map.set(key, {
          supplier: name,
          mobile:
            item?.supplierMobile ||
            item?.mobile ||
            "",
        });
      }
    });

    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "suppliers"
        ) || "[]"
      );

      if (Array.isArray(saved)) {
        saved.forEach((item) => {
          const name =
            item?.supplier ||
            item?.supplierName ||
            item?.name ||
            "";

          if (!name) return;

          const key =
            normalize(name);

          if (!map.has(key)) {
            map.set(key, {
              supplier: name,
              mobile:
                item?.mobile ||
                item?.supplierMobile ||
                "",
            });
          }
        });
      }
    } catch (e) {}

    let list =
      Array.from(map.values());

    const search =
      supplierSearch
        .trim()
        .toLowerCase();

    if (search.length >= 2) {
      list = list.filter(
        (item) =>
          String(
            item.supplier
          )
            .toLowerCase()
            .includes(search)
      );
    }

    return list.slice(0, 10);
  }, [
    currentStock,
    scannerItems,
    supplierSearch,
  ]);

  // =========================================================
  // SELECT MEDICINE
  // =========================================================

  const selectMedicine = (item) => {
    setMedicine(
      item?.medicine || ""
    );

    setCompany(
      item?.company || ""
    );

    setMedicineSearch("");
    setMedicineHighlight(-1);
  };

  // =========================================================
  // SELECT SUPPLIER
  // =========================================================

  const selectSupplier = (item) => {
    setSupplier(
      item?.supplier || ""
    );

    setSupplierMobile(
      cleanMobile(
        item?.mobile || ""
      )
    );

    setSupplierSearch("");
    setSupplierHighlight(-1);
  };

  // =========================================================
  // MEDICINE KEYBOARD
  // =========================================================

  const handleMedicineKeyDown = (e) => {
    if (
      medicineSearch.trim()
        .length < 2
    ) {
      return;
    }

    if (
      e.key === "ArrowDown" &&
      medicineSuggestions.length
    ) {
      e.preventDefault();

      setMedicineHighlight(
        (prev) =>
          prev <
          medicineSuggestions.length - 1
            ? prev + 1
            : 0
      );
    }

    if (
      e.key === "ArrowUp" &&
      medicineSuggestions.length
    ) {
      e.preventDefault();

      setMedicineHighlight(
        (prev) =>
          prev > 0
            ? prev - 1
            : medicineSuggestions.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (
        medicineHighlight >= 0 &&
        medicineSuggestions[
          medicineHighlight
        ]
      ) {
        selectMedicine(
          medicineSuggestions[
            medicineHighlight
          ]
        );
      } else if (
        medicineSuggestions.length === 1
      ) {
        selectMedicine(
          medicineSuggestions[0]
        );
      }
    }

    if (e.key === "Escape") {
      setMedicineSearch("");
      setMedicineHighlight(-1);
    }
  };

  // =========================================================
  // SUPPLIER KEYBOARD
  // =========================================================

  const handleSupplierKeyDown = (e) => {
    if (
      supplierSearch.trim()
        .length < 2
    ) {
      return;
    }

    if (
      e.key === "ArrowDown" &&
      supplierSuggestions.length
    ) {
      e.preventDefault();

      setSupplierHighlight(
        (prev) =>
          prev <
          supplierSuggestions.length - 1
            ? prev + 1
            : 0
      );
    }

    if (
      e.key === "ArrowUp" &&
      supplierSuggestions.length
    ) {
      e.preventDefault();

      setSupplierHighlight(
        (prev) =>
          prev > 0
            ? prev - 1
            : supplierSuggestions.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (
        supplierHighlight >= 0 &&
        supplierSuggestions[
          supplierHighlight
        ]
      ) {
        selectSupplier(
          supplierSuggestions[
            supplierHighlight
          ]
        );
      } else if (
        supplierSuggestions.length === 1
      ) {
        selectSupplier(
          supplierSuggestions[0]
        );
      }
    }

    if (e.key === "Escape") {
      setSupplierSearch("");
      setSupplierHighlight(-1);
    }
  };

  // =========================================================
  // CALCULATION
  // =========================================================

  const calculation = useMemo(() => {
    const base =
      num(purchaseRate);

    let afterGST = base;
    let gstAmount = 0;

    if (gstType === "-3") {
      gstAmount =
        -(base * 3) / 100;

      afterGST =
        base + gstAmount;
    }

    if (gstType === "+5") {
      gstAmount =
        (base * 5) / 100;

      afterGST =
        base + gstAmount;
    }

    if (gstType === "+18") {
      gstAmount =
        (base * 18) / 100;

      afterGST =
        base + gstAmount;
    }

    if (gstType === "+5-3") {
      const plus5 =
        (base * 5) / 100;

      const rateAfter5 =
        base + plus5;

      const minus3 =
        (rateAfter5 * 3) / 100;

      gstAmount =
        plus5 - minus3;

      afterGST =
        rateAfter5 - minus3;
    }

    const scheme =
      num(schemePercent);

    const schemeAmount =
      (afterGST * scheme) / 100;

    const afterScheme =
      afterGST -
      schemeAmount;

    const divider =
      num(divideBy);

    const netRate =
      divider > 0
        ? afterScheme / divider
        : afterScheme;

    const margin =
      num(marginPercent);

    const marginAmount =
      (netRate * margin) / 100;

    const marginSaleRate =
      netRate + marginAmount;

    const qty =
      num(quantity);

    const totalPurchase =
      netRate * qty;

    return {
      base,
      gstAmount,
      afterGST,
      schemeAmount,
      afterScheme,
      netRate,
      marginAmount,
      marginSaleRate,
      totalPurchase,
    };
  }, [
    purchaseRate,
    gstType,
    schemePercent,
    divideBy,
    marginPercent,
    quantity,
  ]);

  // =========================================================
  // PURCHASE HISTORY
  // =========================================================

  const purchaseHistory = useMemo(() => {
    let history = [];

    try {
      history = JSON.parse(
        localStorage.getItem(
          "purchaseHistory"
        ) || "[]"
      );
    } catch (e) {
      history = [];
    }

    if (!Array.isArray(history)) {
      return [];
    }

    const searchName =
      medicine
        .trim()
        .toLowerCase();

    if (!searchName) {
      return [];
    }

    return history
      .filter((item) => {
        const itemName =
          String(
            item?.medicine ||
              item?.name ||
              ""
          )
            .trim()
            .toLowerCase();

        return (
          itemName ===
          searchName
        );
      })
      .sort((a, b) => {
        const da =
          a?.createdAt ||
          a?.purchaseDate ||
          a?.date ||
          "";

        const db =
          b?.createdAt ||
          b?.purchaseDate ||
          b?.date ||
          "";

        return String(db).localeCompare(
          String(da)
        );
      });
  }, [medicine]);

  // =========================================================
  // APPLY HISTORY RATE
  // =========================================================

  const applyHistoryRate = (item) => {
    if (!item) return;

    setPurchaseRate(
      item.basePurchaseRate ??
        item.purchaseRate ??
        item.rate ??
        ""
    );

    setGstType(
      item.gstType || "0"
    );

    setSchemePercent(
      item.schemePercent ??
        ""
    );

    setDivideBy(
      item.divideBy ??
        ""
    );

    setMarginPercent(
      item.marginPercent ??
        ""
    );

    setMrp(
      item.mrp ??
        ""
    );

    setSaleRate(
      item.saleRate ??
        ""
    );

    setCompany(
      item.company ||
        ""
    );

    setSupplier(
      item.supplier ||
        item.supplierName ||
        ""
    );

    setSupplierMobile(
      cleanMobile(
        item.supplierMobile ||
          ""
      )
    );

    setBatch(
      item.batch ||
        item.batchNo ||
        ""
    );

    setBarcode(
      item.barcode ||
        ""
    );

    setMessage(
      "पुराना Rate और Scheme form में भर दिया गया है।"
    );

    setMessageType("success");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // SAVE SUPPLIER
  // =========================================================

  const saveSupplier = () => {
    const name =
      supplier.trim();

    if (!name) return;

    let suppliers = [];

    try {
      suppliers = JSON.parse(
        localStorage.getItem(
          "suppliers"
        ) || "[]"
      );
    } catch (e) {
      suppliers = [];
    }

    if (!Array.isArray(suppliers)) {
      suppliers = [];
    }

    const mobile =
      cleanMobile(
        supplierMobile
      );

    const index =
      suppliers.findIndex(
        (item) =>
          normalize(
            item?.supplier ||
              item?.supplierName ||
              item?.name ||
              ""
          ) ===
          normalize(name)
      );

    const data = {
      supplier: name,
      supplierName: name,
      name,
      mobile,
      supplierMobile: mobile,
      updatedAt:
        new Date().toISOString(),
    };

    if (index >= 0) {
      suppliers[index] = {
        ...suppliers[index],
        ...data,
      };
    } else {
      suppliers.push({
        id: makeId(),
        ...data,
        createdAt:
          new Date().toISOString(),
      });
    }

    localStorage.setItem(
      "suppliers",
      JSON.stringify(
        suppliers
      )
    );
  };

  // =========================================================
  // MEDICINE MASTER
  // =========================================================

  const saveMedicineMaster = () => {
    const name =
      medicine.trim();

    if (!name) return;

    let master = [];

    try {
      master = JSON.parse(
        localStorage.getItem(
          "medicineMaster"
        ) || "[]"
      );
    } catch (e) {
      master = [];
    }

    if (!Array.isArray(master)) {
      master = [];
    }

    const index =
      master.findIndex(
        (item) =>
          normalize(
            item?.medicine ||
              item?.name ||
              ""
          ) ===
          normalize(name)
      );

    const data = {
      medicine: name,
      name,
      company:
        company.trim(),
      updatedAt:
        new Date().toISOString(),
    };

    if (index >= 0) {
      master[index] = {
        ...master[index],
        ...data,
      };
    } else {
      master.push({
        id: makeId(),
        ...data,
        createdAt:
          new Date().toISOString(),
      });
    }

    localStorage.setItem(
      "medicineMaster",
      JSON.stringify(
        master
      )
    );
  };

  // =========================================================
  // MARK SCANNER SAVED
  // =========================================================

  const markScannerItemSaved = () => {
    const med =
      normalize(medicine);

    if (!med) return;

    setScannerItems((prev) => {
      if (!Array.isArray(prev)) {
        return [];
      }

      let changed = false;

      const updated =
        prev.map((item) => {
          const itemMed =
            normalize(
              item?.medicine ||
                item?.medicineName ||
                item?.name ||
                ""
            );

          if (
            !changed &&
            itemMed === med &&
            !item?.saved
          ) {
            changed = true;

            return {
              ...item,
              saved: true,
              processed: true,
              savedAt:
                new Date().toISOString(),
            };
          }

          return item;
        });

      localStorage.setItem(
        "billScannerPurchaseItems",
        JSON.stringify(updated)
      );

      localStorage.setItem(
        "billScannerItems",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // =========================================================
  // SAVE PURCHASE
  // =========================================================

  const savePurchase = () => {
    setMessage("");
    setMessageType("");

    const med =
      medicine.trim();

    const sup =
      supplier.trim();

    const qty =
      num(quantity);

    const baseRate =
      num(purchaseRate);

    const mrpValue =
      num(mrp);

    const saleValue =
      num(saleRate);

    if (!med) {
      setMessage(
        "Medicine name डालें।"
      );
      setMessageType("error");
      return;
    }

    if (!sup) {
      setMessage(
        "Supplier name डालें।"
      );
      setMessageType("error");
      return;
    }

    if (qty <= 0) {
      setMessage(
        "Quantity सही डालें।"
      );
      setMessageType("error");
      return;
    }

    if (baseRate <= 0) {
      setMessage(
        "Purchase Rate सही डालें।"
      );
      setMessageType("error");
      return;
    }

    if (
      mrpValue > 0 &&
      saleValue > mrpValue
    ) {
      setMessage(
        "Sale Rate MRP से ज्यादा नहीं हो सकता।"
      );
      setMessageType("error");
      return;
    }

    if (
      num(divideBy) < 0
    ) {
      setMessage(
        "Divide By सही डालें।"
      );
      setMessageType("error");
      return;
    }

    if (
      calculation.netRate <= 0
    ) {
      setMessage(
        "Net Rate सही नहीं है।"
      );
      setMessageType("error");
      return;
    }

    // =======================================================
    // GST PERCENT
    // =======================================================

    let gstPercent = 0;

    if (gstType === "-3") {
      gstPercent = -3;
    } else if (gstType === "+5") {
      gstPercent = 5;
    } else if (gstType === "+18") {
      gstPercent = 18;
    } else if (gstType === "+5-3") {
      gstPercent = 2;
    }

    // =======================================================
    // PURCHASE RECORD
    // =======================================================

    const purchaseRecord = {
      id: makeId(),

      medicine: med,
      name: med,

      company:
        company.trim(),

      supplier: sup,
      supplierName: sup,

      supplierMobile:
        cleanMobile(
          supplierMobile
        ),

      quantity: qty,
      qty,
      unit,

      batch:
        batch.trim(),

      batchNo:
        batch.trim(),

      barcode:
        barcode.trim(),

      basePurchaseRate:
        baseRate,

      gstType,

      gstPercent,

      gstAmountPerItem:
        calculation.gstAmount,

      purchaseRateWithGST:
        calculation.afterGST,

      schemePercent:
        num(schemePercent),

      schemeAmountPerItem:
        calculation.schemeAmount,

      divideBy:
        num(divideBy),

      marginPercent:
        num(marginPercent),

      marginAmountPerItem:
        calculation.marginAmount,

      saleRateFromMargin:
        calculation.marginSaleRate,

      netPurchaseRate:
        calculation.netRate,

      purchaseRate:
        calculation.netRate,

      rate:
        calculation.netRate,

      mrp:
        mrpValue,

      saleRate:
        saleValue,

      purchaseAmount:
        calculation.totalPurchase,

      expiry:
        expiry || "",

      purchaseDate:
        todayDate,

      date:
        todayDate,

      purchaseTime:
        currentTime,

      createdAt:
        new Date().toISOString(),

      source:
        scannerLoaded
          ? "billScanner-purchaseScheme"
          : "purchaseScheme",
    };

    // =======================================================
    // OLD STOCK
    // =======================================================

    const oldStock =
      Array.isArray(stock)
        ? [...stock]
        : [];

    let existingIndex = -1;

    // =======================================================
    // BARCODE MATCH
    // =======================================================

    if (barcode.trim()) {
      existingIndex =
        oldStock.findIndex(
          (item) =>
            String(
              item?.barcode ||
                ""
            ).trim() ===
            barcode.trim()
        );
    }

    // =======================================================
    // MEDICINE + BATCH MATCH
    // =======================================================

    if (existingIndex < 0) {
      existingIndex =
        oldStock.findIndex(
          (item) => {
            const oldMedicine =
              normalize(
                item?.medicine ||
                  item?.name ||
                  ""
              );

            const oldBatch =
              normalize(
                item?.batch ||
                  item?.batchNo ||
                  ""
              );

            return (
              oldMedicine ===
                normalize(med) &&
              oldBatch ===
                normalize(batch)
            );
          }
        );
    }

    let updatedStock;

    // =======================================================
    // MERGE
    // =======================================================

    if (existingIndex >= 0) {
      const oldItem =
        oldStock[
          existingIndex
        ];

      const oldQty =
        num(
          oldItem.quantity
        );

      const oldRate =
        num(
          oldItem.purchaseRate ??
            oldItem.purchase_rate ??
            oldItem.rate
        );

      const newQty =
        oldQty + qty;

      const weightedRate =
        newQty > 0
          ? (
              oldQty *
                oldRate +
              qty *
                calculation.netRate
            ) /
            newQty
          : calculation.netRate;

      updatedStock =
        [...oldStock];

      updatedStock[
        existingIndex
      ] = {
        ...oldItem,
        ...purchaseRecord,

        id:
          oldItem.id ||
          purchaseRecord.id,

        quantity:
          newQty,

        qty:
          newQty,

        purchaseRate:
          weightedRate,

        rate:
          weightedRate,

        netPurchaseRate:
          weightedRate,

        purchaseAmount:
          newQty *
          weightedRate,

        updatedAt:
          new Date().toISOString(),
      };
    } else {
      updatedStock = [
        ...oldStock,
        purchaseRecord,
      ];
    }

    // =======================================================
    // SAVE STOCK
    // =======================================================

    localStorage.setItem(
      "stock",
      JSON.stringify(
        updatedStock
      )
    );

    if (
      typeof setStock ===
      "function"
    ) {
      setStock(
        updatedStock
      );
    }

    // =======================================================
    // PURCHASE HISTORY
    // =======================================================

    let history = [];

    try {
      history = JSON.parse(
        localStorage.getItem(
          "purchaseHistory"
        ) || "[]"
      );
    } catch (e) {
      history = [];
    }

    if (!Array.isArray(history)) {
      history = [];
    }

    history.push(
      purchaseRecord
    );

    localStorage.setItem(
      "purchaseHistory",
      JSON.stringify(
        history
      )
    );

    saveSupplier();
    saveMedicineMaster();

    // =======================================================
    // EVENTS
    // =======================================================

    const stamp =
      Date.now().toString();

    localStorage.setItem(
      "stockUpdatedAt",
      stamp
    );

    localStorage.setItem(
      "purchaseUpdatedAt",
      stamp
    );

    localStorage.setItem(
      "supplierUpdatedAt",
      stamp
    );

    window.dispatchEvent(
      new Event(
        "stockUpdated"
      )
    );

    window.dispatchEvent(
      new Event(
        "purchaseUpdated"
      )
    );

    window.dispatchEvent(
      new Event(
        "supplierUpdated"
      )
    );

    window.dispatchEvent(
      new Event(
        "medicineMasterUpdated"
      )
    );

    if (scannerLoaded) {
      markScannerItemSaved();
    }

    setMessage(
      `✅ Purchase Save हो गया | ${qty} ${unit} | Net Rate ₹ ${money(
        calculation.netRate
      )}`
    );

    setMessageType("success");

    setQuantity("");
    setPurchaseRate("");
    setSchemePercent("");
    setDivideBy("");
    setMarginPercent("");
    setBatch("");
    setBarcode("");
    setMrp("");
    setSaleRate("");
    setExpiry("");
  };

  // =========================================================
  // NEXT SCANNER
  // =========================================================

  const loadNextScannerItem = () => {
    const next =
      scannerItems.find(
        (item) =>
          !item?.saved &&
          !item?.processed
      );

    if (!next) {
      setMessage(
        "✅ सभी scanned entries process हो चुकी हैं।"
      );
      setMessageType("success");
      return;
    }

    applyScannedItem(next);
  };

  // =========================================================
  // CLEAR SCANNER
  // =========================================================

  const clearScannerQueue = () => {
    setScannerItems([]);
    setScannerLoaded(false);

    localStorage.removeItem(
      "billScannerItems"
    );

    localStorage.removeItem(
      "billScannerPurchaseItems"
    );

    localStorage.removeItem(
      "billScannerOCRText"
    );

    localStorage.setItem(
      "billScannerPurchaseReady",
      "false"
    );

    localStorage.setItem(
      "billScannerLoadedIntoPurchase",
      "false"
    );

    setMessage(
      "Scanner entries clear हो गईं।"
    );

    setMessageType("success");
  };

  // =========================================================
  // ESC BACK
  // =========================================================

  useEffect(() => {
    const handleKey = (e) => {
      if (
        e.key === "Escape" &&
        typeof goBack ===
          "function"
      ) {
        goBack();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [goBack]);

  // =========================================================
  // STYLES
  // =========================================================

  const page = {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "20px",
    boxSizing: "border-box",
  };

  const container = {
    maxWidth: "1250px",
    margin: "0 auto",
  };

  const card = {
    background: "#fff",
    borderRadius: "15px",
    padding: "18px",
    marginBottom: "16px",
    boxShadow:
      "0 5px 18px rgba(30,60,90,.08)",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(200px,1fr))",
    gap: "14px",
  };

  const field = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const label = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#526579",
  };

  const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border:
      "1px solid #d4dde7",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
  };

  const select = {
    ...input,
    background: "#fff",
  };

  const suggestion = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    background: "#fff",
    border:
      "1px solid #d5dde7",
    borderRadius: "8px",
    boxShadow:
      "0 8px 20px rgba(0,0,0,.12)",
    zIndex: 9999,
    maxHeight: "220px",
    overflowY: "auto",
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div style={page}>
      <div style={container}>

        {/* HEADER */}

        <div
          style={{
            ...card,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#17324d",
              }}
            >
              🧾 Purchase Scheme
            </h2>

            <div
              style={{
                marginTop: "5px",
                fontSize: "12px",
                color: "#667085",
              }}
            >
              Smart Purchase + GST + Scheme + Divide + Bill Scanner
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                typeof goBack ===
                "function"
              ) {
                goBack();
              }
            }}
            style={{
              border: "none",
              background: "#17324d",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "9px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ← Back
          </button>
        </div>

        {/* =====================================================
            SCANNER ENTRIES
        ===================================================== */}

        {scannerItems.length > 0 && (
          <div
            style={{
              ...card,
              position: "relative",
              zIndex: 100,
              isolation: "isolate",
              pointerEvents: "auto",
              border:
                "2px solid #7e57c2",
              background:
                "#faf7ff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin:
                      "0 0 5px 0",
                    color: "#5e35b1",
                  }}
                >
                  📄 Bill Scanner Entries
                </h3>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#667085",
                  }}
                >
                  नीचे से कोई भी Entry चुनकर Purchase Scheme में भरें।
                </div>
              </div>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearScannerQueue();
                }}
                style={{
                  position: "relative",
                  zIndex: 999999,
                  pointerEvents: "auto",
                  border: "none",
                  background: "#d32f2f",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  touchAction: "manipulation",
                }}
              >
                Clear Scanner
              </button>
            </div>

            {/* =================================================
                SCANNER LIST
            ================================================= */}

            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gap: "8px",
                position: "relative",
                zIndex: 100000,
                pointerEvents: "auto",
              }}
            >
              {scannerItems.map(
                (item, index) => {

                  const itemMedicine =
                    item?.medicine ||
                    item?.medicineName ||
                    item?.name ||
                    "Unknown Medicine";

                  const itemSupplier =
                    item?.supplier ||
                    item?.supplierName ||
                    "";

                  const itemRate =
                    item?.purchaseRate ??
                    item?.rate ??
                    "";

                  const isSaved =
                    item?.saved ||
                    item?.processed;

                  // =================================================
                  // MAIN CLICK FUNCTION
                  // =================================================

                  const handleUseEntry = (e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }

                    console.log(
                      "🔥 USE ENTRY CLICKED:",
                      item
                    );

                    applyScannedItem(item);
                  };

                  return (
                    <div
                      key={
                        item?.id ||
                        index
                      }
                      style={{
                        position:
                          "relative",
                        zIndex: 100001,
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "10px",
                        flexWrap:
                          "wrap",
                        padding:
                          "11px 12px",
                        background:
                          isSaved
                            ? "#e8f5e9"
                            : "#fff",
                        border:
                          "1px solid #ddd6fe",
                        borderRadius:
                          "10px",
                        pointerEvents:
                          "auto",
                      }}
                    >
                      {/* ENTRY INFO */}

                      <div
                        style={{
                          flex: 1,
                          minWidth:
                            "220px",
                          pointerEvents:
                            "none",
                        }}
                      >
                        <b>
                          {index + 1}.
                          {" "}
                          {itemMedicine}
                        </b>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#667085",
                            marginTop:
                              "3px",
                          }}
                        >
                          {item.company
                            ? `Company: ${item.company}`
                            : ""}

                          {itemSupplier
                            ? ` | Supplier: ${itemSupplier}`
                            : ""}

                          {itemRate !== ""
                            ? ` | Rate: ₹${itemRate}`
                            : ""}
                        </div>
                      </div>

                      {/* =================================================
                          USE ENTRY BUTTON
                      ================================================= */}

                      <button
                        type="button"

                        /* PRIMARY FIX */
                        onPointerDown={
                          handleUseEntry
                        }

                        /* Keyboard support */
                        onKeyDown={(e) => {
                          if (
                            e.key ===
                              "Enter" ||
                            e.key ===
                              " "
                          ) {
                            handleUseEntry(
                              e
                            );
                          }
                        }}

                        style={{
                          position:
                            "relative",
                          zIndex:
                            9999999,

                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          pointerEvents:
                            "auto",

                          touchAction:
                            "manipulation",

                          cursor:
                            "pointer",

                          userSelect:
                            "none",

                          WebkitUserSelect:
                            "none",

                          border:
                            "none",

                          outline:
                            "none",

                          background:
                            isSaved
                              ? "#1565c0"
                              : "#5e35b1",

                          color:
                            "#fff",

                          padding:
                            "12px 18px",

                          borderRadius:
                            "8px",

                          fontSize:
                            "14px",

                          fontWeight:
                            800,

                          minWidth:
                            "130px",

                          minHeight:
                            "44px",

                          boxShadow:
                            "0 3px 8px rgba(0,0,0,.20)",
                        }}
                      >
                        {isSaved
                          ? "✏️ Edit"
                          : "👉 Use Entry"}
                      </button>

                      {isSaved && (
                        <span
                          style={{
                            color:
                              "#2e7d32",
                            fontWeight:
                              800,
                            fontSize:
                              "12px",
                            pointerEvents:
                              "none",
                          }}
                        >
                          ✓ Saved
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* =====================================================
                NEXT SCANNED ENTRY
            ===================================================== */}

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loadNextScannerItem();
              }}
              style={{
                position: "relative",
                zIndex: 999999,
                pointerEvents: "auto",
                width: "100%",
                marginTop: "12px",
                border: "none",
                background: "#00897b",
                color: "#fff",
                padding: "11px",
                borderRadius: "9px",
                cursor: "pointer",
                fontWeight: 800,
                touchAction: "manipulation",
              }}
            >
              ➡️ Next Scanned Entry
            </button>
          </div>
        )}

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              ...card,
              padding:
                "12px 16px",
              background:
                messageType ===
                "success"
                  ? "#e8f5e9"
                  : "#ffebee",
              color:
                messageType ===
                "success"
                  ? "#2e7d32"
                  : "#c62828",
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        {/* =====================================================
            MEDICINE / SUPPLIER
        ===================================================== */}

        <div style={card}>
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Medicine & Supplier
          </h3>

          <div style={grid}>

            {/* MEDICINE */}

            <div
              style={{
                ...field,
                position: "relative",
              }}
            >
              <label style={label}>
                Medicine *
              </label>

              <input
                value={medicine}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setMedicine(value);
                  setMedicineSearch(
                    value
                  );
                  setMedicineHighlight(
                    -1
                  );
                }}
                onKeyDown={
                  handleMedicineKeyDown
                }
                placeholder="2 letters से search करें"
                style={input}
              />

              {medicineSearch.trim()
                .length >= 2 &&
                medicineSuggestions.length >
                  0 && (
                  <div
                    style={suggestion}
                  >
                    {medicineSuggestions.map(
                      (
                        item,
                        i
                      ) => (
                        <div
                          key={i}
                          onMouseEnter={() =>
                            setMedicineHighlight(
                              i
                            )
                          }
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectMedicine(
                              item
                            );
                          }}
                          style={{
                            padding:
                              "10px 12px",
                            borderBottom:
                              "1px solid #edf1f5",
                            cursor:
                              "pointer",
                            background:
                              i ===
                              medicineHighlight
                                ? "#e3f2fd"
                                : "#fff",
                          }}
                        >
                          <b>
                            {
                              item.medicine
                            }
                          </b>

                          {item.company && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#718096",
                              }}
                            >
                              {
                                item.company
                              }
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* COMPANY */}

            <div style={field}>
              <label style={label}>
                Company
              </label>

              <input
                value={company}
                onChange={(e) =>
                  setCompany(
                    e.target.value
                  )
                }
                placeholder="Company"
                style={input}
              />
            </div>

            {/* SUPPLIER */}

            <div
              style={{
                ...field,
                position: "relative",
              }}
            >
              <label style={label}>
                Supplier *
              </label>

              <input
                value={supplier}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setSupplier(value);
                  setSupplierSearch(
                    value
                  );
                  setSupplierHighlight(
                    -1
                  );
                }}
                onKeyDown={
                  handleSupplierKeyDown
                }
                placeholder="2 letters से search करें"
                style={input}
              />

              {supplierSearch.trim()
                .length >= 2 &&
                supplierSuggestions.length >
                  0 && (
                  <div
                    style={suggestion}
                  >
                    {supplierSuggestions.map(
                      (
                        item,
                        i
                      ) => (
                        <div
                          key={i}
                          onMouseEnter={() =>
                            setSupplierHighlight(
                              i
                            )
                          }
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSupplier(
                              item
                            );
                          }}
                          style={{
                            padding:
                              "10px 12px",
                            borderBottom:
                              "1px solid #edf1f5",
                            cursor:
                              "pointer",
                            background:
                              i ===
                              supplierHighlight
                                ? "#e3f2fd"
                                : "#fff",
                          }}
                        >
                          <b>
                            {
                              item.supplier
                            }
                          </b>

                          {item.mobile && (
                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#718096",
                              }}
                            >
                              {
                                item.mobile
                              }
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* MOBILE */}

            <div style={field}>
              <label style={label}>
                Supplier Mobile
              </label>

              <input
                value={
                  supplierMobile
                }
                onChange={(e) =>
                  setSupplierMobile(
                    e.target.value
                  )
                }
                inputMode="numeric"
                placeholder="Mobile"
                style={input}
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            QUANTITY
        ===================================================== */}

        <div style={card}>
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Quantity
          </h3>

          <div style={grid}>
            <div style={field}>
              <label style={label}>
                Qty *
              </label>

              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                placeholder="Quantity"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Unit *
              </label>

              <select
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value
                  )
                }
                style={select}
              >
                <option value="STRIP">
                  STRIP
                </option>

                <option value="KG">
                  KG
                </option>

                <option value="PCS">
                  PCS
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* =====================================================
            RATE
        ===================================================== */}

        <div style={card}>
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Rate / GST / Scheme
          </h3>

          <div style={grid}>

            <div style={field}>
              <label style={label}>
                Purchase Rate *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={purchaseRate}
                onChange={(e) =>
                  setPurchaseRate(
                    e.target.value
                  )
                }
                placeholder="Base Rate"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                GST
              </label>

              <select
                value={gstType}
                onChange={(e) =>
                  setGstType(
                    e.target.value
                  )
                }
                style={select}
              >
                <option value="0">
                  0%
                </option>

                <option value="-3">
                  -3%
                </option>

                <option value="+5">
                  +5%
                </option>

                <option value="+18">
                  +18%
                </option>

                <option value="+5-3">
                  +5-3%
                </option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>
                Scheme %
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  schemePercent
                }
                onChange={(e) =>
                  setSchemePercent(
                    e.target.value
                  )
                }
                placeholder="Optional"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Divide By
              </label>

              <input
                type="number"
                min="0"
                step="0.001"
                value={divideBy}
                onChange={(e) =>
                  setDivideBy(
                    e.target.value
                  )
                }
                placeholder="Optional"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Margin %
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  marginPercent
                }
                onChange={(e) =>
                  setMarginPercent(
                    e.target.value
                  )
                }
                placeholder="Optional"
                style={input}
              />
            </div>
          </div>

          {/* CALCULATION */}

          <div
            style={{
              marginTop: "16px",
              padding: "15px",
              background: "#f7fafc",
              borderRadius: "12px",
              border:
                "1px solid #e3eaf1",
            }}
          >
            <h4
              style={{
                marginTop: 0,
              }}
            >
              Calculation Preview
            </h4>

            <div style={grid}>

              <div>
                <small>
                  Base Rate
                </small>

                <strong>
                  <br />
                  ₹{" "}
                  {money(
                    calculation.base
                  )}
                </strong>
              </div>

              <div>
                <small>
                  GST Adjustment
                </small>

                <strong>
                  <br />
                  ₹{" "}
                  {money(
                    calculation.gstAmount
                  )}
                </strong>
              </div>

              <div>
                <small>
                  After GST
                </small>

                <strong>
                  <br />
                  ₹{" "}
                  {money(
                    calculation.afterGST
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Scheme Amount
                </small>

                <strong>
                  <br />
                  ₹{" "}
                  {money(
                    calculation.schemeAmount
                  )}
                </strong>
              </div>

              <div>
                <small>
                  After Scheme
                </small>

                <strong>
                  <br />
                  ₹{" "}
                  {money(
                    calculation.afterScheme
                  )}
                </strong>
              </div>

              <div>
                <small>
                  NET PURCHASE RATE
                </small>

                <strong
                  style={{
                    display: "block",
                    fontSize: "22px",
                    color: "#00897b",
                    marginTop: "4px",
                  }}
                >
                  ₹{" "}
                  {money(
                    calculation.netRate
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Margin Sale Rate
                </small>

                <strong
                  style={{
                    display: "block",
                    fontSize: "18px",
                    color: "#1565c0",
                    marginTop: "4px",
                  }}
                >
                  ₹{" "}
                  {money(
                    calculation.marginSaleRate
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Total Purchase
                </small>

                <strong
                  style={{
                    display: "block",
                    fontSize: "18px",
                    color: "#6a1b9a",
                    marginTop: "4px",
                  }}
                >
                  ₹{" "}
                  {money(
                    calculation.totalPurchase
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ITEM DETAILS
        ===================================================== */}

        <div style={card}>
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Item Details
          </h3>

          <div style={grid}>

            <div style={field}>
              <label style={label}>
                Batch
              </label>

              <input
                value={batch}
                onChange={(e) =>
                  setBatch(
                    e.target.value
                  )
                }
                placeholder="Batch No."
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Barcode
              </label>

              <input
                value={barcode}
                onChange={(e) =>
                  setBarcode(
                    e.target.value
                  )
                }
                placeholder="Barcode"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                MRP
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={mrp}
                onChange={(e) =>
                  setMrp(
                    e.target.value
                  )
                }
                placeholder="MRP"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Sale Rate
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={saleRate}
                onChange={(e) =>
                  setSaleRate(
                    e.target.value
                  )
                }
                placeholder="Sale Rate"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>
                Expiry
              </label>

              <input
                type="date"
                value={expiry}
                onChange={(e) =>
                  setExpiry(
                    e.target.value
                  )
                }
                style={input}
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            PURCHASE HISTORY
        ===================================================== */}

        {medicine.trim() && (
          <div style={card}>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom:
                    "10px",
                }}
              >
                📋 Previous Purchase History
              </h3>

              <span
                style={{
                  fontSize: "13px",
                  color: "#667085",
                }}
              >
                {
                  purchaseHistory.length
                }{" "}
                Records
              </span>
            </div>

            {purchaseHistory.length ===
            0 ? (
              <div
                style={{
                  padding: "15px",
                  background:
                    "#f7fafc",
                  borderRadius:
                    "10px",
                  color:
                    "#667085",
                }}
              >
                इस Medicine की अभी कोई
                previous purchase history
                नहीं मिली।
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
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "950px",
                  }}
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
                        Supplier
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Qty
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Purchase Rate
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "center",
                        }}
                      >
                        GST
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Scheme
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Divide
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Net Rate
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign:
                            "center",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchaseHistory.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item?.id ||
                            index
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {item?.purchaseDate ||
                              item?.date ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                700,
                            }}
                          >
                            {item?.supplier ||
                              item?.supplierName ||
                              "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                            }}
                          >
                            {item?.quantity ||
                              0}{" "}
                            {item?.unit ||
                              ""}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                            }}
                          >
                            ₹{" "}
                            {money(
                              item?.basePurchaseRate ??
                                item?.purchaseRate ??
                                item?.rate
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "center",
                              fontWeight:
                                700,
                            }}
                          >
                            {item?.gstType ||
                              "0"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                            }}
                          >
                            {num(
                              item?.schemePercent
                            )}
                            %
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                            }}
                          >
                            {num(
                              item?.divideBy
                            ) > 0
                              ? item.divideBy
                              : "-"}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "right",
                              fontWeight:
                                900,
                              color:
                                "#00897b",
                            }}
                          >
                            ₹{" "}
                            {money(
                              item?.netPurchaseRate ??
                                item?.purchaseRate ??
                                item?.rate
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign:
                                "center",
                            }}
                          >
                            <button
                              type="button"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                applyHistoryRate(
                                  item
                                );
                              }}
                              style={{
                                position:
                                  "relative",
                                zIndex:
                                  999999,
                                pointerEvents:
                                  "auto",
                                border:
                                  "none",
                                background:
                                  "#17324d",
                                color:
                                  "#fff",
                                padding:
                                  "8px 12px",
                                borderRadius:
                                  "7px",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  800,
                                touchAction:
                                  "manipulation",
                              }}
                            >
                              Use This Rate
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            SAVE
        ===================================================== */}

        <div style={card}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              savePurchase();
            }}
            style={{
              width: "100%",
              border: "none",
              background:
                "#00897b",
              color: "#fff",
              padding: "14px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction:
                "manipulation",
            }}
          >
            💾 SAVE PURCHASE
          </button>
        </div>

      </div>
    </div>
  );
}

// =========================================================
// TABLE STYLES
// =========================================================

const thStyle = {
  padding: "10px",
  textAlign: "left",
  background: "#f1f5f9",
};

const tdStyle = {
  padding: "10px",
  borderBottom:
    "1px solid #edf1f5",
};

export default PurchaseScheme;