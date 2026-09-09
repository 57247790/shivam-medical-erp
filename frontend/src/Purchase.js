  import React, { useEffect, useMemo, useRef, useState } from "react";

  function Purchase({ stock, setStock, goBack }) {
    // =====================================================
    // MODE
    // =====================================================

    const [mode, setMode] = useState("purchase");

    // =====================================================
    // PURCHASE
    // =====================================================

    const [medicine, setMedicine] = useState("");
    const [company, setCompany] = useState("");
    const [barcode, setBarcode] = useState("");
    const [batch, setBatch] = useState("");

    const [supplier, setSupplier] = useState("");
    const [supplierMobile, setSupplierMobile] = useState("");

   const [quantity, setQuantity] = useState("");
const [rate, setRate] = useState("");
const [discount, setDiscount] = useState("");
const [mrp, setMrp] = useState("");
    const [saleRate, setSaleRate] = useState("");
    const [expiry, setExpiry] = useState("");

    const [gstType, setGstType] = useState(
      localStorage.getItem("purchaseGST") || "+5"
    );
const [gstMode, setGstMode] = useState("ADD");
const [gstPercent, setGstPercent] = useState("5");
const [schemePercent, setSchemePercent] = useState("");
const [lastSchemePercent, setLastSchemePercent] = useState("");
    // =====================================================
    // ORDER
    // =====================================================

    const [orderMedicine, setOrderMedicine] = useState("");
    const [orderSupplier, setOrderSupplier] = useState("");
    const [orderSupplierMobile, setOrderSupplierMobile] = useState("");
    const [orderQuantity, setOrderQuantity] = useState("");
    const [orderUnit, setOrderUnit] = useState("STRIP");
    const [orderItems, setOrderItems] = useState([]);

    // =====================================================
    // RECEIVE ORDER
    // =====================================================

    const [receiveItem, setReceiveItem] = useState(null);
    const [receiveBarcode, setReceiveBarcode] = useState("");
    const [receiveBatch, setReceiveBatch] = useState("");
    const [receiveRate, setReceiveRate] = useState("");
    const [receiveMrp, setReceiveMrp] = useState("");
    const [receiveSaleRate, setReceiveSaleRate] = useState("");
    const [receiveExpiry, setReceiveExpiry] = useState("");

    // =====================================================
    // PREVIOUS PURCHASE RATES
    // =====================================================

    const [previousPurchaseRates, setPreviousPurchaseRates] =
      useState([]);
const [showPreviousPurchaseHistory, setShowPreviousPurchaseHistory] = useState(false);
    const [previousPurchaseRate, setPreviousPurchaseRate] =
      useState("");

    const [receiveGstType, setReceiveGstType] = useState(
      localStorage.getItem("purchaseGST") || "+5"
    );
// =====================================================
// BILL SCANNER OCR DATA → PURCHASE FORM
// =====================================================

useEffect(() => {
  const loadOCRToPurchase = () => {
    try {
     const raw =
  localStorage.getItem("billScannerPurchaseItems") ||
  localStorage.getItem("billScannerItems");

      if (!raw) return;

      const data = JSON.parse(raw);

      if (!Array.isArray(data) || data.length === 0) {
        return;
      }

      const item = data[0];

      console.log(
        "📄 BILL SCANNER DATA PURCHASE ME AA RAHA H:",
        item
      );

      const med =
        item.medicine ||
        item.medicineName ||
        item.name ||
        "";

      const comp =
        item.company ||
        item.companyName ||
        "";

      const batchNo =
        item.batch ||
        item.batchNo ||
        "";

      const bar =
        item.barcode ||
        item.barCode ||
        "";

      const qty =
        item.quantity ??
        item.qty ??
        "";

      const purchaseRate =
        item.purchaseRate ??
        item.rate ??
        "";

      const itemMrp =
        item.mrp ??
        "";

      const itemSaleRate =
        item.saleRate ??
        item.mrp ??
        "";

      const itemExpiry =
        item.expiry ||
        item.expiryRaw ||
        "";

      const itemSupplier =
        item.supplier ||
        item.supplierName ||
        "";

      const itemMobile =
        item.supplierMobile ||
        item.mobile ||
        item.phone ||
        "";

      // -------------------------------
      // PURCHASE FORM FILL
      // -------------------------------

      if (med) {
        setMedicine(String(med));
        setMedicineSearch(String(med));
      }

      if (comp) {
        setCompany(String(comp));
      }

      if (bar) {
        setBarcode(String(bar));
      }

      if (batchNo) {
        setBatch(String(batchNo));
      }

      if (itemSupplier) {
        setSupplier(String(itemSupplier));
        setSupplierSearch(String(itemSupplier));
      }

      if (itemMobile) {
        setSupplierMobile(
          mobileClean(String(itemMobile))
        );
      }

      if (qty !== "") {
        setQuantity(String(qty));
      }

      if (purchaseRate !== "") {
        setRate(String(purchaseRate));
      }

      if (itemMrp !== "") {
        setMrp(String(itemMrp));
      }

      if (itemSaleRate !== "") {
        setSaleRate(String(itemSaleRate));
      }

      if (itemExpiry) {
        setExpiry(String(itemExpiry));
      }

      setMode("purchase");

      setShowMedicineSearch(false);
      setShowSupplierSearch(false);

      // -------------------------------
      // MARK LOADED
      // -------------------------------

      localStorage.setItem(
        "billScannerLoadedIntoPurchase",
        "true"
      );

      localStorage.setItem(
        "billScannerPurchaseLoadedAt",
        new Date().toISOString()
      );

      console.log(
        "✅ OCR → PURCHASE FORM AUTO FILLED"
      );

    } catch (error) {
      console.error(
        "❌ OCR PURCHASE LOAD ERROR:",
        error
      );
    }
  };

  // Purchase page खुलते ही OCR data पढ़े
  

  // Bill Scanner से event आने पर भी पढ़े
  window.addEventListener(
    "billScannerPurchaseReady",
    loadOCRToPurchase
  );

  window.addEventListener(
    "billScannerUpdated",
    loadOCRToPurchase
  );

  return () => {
    window.removeEventListener(
      "billScannerPurchaseReady",
      loadOCRToPurchase
    );

    window.removeEventListener(
      "billScannerUpdated",
      loadOCRToPurchase
    );
  };
}, []);
    // =====================================================
    // SEARCH
    // =====================================================

    const [medicineSearch, setMedicineSearch] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");

    const [showMedicineSearch, setShowMedicineSearch] = useState(false);
    const [showSupplierSearch, setShowSupplierSearch] = useState(false);
    const [showOrderMedicineSearch, setShowOrderMedicineSearch] =
      useState(false);
    const [showOrderSupplierSearch, setShowOrderSupplierSearch] =
      useState(false);

    const [medicineHighlight, setMedicineHighlight] = useState(-1);
    const [supplierHighlight, setSupplierHighlight] = useState(-1);
    const [orderMedicineHighlight, setOrderMedicineHighlight] = useState(-1);
    const [orderSupplierHighlight, setOrderSupplierHighlight] = useState(-1);

    // =====================================================
    // REFS
    // =====================================================

    const medicineRef = useRef(null);
    const companyRef = useRef(null);
    const barcodeRef = useRef(null);
    const batchRef = useRef(null);
    const supplierRef = useRef(null);
    const supplierMobileRef = useRef(null);
    const quantityRef = useRef(null);
    const rateRef = useRef(null);
    const gstRef = useRef(null);
    const mrpRef = useRef(null);
    const saleRateRef = useRef(null);
    const expiryRef = useRef(null);
    const savePurchaseRef = useRef(null);

    const orderMedicineRef = useRef(null);
    const orderSupplierRef = useRef(null);
    const orderSupplierMobileRef = useRef(null);
    const orderQuantityRef = useRef(null);
    const orderUnitRef = useRef(null);
    const addOrderRef = useRef(null);

    // =====================================================
    // SAFE STOCK
    // =====================================================

    const currentStock = Array.isArray(stock) ? stock : [];

    // =====================================================
    // STORAGE
    // =====================================================

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

    // =====================================================
    // HELPERS
    // =====================================================

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const number = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const mobileClean = (value) =>
      String(value || "").replace(/\D/g, "");

    const today = () => {
      const d = new Date();

      return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
      );
    };

    const makeId = (prefix) =>
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 7);

    // =====================================================
    // GST
    // =====================================================

    const gstRate = (base, type) => {
      const value = number(base);

      if (type === "+5") return value * 1.05;
      if (type === "+18") return value * 1.18;
      if (type === "-3") return value * 0.97;
      if (type === "+5-3") return value * 1.05 * 0.97;

      return value;
    };
const purchaseRatePerItem = () => {
  const totalAmount = Number(rate) || 0;
  const qty = Number(quantity) || 0;
  const discountPercent = Number(discount) || 0;

  if (!totalAmount || !qty) {
    return 0;
  }

  // Purchase Amount में से Discount घटाना
  const afterDiscount =
    totalAmount -
    (totalAmount * discountPercent) / 100;

  // Discount के बाद GST लगाना
  const totalWithGST = gstRate(
    afterDiscount,
    gstType
  );

  // Quantity से divide करके per item rate
  return totalWithGST / qty;
};<div
  style={{
    marginBottom: "10px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "6px",
  }}
>
  <div
    style={{
      fontWeight: "bold",
      marginBottom: "5px",
    }}
  >
    GST + Discount के बाद Per Item Purchase Rate
  </div>

  <input
    type="text"
    value={
      rate !== "" &&
      quantity !== ""
        ? purchaseRatePerItem().toFixed(2)
        : ""
    }
    readOnly
    placeholder="Per Item Purchase Rate"
    style={{
      width: "100%",
      padding: "10px",
      boxSizing: "border-box",
      background: "#eeeeee",
      fontWeight: "bold",
    }}
  />
</div>
    // =====================================================
    // SAVED DATA
    // =====================================================

    const suppliers = readStorage("suppliers", []);
    const medicineMaster = readStorage("medicineMaster", []);

    // =====================================================
    // STOCK MEDICINE SEARCH
    // =====================================================

    const allMedicineData = useMemo(() => {
      const combined = [
        ...medicineMaster,
        ...currentStock.map((item) => ({
          ...item,
          medicine: item.medicine || item.name || "",
          company: item.company || "",
          barcode: item.barcode || item.barCode || "",
          supplier: item.supplier || item.supplierName || "",
          supplierMobile: item.supplierMobile || "",
          purchaseRate: item.purchaseRate || item.rate || "",
        })),
      ];

      const unique = [];
      const seen = new Set();

      combined.forEach((item) => {
        const key =
          normalize(item.medicine || item.name) +
          "|" +
          normalize(item.company) +
          "|" +
          normalize(item.barcode);

        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      });

      return unique;
    }, [medicineMaster, currentStock]);

    // =====================================================
    // PURCHASE MEDICINE SEARCH
    // =====================================================

    const medicineSuggestions = useMemo(() => {
  const search = normalize(medicine);

  // Blank या सिर्फ 1 letter पर list नहीं
  if (search.length < 2) return [];

  return allMedicineData
    .filter((item) => {
      const med = normalize(
        item.medicine || item.name
      );

      return med.includes(search);
    })
    .slice(0, 20);
}, [medicine, allMedicineData]);
    // =====================================================
    // SUPPLIER SEARCH
    // =====================================================

    const supplierSuggestions = useMemo(() => {
      const search = normalize(supplier);

      if (!search) return suppliers.slice(0, 20);

      return suppliers
        .filter(
          (item) =>
            normalize(item.name).includes(search) ||
            normalize(item.mobile).includes(search) ||
            normalize(item.whatsapp).includes(search)
        )
        .slice(0, 20);
    }, [supplier, suppliers.length]);

    // =====================================================
    // ORDER MEDICINE SEARCH
    // =====================================================
const orderMedicineSuggestions = useMemo(() => {
  const search = normalize(orderMedicine);

  // 2 letters से कम पर search नहीं
  if (search.length < 2) return [];

  return allMedicineData
    .filter((item) => {
      const med = normalize(
        item.medicine || item.name
      );

      return med.includes(search);
    })
    .slice(0, 20);
}, [orderMedicine, allMedicineData]);

    // =====================================================
    // ORDER SUPPLIER SEARCH
    // =====================================================

    const orderSupplierSuggestions = useMemo(() => {
      const search = normalize(orderSupplier);

      if (!search) return suppliers.slice(0, 20);

      return suppliers
        .filter(
          (item) =>
            normalize(item.name).includes(search) ||
            normalize(item.mobile).includes(search) ||
            normalize(item.whatsapp).includes(search)
        )
        .slice(0, 20);
    }, [orderSupplier, suppliers.length]);

    // =====================================================
    // BARCODE
    // =====================================================

    const normalizeBarcode = (value) =>
      String(value || "")
        .trim()
        .replace(/\s+/g, "")
        .toLowerCase();

    const findBarcodeItem = (code) => {
      const cleanCode = normalizeBarcode(code);

      if (!cleanCode) return null;

      return currentStock.find((item) => {
        const itemBarcode =
          item?.barcode ||
          item?.barCode ||
          item?.Barcode ||
          item?.barcodeNo ||
          item?.barcodeNumber ||
          item?.code ||
          item?.itemBarcode ||
          "";

        return normalizeBarcode(itemBarcode) === cleanCode;
      });
    };

    // =====================================================
    // SELECT MEDICINE
    // =====================================================
const selectMedicine = (item) => {
  if (!item) return;

  setMedicine(item.medicine || item.name || "");
  setMedicineSearch(item.medicine || item.name || "");

  setCompany(item.company || "");

  setBarcode(
    item.barcode ||
      item.barCode ||
      item.barcodeNo ||
      ""
  );

  setBatch(
    item.batch ||
      item.batchNo ||
      ""
  );

  setSupplier(
    item.supplier ||
      item.supplierName ||
      ""
  );

  setSupplierSearch(
    item.supplier ||
      item.supplierName ||
      ""
  );

  setSupplierMobile(
    item.supplierMobile || ""
  );

  setRate(
    item.purchaseRate ||
      item.rate ||
      ""
  );

  setMrp(item.mrp || "");

  setSaleRate(
    item.saleRate || ""
  );

  setGstType(
    item.gstType || "+5"
  );

  setExpiry(
    item.expiry || ""
  );

  // =====================================================
  // PREVIOUS PURCHASE RATE HISTORY
  // =====================================================

  const oldPurchaseRates =
    getPreviousPurchaseRates(
      item.medicine || item.name || "",
      item.supplier ||
        item.supplierName ||
        ""
    );

  setPreviousPurchaseRates(
    oldPurchaseRates
  );

  setShowPreviousPurchaseHistory(
    oldPurchaseRates.length > 0
  );

  setShowMedicineSearch(false);
  setMedicineHighlight(-1);

  setTimeout(() => {
    quantityRef.current?.focus();
  }, 50);
};
    // =====================================================
    // SELECT ORDER MEDICINE
    // =====================================================

    const selectOrderMedicine = (item) => {
      if (!item) return;

      setOrderMedicine(item.medicine || item.name || "");

      setShowOrderMedicineSearch(false);
      setOrderMedicineHighlight(-1);

      setTimeout(() => {
        orderSupplierRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // SELECT SUPPLIER
    // =====================================================

    const selectSupplier = (item) => {
      if (!item) return;

      setSupplier(item.name || "");

      setSupplierSearch(item.name || "");

      setSupplierMobile(item.mobile || item.whatsapp || "");

      setShowSupplierSearch(false);
      setSupplierHighlight(-1);

      setTimeout(() => {
        quantityRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // SELECT ORDER SUPPLIER
    // =====================================================

    const selectOrderSupplier = (item) => {
      if (!item) return;

      setOrderSupplier(item.name || "");

      setOrderSupplierMobile(item.mobile || item.whatsapp || "");

      setShowOrderSupplierSearch(false);
      setOrderSupplierHighlight(-1);

      setTimeout(() => {
        orderSupplierMobileRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // SUPPLIER CHANGE
    // =====================================================

    const changeSupplier = (value) => {
      setSupplier(value);
      setSupplierSearch(value);
      setShowSupplierSearch(true);
      setSupplierHighlight(-1);

      const found = suppliers.find(
        (item) => normalize(item.name) === normalize(value)
      );

      if (found) {
        setSupplierMobile(found.mobile || found.whatsapp || "");
      }
    };

    // =====================================================
    // ORDER SUPPLIER CHANGE
    // =====================================================

    const changeOrderSupplier = (value) => {
      setOrderSupplier(value);
      setShowOrderSupplierSearch(true);
      setOrderSupplierHighlight(-1);

      const found = suppliers.find(
        (item) => normalize(item.name) === normalize(value)
      );

      if (found) {
        setOrderSupplierMobile(found.mobile || found.whatsapp || "");
      }
    };

    // =====================================================
    // PURCHASE MEDICINE KEYBOARD
    // =====================================================
const handleMedicineKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    // अगर search suggestions खुली हैं
    if (
      showMedicineSearch &&
      medicineSuggestions.length > 0
    ) {
      const index =
        medicineHighlight >= 0
          ? medicineHighlight
          : 0;

      selectMedicine(
        medicineSuggestions[index]
      );

      return;
    }

    // कोई suggestion नहीं है तो सीधे Company
    companyRef.current?.focus();
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();

    if (medicineSuggestions.length > 0) {
      setShowMedicineSearch(true);

      setMedicineHighlight((prev) =>
        prev < medicineSuggestions.length - 1
          ? prev + 1
          : 0
      );
    }

    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();

    if (medicineSuggestions.length > 0) {
      setMedicineHighlight((prev) =>
        prev > 0
          ? prev - 1
          : medicineSuggestions.length - 1
      );
    }

    return;
  }

  // Arrow Right से भी Company
  if (e.key === "ArrowRight") {
    e.preventDefault();
    companyRef.current?.focus();
  }
};
    // =====================================================
    // SUPPLIER KEYBOARD
    // =====================================================

    const handleSupplierKeyDown = (e) => {
      if (
        showSupplierSearch &&
        supplierSuggestions.length > 0
      ) {
        if (e.key === "ArrowDown") {
          e.preventDefault();

          setSupplierHighlight((prev) =>
            prev < supplierSuggestions.length - 1 ? prev + 1 : 0
          );

          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();

          setSupplierHighlight((prev) =>
            prev > 0 ? prev - 1 : supplierSuggestions.length - 1
          );

          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();

          const index =
            supplierHighlight >= 0 ? supplierHighlight : 0;

          selectSupplier(supplierSuggestions[index]);

          return;
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        supplierMobileRef.current?.focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        batchRef.current?.focus();
      }
    };

    // =====================================================
    // ORDER MEDICINE KEYBOARD
    // =====================================================

    const handleOrderMedicineKeyDown = (e) => {
      if (
        showOrderMedicineSearch &&
        orderMedicineSuggestions.length > 0
      ) {
        if (e.key === "ArrowDown") {
          e.preventDefault();

          setOrderMedicineHighlight((prev) =>
            prev < orderMedicineSuggestions.length - 1 ? prev + 1 : 0
          );

          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();

          setOrderMedicineHighlight((prev) =>
            prev > 0
              ? prev - 1
              : orderMedicineSuggestions.length - 1
          );

          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();

          const index =
            orderMedicineHighlight >= 0
              ? orderMedicineHighlight
              : 0;

          selectOrderMedicine(
            orderMedicineSuggestions[index]
          );

          return;
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        orderSupplierRef.current?.focus();
      }
    };

    // =====================================================
    // ORDER SUPPLIER KEYBOARD
    // =====================================================

    const handleOrderSupplierKeyDown = (e) => {
      if (
        showOrderSupplierSearch &&
        orderSupplierSuggestions.length > 0
      ) {
        if (e.key === "ArrowDown") {
          e.preventDefault();

          setOrderSupplierHighlight((prev) =>
            prev < orderSupplierSuggestions.length - 1 ? prev + 1 : 0
          );

          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();

          setOrderSupplierHighlight((prev) =>
            prev > 0
              ? prev - 1
              : orderSupplierSuggestions.length - 1
          );

          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();

          const index =
            orderSupplierHighlight >= 0
              ? orderSupplierHighlight
              : 0;

          selectOrderSupplier(
            orderSupplierSuggestions[index]
          );

          return;
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        orderSupplierMobileRef.current?.focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        orderMedicineRef.current?.focus();
      }
    };

    // =====================================================
    // NORMAL INPUT NAVIGATION
    // =====================================================

    const downUp = (e, downRef, upRef) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        downRef?.current?.focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        upRef?.current?.focus();
      }
    };

    // =====================================================
    // LOAD ORDER
    // =====================================================

    useEffect(() => {
      const saved = readStorage("currentOrder", []);

      if (Array.isArray(saved)) {
        setOrderItems(saved);
      }
    }, []);
// =====================================================
// AUTO MERGE DUPLICATE SUPPLIERS
// CAPS / small / Mixed Case = SAME SUPPLIER
// =====================================================

useEffect(() => {
  const savedSuppliers = readStorage("suppliers", []);

  if (!Array.isArray(savedSuppliers) || savedSuppliers.length === 0) {
    return;
  }

  const uniqueSuppliers = [];
  const seen = new Set();

  savedSuppliers.forEach((item) => {
    const name = String(item?.name || "").trim();

    if (!name) return;

    const key = normalize(name);

    if (seen.has(key)) {
      // Duplicate supplier मिला
      // Mobile/WhatsApp खाली हो तो पुराने duplicate से ले लो
      const existing = uniqueSuppliers.find(
        (s) => normalize(s.name) === key
      );

      if (existing) {
        if (!existing.mobile && item.mobile) {
          existing.mobile = item.mobile;
        }

        if (!existing.whatsapp && item.whatsapp) {
          existing.whatsapp = item.whatsapp;
        }
      }

      return;
    }

    seen.add(key);

    uniqueSuppliers.push({
      ...item,
      name,
    });
  });

  if (uniqueSuppliers.length !== savedSuppliers.length) {
    writeStorage("suppliers", uniqueSuppliers);

    // Supplier search/list तुरंत refresh कराने के लिए
    window.dispatchEvent(new Event("supplierUpdated"));
  }
}, []);
    // =====================================================
    // SAVE SUPPLIER
    // =====================================================

    const saveSupplier = () => {
      const name = supplier.trim();
      const mobile = mobileClean(supplierMobile);

      if (!name) {
        alert("⚠️ Supplier Name डालें");
        return;
      }

      if (mobile.length !== 10) {
        alert("⚠️ सही 10 digit Mobile Number डालें");
        return;
      }

      const list = readStorage("suppliers", []);

      const index = list.findIndex(
        (item) => normalize(item.name) === normalize(name)
      );

      const data = {
        id:
          index >= 0
            ? list[index].id
            : makeId("SUPPLIER"),
        name,
        mobile,
        whatsapp: mobile,
        updatedAt: Date.now(),
      };

      let updated;

      if (index >= 0) {
        updated = [...list];

        updated[index] = {
          ...updated[index],
          ...data,
        };
      } else {
        updated = [data, ...list];
      }

      writeStorage("suppliers", updated);

      localStorage.setItem(
        "supplierUpdatedAt",
        String(Date.now())
      );

      window.dispatchEvent(
        new Event("supplierUpdated")
      );

      alert("✅ Supplier Saved Successfully");
    };

    // =====================================================
    // SAVE MEDICINE MASTER
    // =====================================================

    const saveMedicineMaster = () => {
      if (!medicine.trim()) return;

      const list = readStorage("medicineMaster", []);

      const data = {
        id: makeId("MEDICINE"),

        medicine: medicine.trim(),

        company: company.trim(),

        barcode: barcode.trim(),

        batch: batch.trim(),

        supplier: supplier.trim(),

        supplierMobile: mobileClean(supplierMobile),

        purchaseRate: rate,

        mrp: mrp,

        saleRate: saleRate,

        gstType: gstType,

        expiry: expiry,

        updatedAt: Date.now(),
      };

      const index = list.findIndex(
        (item) =>
          normalize(item.medicine) === normalize(medicine) &&
          normalize(item.supplier) === normalize(supplier)
      );

      let updated;

      if (index >= 0) {
        updated = [...list];

        updated[index] = {
          ...updated[index],
          ...data,
          id: updated[index].id,
        };
      } else {
        updated = [data, ...list];
      }

      writeStorage("medicineMaster", updated);

      window.dispatchEvent(
        new Event("medicineMasterUpdated")
      );
    };

    // =====================================================
    // SAVE PURCHASE
    // =====================================================

    const savePurchase = async () => {
      if (
        !medicine.trim() ||
        !supplier.trim() ||
        !quantity ||
        !rate ||
        !mrp ||
        !saleRate ||
        !expiry
      ) {
        alert(
          "⚠️ Medicine, Supplier, Quantity, Purchase Rate, MRP, Sale Rate और Expiry भरें"
        );
        return;
      }

      const qty = number(quantity);
      const baseRate = number(rate);
      const medicineMrp = number(mrp);
      const medicineSaleRate = number(saleRate);
const discountPercent = number(discount);

if (discountPercent < 0 || discountPercent > 100) {
  alert("⚠️ Discount 0 से 100% के बीच होना चाहिए");
  return;
}

// Net Rate में से Discount कम
const discountAmount =
  (baseRate * discountPercent) / 100;

const rateAfterDiscount =
  baseRate - discountAmount;

// Discount के बाद GST
const finalRate = gstRate(
  rateAfterDiscount,
  gstType
);

const gstAmount =
  finalRate - rateAfterDiscount;
      if (qty <= 0) {
        alert("⚠️ Quantity सही डालें");
        return;
      }

      if (baseRate <= 0) {
        alert("⚠️ Purchase Rate सही डालें");
        return;
      }

      if (medicineSaleRate > medicineMrp) {
        alert("⚠️ Sale Rate MRP से ज्यादा नहीं हो सकता");
        return;
      }


      const cleanMobile = mobileClean(supplierMobile);

      const data = {
        medicine: medicine.trim(),

        company: company.trim(),

        barcode: barcode.trim(),

        batch: batch.trim(),

        supplier: supplier.trim(),

        expiry: expiry,

        purchaseRate: baseRate,
      };

      const existingIndex = currentStock.findIndex(
        (item) =>
          normalize(item.medicine || item.name) ===
            normalize(data.medicine) &&
          normalize(item.company) ===
            normalize(data.company) &&
          normalize(item.batch || item.batchNo) ===
            normalize(data.batch) &&
          normalize(item.supplier || item.supplierName) ===
            normalize(data.supplier) &&
          number(item.purchaseRate || item.rate) ===
            baseRate &&
          String(item.expiry || "") ===
            String(data.expiry || "")
      );

      let updatedStock;

      if (existingIndex >= 0) {
        updatedStock = [...currentStock];

        const old = updatedStock[existingIndex];

        updatedStock[existingIndex] = {
          ...old,

          quantity:
            number(old.quantity) + qty,

          purchaseAmount:
            number(old.purchaseAmount) +
            qty * finalRate,

          purchaseRate: baseRate,

          basePurchaseRate: baseRate,

          rate: baseRate,

          purchaseRateWithGST: finalRate,

          gstType: gstType,

          gstAmountPerItem: gstAmount,

          mrp: medicineMrp,

          saleRate: medicineSaleRate,

          supplier: supplier.trim(),

          supplierName: supplier.trim(),

          supplierMobile: cleanMobile,

          updatedAt: Date.now(),
        };
      } else {
        updatedStock = [
          {
            id: makeId("STOCK"),

            medicine: medicine.trim(),

            name: medicine.trim(),

            company: company.trim(),

            barcode: barcode.trim(),

            batch: batch.trim(),

            batchNo: batch.trim(),

            supplier: supplier.trim(),

            supplierName: supplier.trim(),

            supplierMobile: cleanMobile,

            quantity: qty,

            unit: "PCS",

            purchaseRate: baseRate,

            basePurchaseRate: baseRate,

            rate: baseRate,

            gstType: gstType,

            gstPercent: gstType,

            gstAmountPerItem: gstAmount,

            purchaseRateWithGST: finalRate,

            mrp: medicineMrp,

            saleRate: medicineSaleRate,

            expiry: expiry,

            purchaseAmount: qty * finalRate,

            purchaseDate: today(),

            date: today(),

            createdAt: Date.now(),

            updatedAt: Date.now(),
          },

          ...currentStock,
        ];
      }

      setStock(updatedStock);

      writeStorage("stock", updatedStock);
      // =====================================================
      // SAVE PURCHASE TO BACKEND / SQLITE
      // =====================================================

      try {
        const API_URL =
          process.env.REACT_APP_API_URL ||
          "http://localhost:5000";

        // पहले backend का current stock लें
        const stockResponse = await fetch(
          `${API_URL}/api/stock`
        );

        if (!stockResponse.ok) {
          throw new Error("Backend stock load failed");
        }

        const stockResult = await stockResponse.json();

        const backendStock =
          Array.isArray(stockResult.stock)
            ? stockResult.stock
            : [];

        // वही item backend में पहले से है या नहीं
        const backendIndex = backendStock.findIndex(
          (item) =>
            normalize(item.medicine || item.name) ===
              normalize(medicine.trim()) &&

            normalize(item.company) ===
              normalize(company.trim()) &&

            normalize(item.batch || item.batchNo) ===
              normalize(batch.trim()) &&

            normalize(
              item.supplier || item.supplierName
            ) ===
              normalize(supplier.trim()) &&

            number(
              item.rate ||
              item.purchaseRate ||
              item.basePurchaseRate
            ) === baseRate &&

            String(item.expiry || "") ===
              String(expiry || "")
        );

        // Backend में save/update करने वाला data
        const backendData = {
          medicine: medicine.trim(),

          company: company.trim(),

          batch: batch.trim(),

          barcode: barcode.trim(),

          supplier: supplier.trim(),

          supplierMobile: cleanMobile,

          quantity: qty,

          rate: baseRate,

          mrp: medicineMrp,

          saleRate: medicineSaleRate,

          expiry: expiry,

          gstType: gstType,

          gstPercent:
            number(gstType),

          purchaseRateWithGST:
            finalRate,

          purchaseAmount:
            qty * finalRate,
        };

        // =================================================
        // EXISTING ITEM → UPDATE
        // =================================================

        if (backendIndex >= 0) {
          const existing =
            backendStock[backendIndex];

          const newQuantity =
            number(existing.quantity) + qty;

          const newPurchaseAmount =
            number(existing.purchaseAmount) +
            qty * finalRate;

          const updateData = {
            ...backendData,

            quantity:
              newQuantity,

            purchaseAmount:
              newPurchaseAmount,

            purchaseRate:
              baseRate,

            basePurchaseRate:
              baseRate,

            gstAmountPerItem:
              gstAmount,

            supplierName:
              supplier.trim(),

            batchNo:
              batch.trim(),

            updatedAt:
              new Date().toISOString(),
          };

          const updateResponse =
            await fetch(
              `${API_URL}/api/stock/${existing.id}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify(
                  updateData
                ),
              }
            );

          if (!updateResponse.ok) {
            throw new Error(
              "Backend stock update failed"
            );
          }

          console.log(
            "✅ Purchase updated in backend",
            existing.id
          );const localIndex = updatedStock.findIndex(
  (item) =>
    normalize(item.medicine || item.name) ===
      normalize(medicine.trim()) &&
    normalize(item.company) ===
      normalize(company.trim()) &&
    normalize(item.batch || item.batchNo) ===
      normalize(batch.trim())
);

if (localIndex >= 0) {
  updatedStock[localIndex] = {
    ...updatedStock[localIndex],
    backendId: existing.id,
  };

  setStock(updatedStock);
  writeStorage("stock", updatedStock);

  console.log(
    "✅ Backend ID saved locally:",
    existing.id
  );
}
        }

        // =================================================
        // NEW ITEM → INSERT
        // =================================================

        else {
          const newStockData = {
            ...backendData,

            purchaseRate:
              baseRate,

            basePurchaseRate:
              baseRate,

            gstAmountPerItem:
              gstAmount,

            supplierName:
              supplier.trim(),

            batchNo:
              batch.trim(),

            unit: "PCS",

            purchaseDate:
              today(),

            date:
              today(),

            createdAt:
              new Date().toISOString(),

            updatedAt:
              new Date().toISOString(),
          };

          const saveResponse =
            await fetch(
              `${API_URL}/api/stock`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify(
                  newStockData
                ),
              }
            );

          if (!saveResponse.ok) {
            throw new Error(
              "Backend stock save failed"
            );
          }

          const saveResult =
            await saveResponse.json();

          console.log(
            "✅ Purchase saved in backend",
            saveResult
          );
        }

      } catch (backendError) {
        console.error(
          "❌ BACKEND PURCHASE ERROR:",
          backendError
        );

        alert(
          "⚠️ Purchase local me save ho gaya, lekin Backend/Online Database me save nahi ho paya."
        );
      }
      // ===================================================
      // SAVE SUPPLIER
      // ===================================================

      const supplierList = readStorage("suppliers", []);

      const supplierIndex = supplierList.findIndex(
        (item) =>
          normalize(item.name) === normalize(supplier)
      );

      const supplierData = {
        id:
          supplierIndex >= 0
            ? supplierList[supplierIndex].id
            : makeId("SUPPLIER"),

        name: supplier.trim(),

        mobile: cleanMobile,

        whatsapp: cleanMobile,

        lastPurchaseDate: today(),

        updatedAt: Date.now(),
      };

      let updatedSuppliers;

      if (supplierIndex >= 0) {
        updatedSuppliers = [...supplierList];

        updatedSuppliers[supplierIndex] = {
          ...updatedSuppliers[supplierIndex],
          ...supplierData,
        };
      } else {
        updatedSuppliers = [
          supplierData,
          ...supplierList,
        ];
      }

      writeStorage("suppliers", updatedSuppliers);

      // ===================================================
      // MEDICINE MASTER
      // ===================================================

      saveMedicineMaster();

      // ===================================================
      // PURCHASE HISTORY
      // ===================================================

      const history = readStorage("purchaseHistory", []);

      writeStorage("purchaseHistory", [
        {
          id: makeId("PURCHASE"),

          medicine: medicine.trim(),

          company: company.trim(),

          barcode: barcode.trim(),

          batch: batch.trim(),

          supplier: supplier.trim(),

          supplierMobile: cleanMobile,

          quantity: qty,

          purchaseRate: baseRate,

          purchaseRateWithGST: finalRate,

          gstType: gstType,

          mrp: medicineMrp,

          saleRate: medicineSaleRate,

          expiry: expiry,

          purchaseAmount: qty * finalRate,

          purchaseDate: today(),

          createdAt: Date.now(),
        },

        ...history,
      ]);

      window.dispatchEvent(
        new Event("stockUpdated")
      );

      window.dispatchEvent(
        new Event("purchaseUpdated")
      );

      window.dispatchEvent(
        new Event("supplierUpdated")
      );

      alert("✅ Purchase Saved Successfully");

      // CLEAR

      setMedicine("");
      setCompany("");
      setBarcode("");
      setBatch("");
      setSupplier("");
      setSupplierMobile("");
      setQuantity("");
      setRate("");
      setMrp("");
      setSaleRate("");
      setExpiry("");
      setMedicineSearch("");
      setSupplierSearch("");

      setTimeout(() => {
        medicineRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // ADD NEW ORDER
    // =====================================================

    const addOrderItem = () => {
      const med = orderMedicine.trim();

      const sup = orderSupplier.trim();

      const mobile = mobileClean(orderSupplierMobile);

      const qty = number(orderQuantity);

      if (!med) {
        alert("⚠️ Medicine Name डालें");
        return;
      }

      if (!sup) {
        alert("⚠️ Supplier Search करें");
        return;
      }

      if (qty <= 0) {
        alert("⚠️ Quantity सही डालें");
        return;
      }

      const item = {
        id: makeId("ORDER"),

        medicine: med,

        supplier: sup,

        supplierName: sup,

        supplierMobile: mobile,

        mobile: mobile,

        quantity: qty,

        unit: orderUnit,

        createdAt: new Date().toISOString(),
      };

      const updated = [...orderItems, item];

      setOrderItems(updated);

      writeStorage("currentOrder", updated);

      setOrderMedicine("");
      setOrderQuantity("");
      setOrderUnit("STRIP");

      setTimeout(() => {
        orderMedicineRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // GET ALL PREVIOUS PURCHASE RATES
    // =====================================================

    const getPreviousPurchaseRates = (
      medicineName,
      currentSupplier
    ) => {
      const history = readStorage(
        "purchaseHistory",
        []
      );

      const medicineKey = normalize(medicineName);
      const currentSupplierKey = normalize(currentSupplier);

      const matchingHistory = history.filter(
        (item) => {
          const itemMedicine = normalize(
            item.medicine || item.name
          );

          return itemMedicine === medicineKey;
        }
      );

      const supplierMap = {};

      matchingHistory.forEach((item) => {
        const supplierName =
          item.supplier ||
          item.supplierName ||
          "";

        const supplierKey = normalize(
          supplierName
        );

        if (!supplierKey) return;

        const purchaseRate =
          number(
            item.purchaseRate ||
              item.basePurchaseRate ||
              item.rate
          );

        if (purchaseRate <= 0) return;

        const dateValue =
          item.createdAt ||
          item.purchaseDate ||
          item.date ||
          0;

        const oldDate = supplierMap[supplierKey];

        if (
          !oldDate ||
          Number(dateValue) >
            Number(oldDate.createdAt || 0)
        ) {
          supplierMap[supplierKey] = {
            supplier:
              supplierName,

            mobile:
              item.supplierMobile ||
              item.mobile ||
              "",

            rate:
              purchaseRate,

            gstRate:
              item.purchaseRateWithGST ||
              "",

            date:
              item.purchaseDate ||
              item.date ||
              "",

            createdAt:
              dateValue,
          };
        }
      });


      // ===================================================
      // STOCK FALLBACK
      // ===================================================

      currentStock.forEach((item) => {
        const itemMedicine = normalize(
          item.medicine || item.name
        );

        if (itemMedicine !== medicineKey) return;

        const supplierName =
          item.supplier ||
          item.supplierName ||
          "";

        const supplierKey =
          normalize(supplierName);

        if (!supplierKey) return;

        const purchaseRate =
          number(
            item.purchaseRate ||
              item.basePurchaseRate ||
              item.rate
          );

        if (purchaseRate <= 0) return;

        if (!supplierMap[supplierKey]) {
          supplierMap[supplierKey] = {
            supplier:
              supplierName,

            mobile:
              item.supplierMobile ||
              item.mobile ||
              "",

            rate:
              purchaseRate,

            gstRate:
              item.purchaseRateWithGST ||
              "",

            date:
              item.purchaseDate ||
              item.date ||
              "",

            createdAt:
              item.updatedAt ||
              item.createdAt ||
              0,
          };
        }
      });

      const result = Object.values(
        supplierMap
      ).sort((a, b) => {
        if (
          normalize(a.supplier) ===
          currentSupplierKey
        ) {
          return -1;
        }

        if (
          normalize(b.supplier) ===
          currentSupplierKey
        ) {
          return 1;
        }

        return (
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
        );
      });

      return result;
    };

    // =====================================================
    // OPEN RECEIVE
    // =====================================================

    const openReceiveOrder = (item) => {
      if (!item) return;

      const master = allMedicineData.find(
        (m) =>
          normalize(
            m.medicine || m.name
          ) ===
          normalize(
            item.medicine
          )
      );

      setReceiveItem(item);

      setReceiveBarcode(
        master?.barcode ||
          master?.barCode ||
          master?.barcodeNo ||
          ""
      );

      setReceiveBatch(
        master?.batch ||
          master?.batchNo ||
          ""
      );

      // ===================================================
      // PREVIOUS RATES - ALL STOCKISTS
      // ===================================================

      const allPreviousRates =
        getPreviousPurchaseRates(
          item.medicine,
          item.supplier ||
            item.supplierName ||
            ""
        );

      setPreviousPurchaseRates(
        allPreviousRates
      );

      // ===================================================
      // CURRENT ORDER SUPPLIER KA PREVIOUS RATE
      // ===================================================

      const currentSupplierName =
        item.supplier ||
        item.supplierName ||
        "";

      const currentSupplierRate =
        allPreviousRates.find(
          (rateItem) =>
            normalize(
              rateItem.supplier
            ) ===
            normalize(
              currentSupplierName
            )
        );

      if (
        currentSupplierRate &&
        number(currentSupplierRate.rate) > 0
      ) {
        setPreviousPurchaseRate(
          currentSupplierRate.rate
        );

        // Previous supplier rate ko
        // Receive Purchase Rate me auto-fill
        setReceiveRate(
          String(
            currentSupplierRate.rate
          )
        );
      } else {
        const fallbackRate =
          master?.purchaseRate ||
          master?.rate ||
          "";

        setPreviousPurchaseRate(
          fallbackRate
        );

        setReceiveRate(
          fallbackRate
        );
      }

      setReceiveMrp(
        master?.mrp ||
          ""
      );

      setReceiveSaleRate(
        master?.saleRate ||
          ""
      );

      setReceiveExpiry(
        master?.expiry ||
          ""
      );

      setReceiveGstType(
        master?.gstType ||
          localStorage.getItem(
            "purchaseGST"
          ) ||
          "+5"
      );
    };

    // =====================================================
    // RECEIVE ORDER → STOCK
    // =====================================================

    const receiveOrderIntoStock = () => {
      if (!receiveItem) return;

      const med =
        String(
          receiveItem.medicine || ""
        ).trim();

      const sup =
        String(
          receiveItem.supplier ||
            receiveItem.supplierName ||
            ""
        ).trim();

      const mobile =
        mobileClean(
          receiveItem.supplierMobile ||
            receiveItem.mobile ||
            ""
        );

      const qty =
        number(
          receiveItem.quantity
        );

      const baseRate =
        number(receiveRate);

      const medicineMrp =
        number(receiveMrp);

      const medicineSaleRate =
        number(receiveSaleRate);

      if (!med) {
        alert(
          "⚠️ Medicine Name नहीं है"
        );
        return;
      }

      if (!sup) {
        alert(
          "⚠️ Supplier Name नहीं है"
        );
        return;
      }

      if (qty <= 0) {
        alert(
          "⚠️ Quantity सही नहीं है"
        );
        return;
      }

      if (baseRate <= 0) {
        alert(
          "⚠️ Purchase Rate डालें"
        );
        return;
      }

      if (medicineMrp <= 0) {
        alert(
          "⚠️ MRP डालें"
        );
        return;
      }

      if (medicineSaleRate <= 0) {
        alert(
          "⚠️ Sale Rate डालें"
        );
        return;
      }

      if (!receiveExpiry) {
        alert(
          "⚠️ Expiry डालें"
        );
        return;
      }

      if (
        medicineSaleRate >
        medicineMrp
      ) {
        alert(
          "⚠️ Sale Rate MRP से ज्यादा नहीं हो सकता"
        );
        return;
      }

      const finalRate =
        gstRate(
          baseRate,
          receiveGstType
        );

      const gstAmount =
        finalRate - baseRate;

      const unit =
        receiveItem.unit ||
        "STRIP";

      // IMPORTANT:
      // RECEIVE में COMPANY की condition नहीं है
      const existingIndex =
        currentStock.findIndex(
          (item) =>
            normalize(
              item.medicine ||
                item.name
            ) ===
              normalize(med) &&
            normalize(
              item.batch ||
                item.batchNo
            ) ===
              normalize(
                receiveBatch
              ) &&
            normalize(
              item.supplier ||
                item.supplierName
            ) ===
              normalize(sup) &&
            number(
              item.purchaseRate ||
                item.rate
            ) ===
              baseRate &&
            String(
              item.expiry || ""
            ) ===
              String(
                receiveExpiry || ""
              )
        );

      let updatedStock;

      if (existingIndex >= 0) {
        updatedStock = [
          ...currentStock,
        ];

        const old =
          updatedStock[
            existingIndex
          ];

        updatedStock[
          existingIndex
        ] = {
          ...old,

          quantity:
            number(
              old.quantity
            ) + qty,

          unit:
            old.unit ||
            unit,

          purchaseRate:
            baseRate,

          basePurchaseRate:
            baseRate,

          rate:
            baseRate,

          purchaseRateWithGST:
            finalRate,

          gstType:
            receiveGstType,

          gstPercent:
            receiveGstType,

          gstAmountPerItem:
            gstAmount,

          mrp:
            medicineMrp,

          saleRate:
            medicineSaleRate,

          supplier:
            sup,

          supplierName:
            sup,

          supplierMobile:
            mobile,

          purchaseAmount:
            number(
              old.purchaseAmount
            ) +
            qty * finalRate,

          updatedAt:
            Date.now(),
        };
      } else {
        updatedStock = [
          {
            id:
              makeId(
                "STOCK"
              ),

            medicine:
              med,

            name:
              med,

            barcode:
              receiveBarcode.trim(),

            batch:
              receiveBatch.trim(),

            batchNo:
              receiveBatch.trim(),

            supplier:
              sup,

            supplierName:
              sup,

            supplierMobile:
              mobile,

            quantity:
              qty,

            unit:
              unit,

            purchaseRate:
              baseRate,

            basePurchaseRate:
              baseRate,

            rate:
              baseRate,

            gstType:
              receiveGstType,

            gstPercent:
              receiveGstType,

            gstAmountPerItem:
              gstAmount,

            purchaseRateWithGST:
              finalRate,

            mrp:
              medicineMrp,

            saleRate:
              medicineSaleRate,

            expiry:
              receiveExpiry,

            purchaseAmount:
              qty * finalRate,

            purchaseDate:
              today(),

            date:
              today(),

            createdAt:
              Date.now(),

            updatedAt:
              Date.now(),
          },

          ...currentStock,
        ];
      }

      // ===================================================
      // STOCK SAVE
      // ===================================================

      setStock(
        updatedStock
      );

      writeStorage(
        "stock",
        updatedStock
      );

      // ===================================================
      // SUPPLIER SAVE / UPDATE
      // ===================================================

      const supplierList =
        readStorage(
          "suppliers",
          []
        );

      const supplierIndex =
        supplierList.findIndex(
          (item) =>
            normalize(
              item.name
            ) ===
            normalize(sup)
        );

      const supplierData = {
        id:
          supplierIndex >= 0
            ? supplierList[
                supplierIndex
              ].id
            : makeId(
                "SUPPLIER"
              ),

        name:
          sup,

        mobile:
          mobile,

        whatsapp:
          mobile,

        lastPurchaseDate:
          today(),

        updatedAt:
          Date.now(),
      };

      let updatedSuppliers;

      if (supplierIndex >= 0) {
        updatedSuppliers = [
          ...supplierList,
        ];

        updatedSuppliers[
          supplierIndex
        ] = {
          ...updatedSuppliers[
            supplierIndex
          ],
          ...supplierData,
        };
      } else {
        updatedSuppliers = [
          supplierData,
          ...supplierList,
        ];
      }

      writeStorage(
        "suppliers",
        updatedSuppliers
      );

      // ===================================================
      // PURCHASE HISTORY
      // ===================================================

      const history =
        readStorage(
          "purchaseHistory",
          []
        );

      writeStorage(
        "purchaseHistory",
        [
          {
            id:
              makeId(
                "PURCHASE"
              ),

            medicine:
              med,

            barcode:
              receiveBarcode.trim(),

            batch:
              receiveBatch.trim(),

            supplier:
              sup,

            supplierMobile:
              mobile,

            quantity:
              qty,

            unit:
              unit,

            purchaseRate:
              baseRate,

            purchaseRateWithGST:
              finalRate,

            gstType:
              receiveGstType,

            mrp:
              medicineMrp,

            saleRate:
              medicineSaleRate,

            expiry:
              receiveExpiry,

            purchaseAmount:
              qty * finalRate,

            purchaseDate:
              today(),

            source:
              "PURCHASE_ORDER_RECEIVE",

            createdAt:
              Date.now(),
          },

          ...history,
        ]
      );

      // ===================================================
      // MEDICINE MASTER
      // ===================================================

      const masterList =
        readStorage(
          "medicineMaster",
          []
        );

      const masterIndex =
        masterList.findIndex(
          (item) =>
            normalize(
              item.medicine
            ) ===
              normalize(med) &&
            normalize(
              item.supplier
            ) ===
              normalize(sup)
        );

      const masterData = {
        id:
          masterIndex >= 0
            ? masterList[
                masterIndex
              ].id
            : makeId(
                "MEDICINE"
              ),

        medicine:
          med,

        barcode:
          receiveBarcode.trim(),

        batch:
          receiveBatch.trim(),

        supplier:
          sup,

        supplierMobile:
          mobile,

        purchaseRate:
          baseRate,

        mrp:
          medicineMrp,

        saleRate:
          medicineSaleRate,

        gstType:
          receiveGstType,

        expiry:
          receiveExpiry,

        updatedAt:
          Date.now(),
      };

      let updatedMaster;

      if (masterIndex >= 0) {
        updatedMaster = [
          ...masterList,
        ];

        updatedMaster[
          masterIndex
        ] = {
          ...updatedMaster[
            masterIndex
          ],
          ...masterData,
        };
      } else {
        updatedMaster = [
          masterData,
          ...masterList,
        ];
      }

      writeStorage(
        "medicineMaster",
        updatedMaster
      );

      // ===================================================
      // EVENTS
      // ===================================================

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

      // ===================================================
      // REMOVE RECEIVED ORDER
      // ===================================================

      const remaining =
        orderItems.filter(
          (item) =>
            item.id !==
            receiveItem.id
        );

      setOrderItems(
        remaining
      );

      writeStorage(
        "currentOrder",
        remaining
      );

      // ===================================================
      // CLOSE RECEIVE
      // =====================================================

      setReceiveItem(null);

      setReceiveBarcode("");
      setReceiveBatch("");
      setReceiveRate("");
      setReceiveMrp("");
      setReceiveSaleRate("");
      setReceiveExpiry("");

      setPreviousPurchaseRates([]);
      setPreviousPurchaseRate("");

      alert(
        `✅ ${med} का ${qty} ${unit} माल Receive होकर Stock में Save हो गया`
      );
    };

    // =====================================================
    // REMOVE ORDER
    // =====================================================

    const removeOrderItem = (id) => {
      const updated =
        orderItems.filter(
          (item) =>
            item.id !== id
        );

      setOrderItems(updated);

      writeStorage(
        "currentOrder",
        updated
      );
    };

    // =====================================================
    // CLEAR ORDER
    // =====================================================

    const clearOrder = () => {
      if (!orderItems.length)
        return;

      if (
        !window.confirm(
          "क्या पूरा Order Clear करना चाहते हैं?"
        )
      ) {
        return;
      }

      setOrderItems([]);

      writeStorage(
        "currentOrder",
        []
      );
    };

    // =====================================================
    // GROUP ORDER
    // =====================================================

    const groupedOrders =
      useMemo(() => {
        const groups = {};

        orderItems.forEach(
          (item) => {
            const name =
              item.supplier ||
              "Unknown Supplier";

            if (!groups[name]) {
              groups[name] = {
                supplier:
                  name,

                mobile:
                  item.supplierMobile ||
                  item.mobile ||
                  "",

                items: [],
              };
            }

            groups[name].items.push(
              item
            );
          }
        );

        return Object.values(
          groups
        );
      }, [orderItems]);

    // =====================================================
    // WHATSAPP
    // =====================================================

    const sendWhatsApp = (group) => {
      const lines = [];

      lines.push(
        "🧾 SHIVAM MEDICAL STORE"
      );

      lines.push(
        "📦 PURCHASE ORDER"
      );

      lines.push("");

      group.items.forEach(
        (item, index) => {
          lines.push(
            `${index + 1}. ${item.medicine} - Qty ${item.quantity} ${item.unit || "STRIP"}`
          );
        }
      );

      lines.push("");

      lines.push(
        "कृपया माल भेज दीजिए।"
      );

      lines.push(
        "धन्यवाद 🙏"
      );

      const message =
        encodeURIComponent(
          lines.join("\n")
        );

      let mobile =
        mobileClean(
          group.mobile
        );

      if (mobile.length === 10) {
        mobile =
          "91" + mobile;
      }

      const url = mobile
        ? `https://wa.me/${mobile}?text=${message}`
        : `https://wa.me/?text=${message}`;

      window.open(
        url,
        "_blank"
      );
    };

    // =====================================================
    // UI
    // =====================================================

    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        <h2>💊 Purchase</h2>

        {/* MODE */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              setMode("purchase")
            }
          >
            💊 Purchase
          </button>

          <button
            onClick={() =>
              setMode("order")
            }
          >
            📦 Add New Order
          </button>

          <button
            onClick={goBack}
          >
            ⬅️ Back
          </button>
        </div>

        {/* =================================================
            PURCHASE
        ================================================= */}

        {mode === "purchase" && (
          <div>
            {/* MEDICINE */}

            <div
              style={{
                position: "relative",
                marginBottom: "10px",
              }}
            >
             <div
  style={{
    position: "relative",
    marginBottom: "10px",
  }}
>
  <input
    ref={medicineRef}
    type="text"
    placeholder="💊 Medicine Name (2 letter search)"
    value={medicine}
    onChange={(e) => {
      const value = e.target.value;

      setMedicine(value);
      setMedicineSearch(value);
setPreviousPurchaseRates([]);
setShowPreviousPurchaseHistory(false);
      // 2 letter के बाद ही search
      setShowMedicineSearch(
        normalize(value).length >= 2
      );

      setMedicineHighlight(-1);
    }}
    onFocus={() => {
      setShowMedicineSearch(
        normalize(medicine).length >= 2
      );
    }}
    onKeyDown={handleMedicineKeyDown}
    style={{
      width: "100%",
      padding: "10px",
      boxSizing: "border-box",
    }}
  />

  {showMedicineSearch &&
    medicineSuggestions.length > 0 && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "white",
          border: "1px solid #ccc",
          zIndex: 1000,
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {medicineSuggestions.map(
          (item, index) => (
            <div
              key={
                item.id ||
                `${item.medicine}-${index}`
              }
              onMouseDown={() =>
                selectMedicine(item)
              }
              style={{
                padding: "10px",
                borderBottom:
                  "1px solid #eee",
                cursor: "pointer",
                background:
                  index === medicineHighlight
                    ? "#e8f0fe"
                    : "white",
              }}
            >
              <b>
                {item.medicine || item.name}
              </b>

              <br />

              <small>
                {item.company || ""}
                {" • "}
                {item.supplier ||
                  item.supplierName ||
                  ""}
              </small>
            </div>
          )
        )}
      </div>
    )}
</div>              {showMedicineSearch &&
                medicineSuggestions.length >
                  0 && (
                  <div
                    style={{
                      position:
                        "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background:
                        "white",
                      border:
                        "1px solid #ccc",
                      zIndex: 1000,
                      maxHeight:
                        "300px",
                      overflowY:
                        "auto",
                    }}
                  >
                    {medicineSuggestions.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `${item.medicine}-${index}`
                          }
                          onMouseDown={() =>
                            selectMedicine(
                              item
                            )
                          }
                          style={{
                            padding:
                              "10px",
                            borderBottom:
                              "1px solid #eee",
                            cursor:
                              "pointer",
                            background:
                              index ===
                              medicineHighlight
                                ? "#e8f0fe"
                                : "white",
                          }}
                        >
                          <b>
                            {item.medicine ||
                              item.name}
                          </b>

                          <br />

                          <small>
                            {item.company ||
                              ""}

                            {" • "}

                            {item.supplier ||
                              item.supplierName ||
                              ""}
                          </small>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
{/* =================================================
    PREVIOUS PURCHASE HISTORY - PURCHASE
================================================= */}

{showPreviousPurchaseHistory && (
  <div
    style={{
      marginBottom: "15px",
      padding: "12px",
      background: "#fff8e1",
      border: "2px solid #ffca28",
      borderRadius: "8px",
    }}
  >
    <div
      style={{
        fontWeight: "bold",
        fontSize: "17px",
        marginBottom: "10px",
      }}
    >
      💰 Previous Purchase Rates
    </div>

    {previousPurchaseRates.length > 0 ? (
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#ffffff",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: "left",
              }}
            >
              Stockist / Supplier
            </th>

            <th
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: "right",
              }}
            >
              Previous Rate
            </th>
          </tr>
        </thead>

        <tbody>
          {previousPurchaseRates.map(
            (rateItem, index) => {
              const isCurrentSupplier =
                normalize(
                  rateItem.supplier
                ) ===
                normalize(supplier);

              return (
                <tr
                  key={`${rateItem.supplier}-${index}`}
                  style={{
                    background:
                      isCurrentSupplier
                        ? "#e8f5e9"
                        : "#ffffff",
                  }}
                >
                  <td
                    style={{
                      border:
                        "1px solid #ddd",
                      padding: "8px",
                      fontWeight:
                        isCurrentSupplier
                          ? "bold"
                          : "normal",
                    }}
                  >
                    {isCurrentSupplier
                      ? "👉 "
                      : ""}

                    {rateItem.supplier}
                  </td>

                  <td
                    style={{
                      border:
                        "1px solid #ddd",
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    ₹{" "}
                    {number(
                      rateItem.rate
                    ).toFixed(2)}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    ) : (
      <div
        style={{
          color: "#666",
          padding: "5px 0",
        }}
      >
        इस Medicine का पुराना Stockist Rate नहीं मिला।
      </div>
    )}

    {(() => {
      const currentRate =
        previousPurchaseRates.find(
          (rateItem) =>
            normalize(
              rateItem.supplier
            ) ===
            normalize(supplier)
        );

      if (!currentRate) {
        return null;
      }

      return (
        <div
          style={{
            marginTop: "10px",
            padding: "9px",
            background: "#e8f5e9",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
        >
          📌 Current Stockist का Previous Rate:
          {" "}
          ₹{" "}
          {number(
            currentRate.rate
          ).toFixed(2)}
        </div>
      );
    })()}
  </div>
)}
            {/* COMPANY */}

            <input
              ref={companyRef}
              placeholder="Company"
              value={company}
              onChange={(e) =>
                setCompany(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  barcodeRef,
                  medicineRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* BARCODE */}

            <input
              ref={barcodeRef}
              placeholder="Barcode"
              value={barcode}
              onChange={(e) => {
                const value =
                  e.target.value;

                setBarcode(value);

                const item =
                  findBarcodeItem(
                    value
                  );

                if (item) {
                  selectMedicine(item);
                }
              }}
              onKeyDown={(e) =>
                downUp(
                  e,
                  batchRef,
                  companyRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* BATCH */}

            <input
              ref={batchRef}
              placeholder="Batch"
              value={batch}
              onChange={(e) =>
                setBatch(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  supplierRef,
                  barcodeRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* SUPPLIER */}

            <div
              style={{
                position: "relative",
                marginBottom: "10px",
              }}
            >
              <input
                ref={supplierRef}
                placeholder="🚚 Supplier Search"
                value={supplier}
                onChange={(e) =>
                  changeSupplier(
                    e.target.value
                  )
                }
                onFocus={() =>
                  setShowSupplierSearch(
                    true
                  )
                }
                onKeyDown={
                  handleSupplierKeyDown
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing:
                    "border-box",
                }}
              />

              {showSupplierSearch &&
                supplierSuggestions.length >
                  0 && (
                  <div
                    style={{
                      position:
                        "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background:
                        "white",
                      border:
                        "1px solid #ccc",
                      zIndex: 1000,
                      maxHeight:
                        "250px",
                      overflowY:
                        "auto",
                    }}
                  >
                    {supplierSuggestions.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `${item.name}-${index}`
                          }
                          onMouseDown={() =>
                            selectSupplier(
                              item
                            )
                          }
                          style={{
                            padding:
                              "10px",
                            cursor:
                              "pointer",
                            borderBottom:
                              "1px solid #eee",
                            background:
                              index ===
                              supplierHighlight
                                ? "#e8f0fe"
                                : "white",
                          }}
                        >
                          <b>
                            {item.name}
                          </b>

                          <br />

                          <small>
                            {
                              item.mobile
                            }
                          </small>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* SUPPLIER MOBILE */}

            <input
              ref={
                supplierMobileRef
              }
              placeholder="Supplier Mobile No."
              value={supplierMobile}
              onChange={(e) =>
                setSupplierMobile(
                  mobileClean(
                    e.target.value
                  )
                )
              }
              maxLength={10}
              onKeyDown={(e) =>
                downUp(
                  e,
                  quantityRef,
                  supplierRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* SAVE SUPPLIER */}

            <button
              type="button"
              onClick={saveSupplier}
              style={{
                marginBottom:
                  "15px",
              }}
            >
              🚚 Save Supplier
            </button>

            <br />

            {/* QUANTITY */}

            <input
              ref={quantityRef}
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  rateRef,
                  supplierMobileRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* PURCHASE RATE */}

            <input
              ref={rateRef}
              type="number"
              placeholder="Purchase Rate"
              value={rate}
              onChange={(e) =>
                setRate(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  gstRef,
                  quantityRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />
{/* GST ADDED RATE */}

<div
  style={{
    marginBottom: "10px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "6px",
  }}
>
  <div
    style={{
      fontWeight: "bold",
      marginBottom: "5px",
    }}
  >
    GST जोड़कर Purchase Rate
  </div>

  <input
    type="number"
    value={
      rate !== ""
        ? gstRate(
            Number(rate),
            gstType
          ).toFixed(2)
        : ""
    }
    readOnly
    placeholder="GST जोड़कर Rate"
    style={{
      width: "100%",
      padding: "10px",
      boxSizing: "border-box",
      background: "#eeeeee",
      fontWeight: "bold",
    }}
  />
</div>
            {/* GST */}

            <select
              ref={gstRef}
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
              onKeyDown={(e) =>
                downUp(
                  e,
                  mrpRef,
                  rateRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
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

            {/* MRP */}

            <input
              ref={mrpRef}
              type="number"
              placeholder="MRP"
              value={mrp}
              onChange={(e) =>
                setMrp(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  saleRateRef,
                  gstRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* SALE RATE */}

            <input
              ref={saleRateRef}
              type="number"
              placeholder="Sale Rate"
              value={saleRate}
              onChange={(e) =>
                setSaleRate(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  expiryRef,
                  mrpRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* EXPIRY */}

            <input
              ref={expiryRef}
              type="date"
              value={expiry}
              onChange={(e) =>
                setExpiry(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                downUp(
                  e,
                  savePurchaseRef,
                  saleRateRef
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "15px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* SAVE PURCHASE */}

            <button
              ref={savePurchaseRef}
              onClick={savePurchase}
              style={{
                padding:
                  "12px 25px",
                fontWeight:
                  "bold",
              }}
            >
              💾 Save Purchase
            </button>
          </div>
        )}

        {/* =================================================
            ADD NEW ORDER
        ================================================= */}

        {mode === "order" && (
          <div>
            <h3>
              📦 Add New Purchase Order
            </h3>

            {/* ORDER MEDICINE */}

            <div
              style={{
                position: "relative",
                marginBottom: "10px",
              }}
            >
              <input
                ref={
                  orderMedicineRef
                }
                type="text"
                placeholder="💊 Medicine Name"
                value={orderMedicine}
                onChange={(e) => {
                  setOrderMedicine(
                    e.target.value
                  );

                  setShowOrderMedicineSearch(
                    true
                  );

                  setOrderMedicineHighlight(
                    -1
                  );
                }}
                onFocus={() =>
                  setShowOrderMedicineSearch(
                    true
                  )
                }
                onKeyDown={
                  handleOrderMedicineKeyDown
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing:
                    "border-box",
                }}
              />

              {showOrderMedicineSearch &&
                orderMedicineSuggestions.length >
                  0 && (
                  <div
                    style={{
                      position:
                        "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background:
                        "white",
                      border:
                        "1px solid #ccc",
                      zIndex: 1000,
                      maxHeight:
                        "300px",
                      overflowY:
                        "auto",
                    }}
                  >
                    {orderMedicineSuggestions.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `${item.medicine}-${index}`
                          }
                          onMouseDown={() =>
                            selectOrderMedicine(
                              item
                            )
                          }
                          style={{
                            padding:
                              "10px",
                            borderBottom:
                              "1px solid #eee",
                            cursor:
                              "pointer",
                            background:
                              index ===
                              orderMedicineHighlight
                                ? "#e8f0fe"
                                : "white",
                          }}
                        >
                          <b>
                            {item.medicine ||
                              item.name}
                          </b>

                          <br />

                          <small>
                            {item.company ||
                              ""}

                            {" • "}

                            {item.supplier ||
                              item.supplierName ||
                              ""}
                          </small>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* ORDER SUPPLIER */}

            <div
              style={{
                position: "relative",
                marginBottom:
                  "10px",
              }}
            >
              <input
                ref={
                  orderSupplierRef
                }
                type="text"
                placeholder="🚚 Supplier Search"
                value={orderSupplier}
                onChange={(e) =>
                  changeOrderSupplier(
                    e.target.value
                  )
                }
                onFocus={() =>
                  setShowOrderSupplierSearch(
                    true
                  )
                }
                onKeyDown={
                  handleOrderSupplierKeyDown
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  boxSizing:
                    "border-box",
                }}
              />

              {showOrderSupplierSearch &&
                orderSupplierSuggestions.length >
                  0 && (
                  <div
                    style={{
                      position:
                        "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background:
                        "white",
                      border:
                        "1px solid #ccc",
                      zIndex: 1000,
                      maxHeight:
                        "250px",
                      overflowY:
                        "auto",
                    }}
                  >
                    {orderSupplierSuggestions.map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `${item.name}-${index}`
                          }
                          onMouseDown={() =>
                            selectOrderSupplier(
                              item
                            )
                          }
                          style={{
                            padding:
                              "10px",
                            borderBottom:
                              "1px solid #eee",
                            cursor:
                              "pointer",
                            background:
                              index ===
                              orderSupplierHighlight
                                ? "#e8f0fe"
                                : "white",
                          }}
                        >
                          <b>
                            {item.name}
                          </b>

                          <br />

                          <small>
                            {
                              item.mobile
                            }
                          </small>
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* ORDER SUPPLIER MOBILE */}

            <input
              ref={
                orderSupplierMobileRef
              }
              type="text"
              placeholder="Supplier Mobile No."
              value={
                orderSupplierMobile
              }
              onChange={(e) =>
                setOrderSupplierMobile(
                  mobileClean(
                    e.target.value
                  )
                )
              }
              maxLength={10}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();

                  orderQuantityRef.current?.focus();
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();

                  orderSupplierRef.current?.focus();
                }
              }}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom:
                  "10px",
                boxSizing:
                  "border-box",
              }}
            />

            {/* QTY + UNIT */}

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom:
                  "10px",
              }}
            >
              <input
                ref={
                  orderQuantityRef
                }
                type="number"
                min="1"
                placeholder="Qty"
                value={
                  orderQuantity
                }
                onChange={(e) =>
                  setOrderQuantity(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "ArrowDown"
                  ) {
                    e.preventDefault();

                    orderUnitRef.current?.focus();
                  }

                  if (
                    e.key ===
                    "ArrowUp"
                  ) {
                    e.preventDefault();

                    orderSupplierMobileRef.current?.focus();
                  }

                  if (
                    e.key ===
                    "Enter"
                  ) {
                    e.preventDefault();

                    addOrderItem();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                }}
              />

              {/* SELECTABLE UNIT */}

              <select
                ref={orderUnitRef}
                value={orderUnit}
                onChange={(e) =>
                  setOrderUnit(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();

                    addOrderRef.current?.focus();
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();

                    orderQuantityRef.current?.focus();
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();

                    addOrderItem();
                  }
                }}
                style={{
                  padding: "10px",
                  minWidth: "110px",
                }}
              >
                <option value="STRIP">
                  Strip
                </option>

                <option value="BOX">
                  Box
                </option>

                <option value="PCS">
                  PCS
                </option>
              </select>
            </div>

            {/* ADD ORDER */}

            <button
              ref={addOrderRef}
              onClick={addOrderItem}
              style={{
                padding:
                  "10px 20px",
              }}
            >
              ➕ Add Order
            </button>

            <button
              onClick={clearOrder}
              style={{
                marginLeft:
                  "10px",
                padding:
                  "10px 20px",
              }}
            >
              🗑️ Clear Order
            </button>

            {/* ORDER LIST */}

            <h3
              style={{
                marginTop:
                  "25px",
              }}
            >
              📋 Current Order
            </h3>

            {groupedOrders.map(
              (group) => (
                <div
                  key={
                    group.supplier
                  }
                  style={{
                    border:
                      "1px solid #ccc",
                    padding:
                      "15px",
                    marginBottom:
                      "15px",
                    borderRadius:
                      "8px",
                  }}
                >
                  <h4>
                    🚚{" "}
                    {
                      group.supplier
                    }
                  </h4>

                  <div>
                    📱{" "}
                    {
                      group.mobile ||
                      "Mobile नहीं है"
                    }
                  </div>

                  <table
                    style={{
                      width:
                        "100%",
                      marginTop:
                        "10px",
                      borderCollapse:
                        "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>
                          Medicine
                        </th>

                        <th>
                          Qty
                        </th>

                        <th>
                          Unit
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {group.items.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              {
                                item.medicine
                              }
                            </td>

                            <td>
                              {
                                item.quantity
                              }
                            </td>

                            <td>
                              {item.unit ||
                                "Strip"}
                            </td>

                            <td>
                              <button
                                onClick={() =>
                                  openReceiveOrder(
                                    item
                                  )
                                }
                                style={{
                                  marginRight:
                                    "6px",
                                  padding:
                                    "6px 10px",
                                }}
                              >
                                📥 Receive
                              </button>

                              <button
                                onClick={() =>
                                  removeOrderItem(
                                    item.id
                                  )
                                }
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  <button
                    onClick={() =>
                      sendWhatsApp(
                        group
                      )
                    }
                    style={{
                      marginTop:
                        "10px",
                      padding:
                        "10px 18px",
                    }}
                  >
                    📲 WhatsApp Order
                  </button>
                </div>
              )
            )}

            {/* =================================================
                RECEIVE FORM
            ================================================= */}

            {receiveItem && (
              <div
                style={{
                  marginTop: "25px",
                  padding: "20px",
                  border:
                    "2px solid #4caf50",
                  borderRadius: "10px",
                  background:
                    "#f7fff7",
                }}
              >
                <h3>
                  📥 Receive माल
                </h3>

                <div
                  style={{
                    padding:
                      "10px",
                    marginBottom:
                      "15px",
                    background:
                      "#e8f5e9",
                    borderRadius:
                      "6px",
                  }}
                >
                  <div>
                    <b>Medicine:</b>{" "}
                    {
                      receiveItem.medicine
                    }
                  </div>

                  <div>
                    <b>Supplier:</b>{" "}
                    {
                      receiveItem.supplier ||
                      receiveItem.supplierName ||
                      "-"
                    }
                  </div>

                  <div>
                    <b>Mobile:</b>{" "}
                    {
                      receiveItem.supplierMobile ||
                      receiveItem.mobile ||
                      "Mobile नहीं है"
                    }
                  </div>

                  <div>
                    <b>Order Qty:</b>{" "}
                    {
                      receiveItem.quantity
                    }{" "}
                    {
                      receiveItem.unit ||
                      "STRIP"
                    }
                  </div>
                </div>

                {/* =================================================
                    PREVIOUS STOCKIST RATES
                ================================================= */}

                <div
                  style={{
                    marginBottom: "15px",
                    padding: "12px",
                    background: "#fff8e1",
                    border: "2px solid #ffca28",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "17px",
                      marginBottom: "10px",
                    }}
                  >
                    💰 Previous Purchase Rates
                  </div>

                  {previousPurchaseRates.length > 0 ? (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        background: "#ffffff",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              textAlign: "left",
                            }}
                          >
                            Stockist / Supplier
                          </th>

                          <th
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              textAlign: "right",
                            }}
                          >
                            Previous Rate
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {previousPurchaseRates.map(
                          (rateItem, index) => {
                            const isCurrentSupplier =
                              normalize(
                                rateItem.supplier
                              ) ===
                              normalize(
                                receiveItem.supplier ||
                                  receiveItem.supplierName ||
                                  ""
                              );

                            return (
                              <tr
                                key={`${rateItem.supplier}-${index}`}
                                style={{
                                  background:
                                    isCurrentSupplier
                                      ? "#e8f5e9"
                                      : "white",
                                }}
                              >
                                <td
                                  style={{
                                    border:
                                      "1px solid #ddd",
                                    padding: "8px",
                                    fontWeight:
                                      isCurrentSupplier
                                        ? "bold"
                                        : "normal",
                                  }}
                                >
                                  {isCurrentSupplier
                                    ? "👉 "
                                    : ""}
                                  {rateItem.supplier}
                                </td>

                                <td
                                  style={{
                                    border:
                                      "1px solid #ddd",
                                    padding: "8px",
                                    textAlign:
                                      "right",
                                    fontWeight:
                                      "bold",
                                  }}
                                >
                                  ₹{" "}
                                  {number(
                                    rateItem.rate
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        color: "#666",
                        padding: "5px 0",
                      }}
                    >
                      इस Medicine का पुराना Stockist Rate नहीं मिला।
                    </div>
                  )}

                  {previousPurchaseRate !== "" && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "9px",
                        background: "#e8f5e9",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      📌 Current Order Stockist का Previous Rate:
                      {" "}
                      ₹{" "}
                      {number(
                        previousPurchaseRate
                      ).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* COMPANY REMOVED FROM RECEIVE FORM */}

                {/* BARCODE */}

                <input
                  placeholder="Barcode"
                  value={
                    receiveBarcode
                  }
                  onChange={(e) =>
                    setReceiveBarcode(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* BATCH */}

                <input
                  placeholder="Batch"
                  value={
                    receiveBatch
                  }
                  onChange={(e) =>
                    setReceiveBatch(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* PURCHASE RATE */}

                <input
                  type="number"
                  placeholder="Purchase Rate"
                  value={
                    receiveRate
                  }
                  onChange={(e) =>
                    setReceiveRate(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* GST */}

                <select
                  value={
                    receiveGstType
                  }
                  onChange={(e) => {
                    setReceiveGstType(
                      e.target.value
                    );

                    localStorage.setItem(
                      "purchaseGST",
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
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

                {/* MRP */}

                <input
                  type="number"
                  placeholder="MRP"
                  value={
                    receiveMrp
                  }
                  onChange={(e) =>
                    setReceiveMrp(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* SALE RATE */}

                <input
                  type="number"
                  placeholder="Sale Rate"
                  value={
                    receiveSaleRate
                  }
                  onChange={(e) =>
                    setReceiveSaleRate(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "10px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* EXPIRY */}

                <input
                  type="date"
                  value={
                    receiveExpiry
                  }
                  onChange={(e) =>
                    setReceiveExpiry(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "10px",
                    marginBottom:
                      "15px",
                    boxSizing:
                      "border-box",
                  }}
                />

                {/* RECEIVE SAVE */}

                <button
                  onClick={
                    receiveOrderIntoStock
                  }
                  style={{
                    padding:
                      "12px 20px",
                    fontWeight:
                      "bold",
                    marginRight:
                      "10px",
                  }}
                >
                  ✅ Receive & Save Stock
                </button>

                {/* CANCEL */}

                <button
                  onClick={() => {
                    setReceiveItem(null);
                    setPreviousPurchaseRates([]);
                    setPreviousPurchaseRate("");
                  }}
                  style={{
                    padding:
                      "12px 20px",
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  export default Purchase;