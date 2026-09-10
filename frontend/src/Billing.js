
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// =====================================================
// ONLINE BACKEND
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://shivam-medical-erp.onrender.com";

function Billing({ stock, setStock, goBack }) {
  // =====================================================
  // CUSTOMER
  // =====================================================

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");

  const [customerSuggestions, setCustomerSuggestions] =
    useState([]);

  const [showCustomerSuggestions, setShowCustomerSuggestions] =
    useState(false);

  // =====================================================
  // MEDICINE
  // =====================================================

  const [medicineSearch, setMedicineSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const searchRef = useRef(null);
  const quantityRef = useRef(null);
  const discountRef = useRef(null);
  const paymentRef = useRef(null);

  // =====================================================
  // PREVENT DOUBLE BILL SAVE
  // =====================================================

  const savingBillRef = useRef(false);

  // =====================================================
  // BILL ITEMS
  // =====================================================

  const [billItems, setBillItems] = useState([]);

  // =====================================================
  // PAYMENT
  // =====================================================

  const [billPayment, setBillPayment] = useState("");

  // =====================================================
  // DISCOUNT
  // =====================================================

  const [discountPercent, setDiscountPercent] = useState("");

  // =====================================================
  // ADVANCE
  // =====================================================

  const [customerAdvance, setCustomerAdvance] = useState(0);
  const [advanceMatched, setAdvanceMatched] = useState(false);

  // =====================================================
  // SMART BILLING UI
  // =====================================================

  const [showBillSummary, setShowBillSummary] = useState(true);
  const [lastSavedBillNo, setLastSavedBillNo] = useState("");
  const [lastSavedAmount, setLastSavedAmount] = useState(0);

  const currentStock = Array.isArray(stock) ? stock : [];

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

  const roundMoney = (value) =>
    Number(number(value).toFixed(2));

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

  const readStorage = (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const data = JSON.parse(raw);

      return data ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  };

  // =====================================================
  // CUSTOMER SEARCH DATABASE
  // =====================================================

  const customerSearchList = useMemo(() => {
    const customers = [];
    const seen = new Set();

    const addCustomer = (name, mobile) => {
      const cleanName = String(name || "").trim();
      const cleanMobile = mobileClean(mobile);

      if (!cleanName && !cleanMobile) {
        return;
      }

      const key =
        cleanMobile ||
        normalize(cleanName);

      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);

      customers.push({
        customerName: cleanName,
        customerMobile: cleanMobile,
      });
    };

    const sources = [
      readStorage("customers", []),
      readStorage("bills", []),
      readStorage("sales", []),
      readStorage("customerCredits", []),
      readStorage("customerPayments", []),
      readStorage("advances", []),
      readStorage("customerAdvances", []),
    ];

    sources.forEach((source) => {
      if (!Array.isArray(source)) {
        return;
      }

      source.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        addCustomer(
          item.customerName ||
            item.customer ||
            item.name ||
            item.partyName,
          item.customerMobile ||
            item.mobile ||
            item.phone ||
            item.mobileNumber ||
            item.contact
        );
      });
    });

    return customers;
  }, []);

  // =====================================================
  // CUSTOMER SEARCH FILTER
  // =====================================================

  useEffect(() => {
    const nameSearch = normalize(customerName);
    const mobileSearch = mobileClean(customerMobile);

    if (
      nameSearch.length === 0 &&
      mobileSearch.length === 0
    ) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      return;
    }

    const filtered = customerSearchList.filter(
      (customer) => {
        const name = normalize(
          customer.customerName
        );

        const mobile = mobileClean(
          customer.customerMobile
        );

        return (
          (nameSearch &&
            name.includes(nameSearch)) ||
          (mobileSearch &&
            mobile.includes(mobileSearch))
        );
      }
    );

    setCustomerSuggestions(
      filtered.slice(0, 10)
    );
  }, [
    customerName,
    customerMobile,
    customerSearchList,
  ]);

  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  const selectCustomer = (customer) => {
    if (!customer) {
      return;
    }

    setCustomerName(
      customer.customerName || ""
    );

    setCustomerMobile(
      customer.customerMobile || ""
    );

    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);

    setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
  };

  // =====================================================
  // CUSTOMER KEYBOARD
  // =====================================================

  const handleCustomerNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (customerSuggestions.length > 0) {
        selectCustomer(
          customerSuggestions[0]
        );
        return;
      }

      searchRef.current?.focus();
    }

    if (e.key === "Escape") {
      setShowCustomerSuggestions(false);
    }
  };

  const handleCustomerMobileKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (customerSuggestions.length > 0) {
        selectCustomer(
          customerSuggestions[0]
        );
        return;
      }

      searchRef.current?.focus();
    }

    if (e.key === "Escape") {
      setShowCustomerSuggestions(false);
    }
  };

  // =====================================================
  // MEDICINE SEARCH
  // =====================================================

  const medicineSuggestions = useMemo(() => {
    const search = normalize(medicineSearch);

    if (!search) {
      return [];
    }

    return currentStock
      .filter((item) => {
        const medicine = normalize(
          item.medicine || item.name
        );

        const company = normalize(
          item.company
        );

        const barcode = normalize(
          item.barcode ||
            item.barCode ||
            item.Barcode ||
            item.barcodeNo ||
            item.barcodeNumber ||
            item.code
        );

        return (
          medicine.includes(search) ||
          company.includes(search) ||
          barcode.includes(search)
        );
      })
      .slice(0, 15);
  }, [
    medicineSearch,
    currentStock,
  ]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [medicineSearch]);

  // =====================================================
  // SELECT MEDICINE
  // =====================================================

  const selectMedicine = (item) => {
    if (!item) {
      return;
    }

    setSelectedMedicine(item);

    setMedicineSearch(
      item.medicine ||
        item.name ||
        ""
    );

    setHighlightIndex(0);

    setTimeout(() => {
      quantityRef.current?.focus();
    }, 50);
  };

  // =====================================================
  // MEDICINE KEYBOARD
  // =====================================================

  const handleMedicineKeyDown = (e) => {
    if (!medicineSuggestions.length) {
      if (e.key === "Enter") {
        e.preventDefault();
        quantityRef.current?.focus();
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setHighlightIndex((prev) =>
        prev <
        medicineSuggestions.length - 1
          ? prev + 1
          : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setHighlightIndex((prev) =>
        prev > 0
          ? prev - 1
          : medicineSuggestions.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const item =
        medicineSuggestions[
          highlightIndex
        ];

      if (item) {
        selectMedicine(item);
      }
    }

    if (e.key === "Escape") {
      setMedicineSearch("");
      setSelectedMedicine(null);
    }
  };

  // =====================================================
  // PREVIOUS CUSTOMER MEDICINE HISTORY
  // =====================================================

  const previousMedicinePurchases = useMemo(() => {
    if (!selectedMedicine) {
      return [];
    }

    const medicineName = normalize(
      selectedMedicine.medicine ||
        selectedMedicine.name
    );

    const customerNameClean =
      normalize(customerName);

    const customerMobileClean =
      mobileClean(customerMobile);

    if (!medicineName) {
      return [];
    }

    if (
      !customerNameClean &&
      !customerMobileClean
    ) {
      return [];
    }

    const billsStorage =
      readStorage("bills", []);

    const bills =
      Array.isArray(billsStorage)
        ? billsStorage
        : [];

    const salesStorage =
      readStorage("sales", []);

    const sales =
      Array.isArray(salesStorage)
        ? salesStorage
        : [];

    const allBills = [
      ...bills,
      ...sales,
    ];

    const uniqueBills = [];
    const seenBills = new Set();

    allBills.forEach((bill) => {
      if (!bill || typeof bill !== "object") {
        return;
      }

      const uniqueKey =
        bill.id ||
        bill.billNo ||
        (
          String(
            bill.createdAt ||
              bill.date ||
              ""
          ) +
          "_" +
          String(
            bill.customerName ||
              bill.customer ||
              ""
          )
        );

      if (seenBills.has(uniqueKey)) {
        return;
      }

      seenBills.add(uniqueKey);
      uniqueBills.push(bill);
    });

    const isSameCustomer = (bill) => {
      const billName =
        normalize(
          bill.customerName ||
            bill.customer ||
            bill.name
        );

      const billMobile =
        mobileClean(
          bill.customerMobile ||
            bill.mobile
        );

      if (
        customerMobileClean &&
        billMobile
      ) {
        return (
          customerMobileClean ===
          billMobile
        );
      }

      if (
        customerNameClean &&
        billName
      ) {
        return (
          customerNameClean ===
          billName
        );
      }

      return false;
    };

    const history = [];

    uniqueBills.forEach((bill) => {
      if (!isSameCustomer(bill)) {
        return;
      }

      const items =
        Array.isArray(bill.items)
          ? bill.items
          : [];

      items.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        const itemMedicine =
          normalize(
            item.medicine ||
              item.name
          );

        if (
          itemMedicine !==
          medicineName
        ) {
          return;
        }

        const rate = number(
          item.saleRate ||
            item.rate ||
            item.mrp
        );

        const qty = number(
          item.quantity ||
            item.qty
        );

        const amount = number(
          item.total ||
            item.amount
        );

        history.push({
          id:
            bill.id ||
            bill.billNo ||
            makeId("HISTORY"),

          billNo:
            bill.billNo ||
            bill.id ||
            "-",

          date:
            bill.billDate ||
            bill.date ||
            (
              bill.createdAt
                ? new Date(
                    bill.createdAt
                  )
                    .toISOString()
                    .slice(0, 10)
                : "-"
            ),

          rate:
            roundMoney(rate),

          quantity:
            qty,

          amount:
            roundMoney(
              amount ||
                qty * rate
            ),
        });
      });
    });

    history.sort((a, b) => {
      const dateA =
        new Date(a.date).getTime() || 0;

      const dateB =
        new Date(b.date).getTime() || 0;

      return dateB - dateA;
    });

    return history.slice(0, 10);
  }, [
    customerName,
    customerMobile,
    selectedMedicine,
  ]);

  // =====================================================
  // ADD ITEM
  // =====================================================

  const addItem = () => {
    if (!selectedMedicine) {
      alert(
        "⚠️ पहले Medicine Select करें"
      );

      searchRef.current?.focus();

      return;
    }

    const qty = number(quantity);

    if (qty <= 0) {
      alert(
        "⚠️ Quantity सही डालें"
      );

      quantityRef.current?.focus();

      return;
    }

    const stockQty = number(
      selectedMedicine.quantity
    );

    if (qty > stockQty) {
      alert(
        `⚠️ Stock में केवल ${stockQty} उपलब्ध है`
      );

      quantityRef.current?.focus();

      return;
    }

    const saleRate = number(
      selectedMedicine.saleRate ||
        selectedMedicine.mrp ||
        selectedMedicine.rate
    );

    if (saleRate <= 0) {
      alert(
        "⚠️ Sale Rate उपलब्ध नहीं है"
      );

      return;
    }

    const existingIndex =
      billItems.findIndex(
        (item) =>
          item.stockId ===
          (
            selectedMedicine.id ||
            ""
          )
      );

    if (existingIndex >= 0) {
      const existingItem =
        billItems[existingIndex];

      const newQty =
        number(existingItem.quantity) +
        qty;

      if (newQty > stockQty) {
        alert(
          `⚠️ Total quantity ${newQty} है, लेकिन stock में केवल ${stockQty} है`
        );

        return;
      }

      const updatedItems = [
        ...billItems,
      ];

      updatedItems[
        existingIndex
      ] = {
        ...existingItem,

        quantity: newQty,

        amount:
          roundMoney(
            newQty * saleRate
          ),

        total:
          roundMoney(
            newQty * saleRate
          ),
      };

      setBillItems(
        updatedItems
      );
    } else {
      const item = {
        id: makeId("BILLITEM"),

        stockId:
          selectedMedicine.id || "",

        medicine:
          selectedMedicine.medicine ||
          selectedMedicine.name ||
          "",

        company:
          selectedMedicine.company || "",

        batch:
          selectedMedicine.batch ||
          selectedMedicine.batchNo ||
          "",

        barcode:
          selectedMedicine.barcode ||
          selectedMedicine.barCode ||
          "",

        quantity: qty,

        saleRate:
          roundMoney(saleRate),

        mrp:
          roundMoney(
            selectedMedicine.mrp
          ),

        amount:
          roundMoney(
            qty * saleRate
          ),

        total:
          roundMoney(
            qty * saleRate
          ),
      };

      setBillItems((prev) => [
        ...prev,
        item,
      ]);
    }

    setMedicineSearch("");
    setSelectedMedicine(null);
    setQuantity("");

    setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
  };

  // =====================================================
  // QUANTITY KEYBOARD
  // =====================================================

  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      searchRef.current?.focus();
    }
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (id) => {
    setBillItems((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  // =====================================================
  // BILL CALCULATIONS
  // =====================================================

  const billTotal = roundMoney(
    billItems.reduce(
      (sum, item) =>
        sum + number(item.total),
      0
    )
  );

  const totalItems =
    billItems.length;

  const totalQuantity =
    billItems.reduce(
      (sum, item) =>
        sum + number(item.quantity),
      0
    );

  const discountPercentValue =
    Math.min(
      100,
      Math.max(
        0,
        number(discountPercent)
      )
    );

  const discountAmount = roundMoney(
    billTotal *
      discountPercentValue /
      100
  );

  const finalBillTotal = roundMoney(
    Math.max(
      billTotal -
        discountAmount,
      0
    )
  );

  // =====================================================
  // FIND CUSTOMER ADVANCE
  // =====================================================

  const findCustomerAdvance = (
    name,
    mobile
  ) => {
    const cleanName =
      normalize(name);

    const cleanMobile =
      mobileClean(mobile);

    if (
      !cleanName &&
      !cleanMobile
    ) {
      return 0;
    }

    const isSameCustomer = (item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const itemName =
        normalize(
          item.customerName ||
            item.customer ||
            item.name
        );

      const itemMobile =
        mobileClean(
          item.customerMobile ||
            item.mobile
        );

      const mobileMatch =
        cleanMobile &&
        itemMobile &&
        cleanMobile ===
          itemMobile;

      const nameMatch =
        cleanName &&
        itemName &&
        cleanName ===
          itemName;

      return (
        mobileMatch ||
        nameMatch
      );
    };

    const getAdvanceAmount = (item) => {
      if (
        item === null ||
        item === undefined
      ) {
        return 0;
      }

      if (
        typeof item === "number"
      ) {
        return Math.max(
          0,
          roundMoney(item)
        );
      }

      if (
        typeof item === "object"
      ) {
        const value =
          item.amount ??
          item.advance ??
          item.advanceAmount ??
          item.remainingAdvance ??
          item.currentAdvance ??
          item.balance ??
          0;

        return Math.max(
          0,
          roundMoney(value)
        );
      }

      return 0;
    };

    const advancesStorage =
      readStorage(
        "advances",
        []
      );

    const advancesList =
      Array.isArray(
        advancesStorage
      )
        ? advancesStorage
        : [];

    const advanceRecords =
      advancesList.filter(
        isSameCustomer
      );

    if (
      advanceRecords.length > 0
    ) {
      return getAdvanceAmount(
        advanceRecords[0]
      );
    }

    const customerAdvancesStorage =
      readStorage(
        "customerAdvances",
        []
      );

    if (
      Array.isArray(
        customerAdvancesStorage
      )
    ) {
      const customerAdvanceRecords =
        customerAdvancesStorage.filter(
          isSameCustomer
        );

      if (
        customerAdvanceRecords.length > 0
      ) {
        return getAdvanceAmount(
          customerAdvanceRecords[0]
        );
      }
    }

    if (
      customerAdvancesStorage &&
      typeof customerAdvancesStorage ===
        "object" &&
      !Array.isArray(
        customerAdvancesStorage
      )
    ) {
      const possibleKeys = [];

      if (cleanMobile) {
        possibleKeys.push(
          cleanMobile
        );
      }

      if (cleanName) {
        possibleKeys.push(
          cleanName
        );
      }

      if (
        cleanName &&
        cleanMobile
      ) {
        possibleKeys.push(
          `${cleanName}_${cleanMobile}`
        );
      }

      for (
        const key of possibleKeys
      ) {
        const record =
          customerAdvancesStorage[
            key
          ];

        if (
          record !== undefined &&
          record !== null
        ) {
          return getAdvanceAmount(
            record
          );
        }
      }
    }

    return 0;
  };

  // =====================================================
  // CUSTOMER ADVANCE WATCH
  // =====================================================

  useEffect(() => {
    const timer =
      setTimeout(() => {
        const advance =
          findCustomerAdvance(
            customerName,
            customerMobile
          );

        setCustomerAdvance(
          advance
        );

        setAdvanceMatched(
          advance > 0
        );
      }, 100);

    return () =>
      clearTimeout(timer);
  }, [
    customerName,
    customerMobile,
  ]);

  // =====================================================
  // PAYMENT CALCULATIONS
  // =====================================================

  const paidEntered =
    Math.max(
      0,
      roundMoney(billPayment)
    );

  const billPaid = roundMoney(
    Math.min(
      paidEntered,
      finalBillTotal
    )
  );

  const newBillUdhari = roundMoney(
    Math.max(
      finalBillTotal -
        billPaid,
      0
    )
  );

  const advanceAdjusted =
    roundMoney(
      Math.min(
        customerAdvance,
        newBillUdhari
      )
    );

  const bakiUdhari =
    roundMoney(
      Math.max(
        newBillUdhari -
          advanceAdjusted,
        0
      )
    );

  const billAfterAdvance =
    roundMoney(
      bakiUdhari
    );

  const remainingOldAdvance =
    roundMoney(
      Math.max(
        customerAdvance -
          advanceAdjusted,
        0
      )
    );

  const newAdvanceFromBill =
    roundMoney(
      Math.max(
        paidEntered -
          finalBillTotal,
        0
      )
    );

  const finalAdvanceBalance =
    roundMoney(
      remainingOldAdvance +
        newAdvanceFromBill
    );

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  const paymentStatus =
    bakiUdhari > 0
      ? "UDHARI"
      : finalAdvanceBalance > 0
      ? "ADVANCE"
      : "PAID";

  // =====================================================
  // WHATSAPP
  // =====================================================

  const shareWhatsApp = () => {
    if (!billItems.length) {
      alert(
        "⚠️ पहले Bill में Medicine डालें"
      );

      return;
    }

    const lines = [];

    lines.push(
      "🧾 SHIVAM MEDICAL STORE"
    );

    lines.push(
      "--------------------------------"
    );

    lines.push(
      `Bill Date: ${today()}`
    );

    if (
      customerName.trim()
    ) {
      lines.push(
        `Customer: ${customerName.trim()}`
      );
    }

    if (
      mobileClean(
        customerMobile
      )
    ) {
      lines.push(
        `Mobile: ${mobileClean(
          customerMobile
        )}`
      );
    }

    lines.push(
      "--------------------------------"
    );

    lines.push(
      "Medicine | Qty | Rate | Amount"
    );

    lines.push(
      "--------------------------------"
    );

    billItems.forEach(
      (item, index) => {
        lines.push(
          `${index + 1}. ${
            item.medicine
          } | ${
            item.quantity
          } | ₹${number(
            item.saleRate
          ).toFixed(2)} | ₹${number(
            item.total
          ).toFixed(2)}`
        );
      }
    );

    lines.push(
      "--------------------------------"
    );

    lines.push(
      `💰 Total Bill: ₹${billTotal.toFixed(2)}`
    );

    if (
      discountAmount > 0
    ) {
      lines.push(
        `🏷️ Discount (${discountPercentValue}%): -₹${discountAmount.toFixed(
          2
        )}`
      );
    }

    lines.push(
      `💰 Final Bill: ₹${finalBillTotal.toFixed(2)}`
    );

    if (
      advanceAdjusted > 0
    ) {
      lines.push(
        `⭐ Previous Advance Adjusted: ₹${advanceAdjusted.toFixed(
          2
        )}`
      );
    }

    lines.push(
      `💰 Bill After Advance: ₹${billAfterAdvance.toFixed(
        2
      )}`
    );

    lines.push(
      `💵 Bill Paid: ₹${billPaid.toFixed(2)}`
    );

    lines.push(
      `📒 बाकी उधारी: ₹${bakiUdhari.toFixed(
        2
      )}`
    );

    if (
      finalAdvanceBalance > 0
    ) {
      lines.push(
        `⭐ Advance Balance: ₹${finalAdvanceBalance.toFixed(
          2
        )}`
      );
    }

    lines.push("");

    if (
      bakiUdhari > 0
    ) {
      lines.push(
        "📒 बाकी उधारी बाकी है"
      );
    } else if (
      finalAdvanceBalance > 0
    ) {
      lines.push(
        "⭐ Bill पूरा Paid + Advance Balance"
      );
    } else {
      lines.push(
        "💵 Bill पूरा Paid"
      );
    }

    lines.push("");

    lines.push(
      "धन्यवाद 🙏"
    );

    const message =
      encodeURIComponent(
        lines.join("\n")
      );

    let mobile =
      mobileClean(
        customerMobile
      );

    if (
      mobile.length === 10
    ) {
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
  // SAVE / UPDATE ADVANCE
  // =====================================================

  const saveFinalAdvance = () => {
    if (
      finalAdvanceBalance <= 0
    ) {
      removeCustomerAdvance();

      return true;
    }

    const cleanName =
      normalize(
        customerName
      );

    const cleanMobile =
      mobileClean(
        customerMobile
      );

    if (
      !cleanName &&
      !cleanMobile
    ) {
      alert(
        "⚠️ Advance के लिए Customer Name या Mobile जरूरी है"
      );

      return false;
    }

    const advances =
      readStorage(
        "advances",
        []
      );

    const customerAdvances =
      readStorage(
        "customerAdvances",
        []
      );

    const isSameCustomer =
      (item) => {
        const itemName =
          normalize(
            item.customerName ||
              item.customer ||
              item.name
          );

        const itemMobile =
          mobileClean(
            item.customerMobile ||
              item.mobile
          );

        const mobileMatch =
          cleanMobile &&
          itemMobile &&
          cleanMobile ===
            itemMobile;

        const nameMatch =
          cleanName &&
          itemName &&
          cleanName ===
            itemName;

        return (
          mobileMatch ||
          nameMatch
        );
      };

    const nonMatchingAdvances =
      (
        Array.isArray(
          advances
        )
          ? advances
          : []
      ).filter(
        (item) =>
          !isSameCustomer(item)
      );

    const nonMatchingCustomerAdvances =
      (
        Array.isArray(
          customerAdvances
        )
          ? customerAdvances
          : []
      ).filter(
        (item) =>
          !isSameCustomer(item)
      );

    const newAdvanceRecord = {
      id: makeId(
        "ADVANCE"
      ),

      customerName:
        customerName.trim(),

      customerMobile:
        cleanMobile,

      customer:
        customerName.trim(),

      mobile:
        cleanMobile,

      customerKey:
        cleanMobile ||
        cleanName,

      amount:
        roundMoney(
          finalAdvanceBalance
        ),

      advance:
        roundMoney(
          finalAdvanceBalance
        ),

      advanceAmount:
        roundMoney(
          finalAdvanceBalance
        ),

      createdAt:
        Date.now(),

      updatedAt:
        Date.now(),
    };

    nonMatchingAdvances.unshift(
      newAdvanceRecord
    );

    writeStorage(
      "advances",
      nonMatchingAdvances
    );

    nonMatchingCustomerAdvances.unshift(
      {
        ...newAdvanceRecord,
        source:
          "Billing",
      }
    );

    writeStorage(
      "customerAdvances",
      nonMatchingCustomerAdvances
    );

    return true;
  };

  // =====================================================
  // REMOVE CUSTOMER ADVANCE
  // =====================================================

  const removeCustomerAdvance =
    () => {
      const cleanName =
        normalize(
          customerName
        );

      const cleanMobile =
        mobileClean(
          customerMobile
        );

      if (
        !cleanName &&
        !cleanMobile
      ) {
        return;
      }

      const isSameCustomer =
        (item) => {
          const itemName =
            normalize(
              item.customerName ||
                item.customer ||
                item.name
            );

          const itemMobile =
            mobileClean(
              item.customerMobile ||
                item.mobile
            );

          const mobileMatch =
            cleanMobile &&
            itemMobile &&
            cleanMobile ===
              itemMobile;

          const nameMatch =
            cleanName &&
            itemName &&
            cleanName ===
              itemName;

          return (
            mobileMatch ||
            nameMatch
          );
        };

      const advances =
        readStorage(
          "advances",
          []
        );

      const remainingAdvances =
        (
          Array.isArray(
            advances
          )
            ? advances
            : []
        ).filter(
          (item) =>
            !isSameCustomer(item)
        );

      writeStorage(
        "advances",
        remainingAdvances
      );

      const customerAdvances =
        readStorage(
          "customerAdvances",
          []
        );

      const remainingCustomerAdvances =
        (
          Array.isArray(
            customerAdvances
          )
            ? customerAdvances
            : []
        ).filter(
          (item) =>
            !isSameCustomer(item)
        );

      writeStorage(
        "customerAdvances",
        remainingCustomerAdvances
      );
    };

  // =====================================================
  // SAVE CUSTOMER MASTER
  // =====================================================

  const saveCustomerMaster = () => {
    const cleanName =
      customerName.trim();

    const cleanMobile =
      mobileClean(
        customerMobile
      );

    if (
      !cleanName &&
      !cleanMobile
    ) {
      return;
    }

    const customersStorage =
      readStorage(
        "customers",
        []
      );

    const customers =
      Array.isArray(
        customersStorage
      )
        ? [...customersStorage]
        : [];

    const sameCustomer =
      (item) => {
        const itemName =
          normalize(
            item.customerName ||
              item.customer ||
              item.name
          );

        const itemMobile =
          mobileClean(
            item.customerMobile ||
              item.mobile
          );

        const mobileMatch =
          cleanMobile &&
          itemMobile &&
          cleanMobile ===
            itemMobile;

        const nameMatch =
          cleanName &&
          itemName &&
          cleanName ===
            itemName;

        return (
          mobileMatch ||
          nameMatch
        );
      };

    const existingIndex =
      customers.findIndex(
        sameCustomer
      );

    const customerRecord = {
      id:
        existingIndex >= 0
          ? customers[
              existingIndex
            ].id ||
            makeId("CUSTOMER")
          : makeId("CUSTOMER"),

      customerName:
        cleanName,

      customerMobile:
        cleanMobile,

      customer:
        cleanName,

      mobile:
        cleanMobile,

      updatedAt:
        Date.now(),
    };

    if (
      existingIndex >= 0
    ) {
      customers[
        existingIndex
      ] = {
        ...customers[
          existingIndex
        ],
        ...customerRecord,
      };
    } else {
      customers.unshift(
        customerRecord
      );
    }

    writeStorage(
      "customers",
      customers
    );

    window.dispatchEvent(
      new Event(
        "customersUpdated"
      )
    );
  };

  // =====================================================
  // SAVE BILL
  // =====================================================

  const saveBill = async () => {
    // ===================================================
    // PREVENT DOUBLE CLICK / DOUBLE ENTER
    // ===================================================

    if (savingBillRef.current) {
      alert(
        "⏳ Bill पहले से save हो रहा है..."
      );

      return;
    }

    if (!billItems.length) {
      alert(
        "⚠️ Bill में कोई Medicine नहीं है"
      );

      searchRef.current?.focus();

      return;
    }

    if (
      bakiUdhari > 0 &&
      !customerName.trim()
    ) {
      alert(
        "⚠️ बाकी उधारी के लिए Customer Name डालें"
      );

      return;
    }

    if (
      newAdvanceFromBill > 0 &&
      !customerName.trim() &&
      !mobileClean(
        customerMobile
      )
    ) {
      alert(
        "⚠️ Advance के लिए Customer Name या Mobile डालें"
      );

      return;
    }

    savingBillRef.current = true;

    try {
      // =================================================
      // STOCK VALIDATION
      // =================================================

      const updatedStock = [
        ...currentStock,
      ];

      for (
        const billItem of billItems
      ) {
        const index =
          updatedStock.findIndex(
            (stockItem) =>
              String(stockItem.id) ===
              String(billItem.stockId)
          );

        if (index < 0) {
          alert(
            `⚠️ ${billItem.medicine} Stock में नहीं मिली`
          );

          return;
        }

        const oldQty =
          number(
            updatedStock[index]
              .quantity
          );

        if (
          number(billItem.quantity) >
          oldQty
        ) {
          alert(
            `⚠️ ${billItem.medicine} का Stock कम है`
          );

          return;
        }
      }

      // =================================================
      // DEDUCT STOCK
      // =================================================

      for (
        const billItem of billItems
      ) {
        const index =
          updatedStock.findIndex(
            (stockItem) =>
              String(stockItem.id) ===
              String(billItem.stockId)
          );

        const oldQty =
          number(
            updatedStock[index]
              .quantity
          );

        updatedStock[index] = {
          ...updatedStock[index],

          quantity:
            oldQty -
            number(billItem.quantity),

          updatedAt:
            Date.now(),
        };
      }

      // =================================================
      // BILL IDS
      // =================================================

      const billId =
        makeId("BILL");

      const billNo =
        "BILL-" +
        Date.now();

      const cleanCustomerMobile =
        mobileClean(
          customerMobile
        );

      // =================================================
      // FINAL VALUES
      // =================================================

      const finalDiscountPercent =
        roundMoney(
          discountPercentValue
        );

      const finalDiscountAmount =
        roundMoney(
          discountAmount
        );

      const finalSubtotal =
        roundMoney(
          billTotal
        );

      const savedFinalBillTotal =
        roundMoney(
          finalBillTotal
        );

      const finalAdvanceAdjusted =
        roundMoney(
          advanceAdjusted
        );

      const finalBillAfterAdvance =
        roundMoney(
          billAfterAdvance
        );

      const finalPaidEntered =
        roundMoney(
          paidEntered
        );

      const finalBillPaid =
        roundMoney(
          billPaid
        );

      const finalBakiUdhari =
        roundMoney(
          bakiUdhari
        );

      const finalNewAdvance =
        roundMoney(
          newAdvanceFromBill
        );

      const savedFinalAdvanceBalance =
        roundMoney(
          finalAdvanceBalance
        );

      // =================================================
      // BILL OBJECT
      // =================================================

      const bill = {
        id:
          billId,

        billNo:
          billNo,

        customer:
          customerName.trim(),

        customerName:
          customerName.trim(),

        customerMobile:
          cleanCustomerMobile,

        mobile:
          cleanCustomerMobile,

        items:
          billItems,

        totalItems:
          totalItems,

        totalQuantity:
          totalQuantity,

        discountPercent:
          finalDiscountPercent,

        discountAmount:
          finalDiscountAmount,

        subtotal:
          finalSubtotal,

        billTotal:
          savedFinalBillTotal,

        total:
          savedFinalBillTotal,

        totalAmount:
          savedFinalBillTotal,

        previousAdvance:
          roundMoney(
            customerAdvance
          ),

        advanceAdjusted:
          finalAdvanceAdjusted,

        advanceUsed:
          finalAdvanceAdjusted,

        billAfterAdvance:
          finalBillAfterAdvance,

        paymentReceived:
          finalPaidEntered,

        receivedAmount:
          finalPaidEntered,

        billPaid:
          finalBillPaid,

        paidNow:
          finalBillPaid,

        jama:
          finalBillPaid,

        paid:
          finalBillPaid,

        paidAmount:
          finalBillPaid,

        paidAtBill:
          finalBillPaid,

        receivedAtBill:
          finalBillPaid,

        bakiUdhari:
          finalBakiUdhari,

        pendingAmount:
          finalBakiUdhari,

        creditAmount:
          finalBakiUdhari,

        credit:
          finalBakiUdhari > 0,

        advance:
          finalNewAdvance,

        advanceAdded:
          finalNewAdvance,

        advanceBalance:
          savedFinalAdvanceBalance,

        remainingAdvance:
          savedFinalAdvanceBalance,

        paymentType:
          finalBakiUdhari > 0
            ? "PARTIAL_PAID"
            : savedFinalAdvanceBalance > 0
            ? "FULL_PAID_PLUS_ADVANCE"
            : "FULL_PAID",

        date:
          today(),

        billDate:
          today(),

        createdAt:
          Date.now(),
      };

      // =================================================
      // STEP 1
      // SAVE BILL TO ONLINE BACKEND
      // =================================================

      console.log(
        "🌐 BILLING API:",
        API_URL
      );

      console.log(
        "📤 BILL SEND TO BACKEND:",
        bill
      );

      let billResponse;

      try {
        billResponse = await fetch(
          `${API_URL}/api/bills`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body:
              JSON.stringify(
                bill
              ),
          }
        );
      } catch (error) {
        console.error(
          "❌ BILL BACKEND CONNECTION ERROR:",
          error
        );

        alert(
          "⚠️ Online Backend से connection नहीं हुआ.\n\nBill save नहीं किया गया."
        );

        return;
      }

      let billResult = {};

      try {
        billResult =
          await billResponse.json();
      } catch {
        billResult = {};
      }

      if (!billResponse.ok) {
        console.error(
          "❌ BACKEND BILL SAVE ERROR:",
          billResult
        );

        alert(
          "⚠️ Online Backend में Bill save नहीं हुआ.\n\n" +
          (
            billResult.message ||
            "Server Error"
          )
        );

        return;
      }

      console.log(
        "✅ BILL SAVED ONLINE:",
        billResult
      );

      // =================================================
      // STEP 2
      // UPDATE STOCK TO ONLINE BACKEND
      // =================================================

      console.log(
        "📦 START ONLINE STOCK UPDATE"
      );

      for (
        const billItem of billItems
      ) {
        const stockItem =
          updatedStock.find(
            (item) =>
              String(item.id) ===
              String(billItem.stockId)
          );

        if (!stockItem) {
          alert(
            `⚠️ ${billItem.medicine} का Stock item नहीं मिला`
          );

          return;
        }

        // ===============================================
        // FIND REAL BACKEND ID
        // ===============================================

        const possibleBackendId =
          stockItem.backendId ||
          stockItem.id;

        const backendId =
          Number(
            possibleBackendId
          );

        console.log(
          "🔎 BILLING STOCK ITEM:",
          stockItem
        );

        console.log(
          "🔎 BACKEND STOCK ID:",
          backendId
        );

        if (
          !Number.isInteger(
            backendId
          ) ||
          backendId <= 0
        ) {
          alert(
            `⚠️ ${stockItem.medicine || "Medicine"} का valid Backend Stock ID नहीं मिला`
          );

          console.error(
            "❌ INVALID BACKEND STOCK ID:",
            stockItem
          );

          return;
        }

        let stockResponse;

        try {
          stockResponse =
            await fetch(
              `${API_URL}/api/stock/${backendId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    ...stockItem,

                    id:
                      backendId,

                    backendId:
                      backendId,

                    quantity:
                      number(
                        stockItem.quantity
                      ),

                    updatedAt:
                      Date.now(),
                  }),
              }
            );
        } catch (error) {
          console.error(
            "❌ STOCK BACKEND CONNECTION ERROR:",
            error
          );

          alert(
            `⚠️ ${stockItem.medicine || "Medicine"} का online stock update नहीं हुआ.\n\nBill process रोक दिया गया.`
          );

          return;
        }

        let stockResult = {};

        try {
          stockResult =
            await stockResponse.json();
        } catch {
          stockResult = {};
        }

        if (
          !stockResponse.ok
        ) {
          console.error(
            "❌ BACKEND STOCK UPDATE ERROR:",
            stockResult
          );

          alert(
            `⚠️ ${stockItem.medicine || "Medicine"} का online stock update नहीं हुआ.\n\n` +
            (
              stockResult.message ||
              "Server Error"
            )
          );

          return;
        }

        console.log(
          "✅ BACKEND STOCK UPDATED:",
          stockResult
        );
      }

      console.log(
        "✅ ALL STOCK UPDATED ONLINE"
      );

      // =================================================
      // STEP 3
      // GET LATEST ONLINE STOCK
      // =================================================

      let latestOnlineStock =
        null;

      try {
        const latestStockResponse =
          await fetch(
            `${API_URL}/api/stock`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        if (
          latestStockResponse.ok
        ) {
          const latestStockResult =
            await latestStockResponse.json();

          if (
            Array.isArray(
              latestStockResult
            )
          ) {
            latestOnlineStock =
              latestStockResult;
          } else if (
            latestStockResult &&
            Array.isArray(
              latestStockResult.stock
            )
          ) {
            latestOnlineStock =
              latestStockResult.stock;
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ Latest online stock fetch failed:",
          error
        );
      }

      // =================================================
      // STEP 4
      // LOCAL BILL SAVE
      // =================================================

      const bills =
        readStorage(
          "bills",
          []
        );

      writeStorage(
        "bills",
        [
          bill,
          ...bills,
        ]
      );

      // =================================================
      // STEP 5
      // SAVE SALES
      // =================================================

      const sales =
        readStorage(
          "sales",
          []
        );

      writeStorage(
        "sales",
        [
          ...sales,
          {
            ...bill,

            saleAmount:
              savedFinalBillTotal,
          },
        ]
      );

      // =================================================
      // STEP 6
      // SAVE CUSTOMER MASTER
      // =================================================

      saveCustomerMaster();

      // =================================================
      // STEP 7
      // SAVE CUSTOMER CREDIT
      // =================================================

      if (
        finalBakiUdhari > 0
      ) {
        const customerCredits =
          readStorage(
            "customerCredits",
            []
          );

        customerCredits.unshift({
          id:
            makeId(
              "CREDIT"
            ),

          customer:
            customerName.trim(),

          customerName:
            customerName.trim(),

          customerMobile:
            cleanCustomerMobile,

          amount:
            finalBakiUdhari,

          creditAmount:
            finalBakiUdhari,

          billNumber:
            billNo,

          billNo:
            billNo,

          billId:
            billId,

          date:
            today(),

          createdAt:
            Date.now(),

          note:
            "Bill की बाकी उधारी",
        });

        writeStorage(
          "customerCredits",
          customerCredits
        );
      }

      // =================================================
      // STEP 8
      // UPDATE ADVANCE
      // =================================================

      const advanceSaved =
        saveFinalAdvance();

      if (!advanceSaved) {
        return;
      }

      // =================================================
      // STEP 9
      // LOCAL STOCK UPDATE
      // =================================================

      const finalStock =
        Array.isArray(
          latestOnlineStock
        )
          ? latestOnlineStock
          : updatedStock;

      setStock(
        finalStock
      );

      writeStorage(
        "stock",
        finalStock
      );

      // =================================================
      // EVENTS
      // =================================================

      window.dispatchEvent(
        new Event(
          "stockUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "salesUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "billingUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "customerLedgerUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "advanceUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "customersUpdated"
        )
      );

      // =================================================
      // LAST SAVED
      // =================================================

      setLastSavedBillNo(
        billNo
      );

      setLastSavedAmount(
        savedFinalBillTotal
      );

      // =================================================
      // SUCCESS
      // =================================================

      let successMessage =
        "✅ Bill Saved Successfully\n\n" +
        `Bill No: ${billNo}\n` +
        `Total Bill: ₹${finalSubtotal.toFixed(
          2
        )}\n`;

      if (
        finalDiscountAmount > 0
      ) {
        successMessage +=
          `Discount (${finalDiscountPercent}%): -₹${finalDiscountAmount.toFixed(
            2
          )}\n`;
      }

      successMessage +=
        `Final Bill: ₹${savedFinalBillTotal.toFixed(
          2
        )}\n` +
        `Previous Advance Adjusted: ₹${finalAdvanceAdjusted.toFixed(
          2
        )}\n` +
        `Bill After Advance: ₹${finalBillAfterAdvance.toFixed(
          2
        )}\n` +
        `Bill Paid: ₹${finalBillPaid.toFixed(
          2
        )}\n` +
        `बाकी उधारी: ₹${finalBakiUdhari.toFixed(
          2
        )}\n` +
        `Advance Balance: ₹${savedFinalAdvanceBalance.toFixed(
          2
        )}\n\n` +
        "🌐 Online Bill + Stock Updated";

      alert(
        successMessage
      );

      // =================================================
      // CLEAR
      // =================================================

      setCustomerName("");
      setCustomerMobile("");
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);

      setMedicineSearch("");
      setSelectedMedicine(null);
      setQuantity("");
      setBillItems([]);
      setBillPayment("");
      setDiscountPercent("");
      setCustomerAdvance(0);
      setAdvanceMatched(false);

      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);

    } finally {
      // =================================================
      // RELEASE SAVE LOCK
      // =================================================

      savingBillRef.current = false;
    }
  };

  // =====================================================
  // NEW BILL
  // =====================================================

  const newBill = () => {
    if (
      savingBillRef.current
    ) {
      alert(
        "⏳ पहले Bill save होने दें"
      );

      return;
    }

    setCustomerName("");
    setCustomerMobile("");
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);

    setMedicineSearch("");
    setSelectedMedicine(null);
    setQuantity("");
    setBillItems([]);
    setBillPayment("");
    setDiscountPercent("");
    setCustomerAdvance(0);
    setAdvanceMatched(false);

    setLastSavedBillNo("");
    setLastSavedAmount(0);

    setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
  };

  // =====================================================
  // BILL KEYBOARD SHORTCUTS
  // =====================================================

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        e.ctrlKey &&
        e.key === "Enter"
      ) {
        e.preventDefault();

        if (
          billItems.length > 0 &&
          !savingBillRef.current
        ) {
          saveBill();
        }

        return;
      }

      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        newBill();
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        paymentRef.current?.focus();
        return;
      }

      if (e.key === "F6") {
        e.preventDefault();
        discountRef.current?.focus();
        return;
      }

      if (e.key === "Escape") {
        setShowCustomerSuggestions(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [
    billItems,
    customerName,
    customerMobile,
    billPayment,
    discountPercent,
  ]);

  // =====================================================
  // SMART PAYMENT ENTER
  // =====================================================

  const handlePaymentKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (
        billItems.length > 0 &&
        !savingBillRef.current
      ) {
        saveBill();
      }
    }
  };

  // =====================================================
  // SMART STOCK INFO
  // =====================================================

  const selectedStockQuantity =
    selectedMedicine
      ? number(
          selectedMedicine.quantity
        )
      : 0;

  const selectedSaleRate =
    selectedMedicine
      ? number(
          selectedMedicine.saleRate ||
            selectedMedicine.mrp ||
            selectedMedicine.rate
        )
      : 0;

  const selectedMRP =
    selectedMedicine
      ? number(
          selectedMedicine.mrp
        )
      : 0;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="smart-billing-root">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .smart-billing-root {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px;
          font-family: Arial, sans-serif;
        }

        .billing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .billing-title {
          margin: 0;
          font-size: 28px;
        }

        .billing-date {
          font-size: 13px;
          color: #666;
          margin-top: 4px;
        }

        .smart-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 20px;
          background: #e8f5e9;
          color: #166534;
          font-weight: bold;
          font-size: 13px;
        }

        .customer-panel,
        .medicine-panel,
        .bill-panel,
        .payment-panel {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .panel-title {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 18px;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .smart-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #bbb;
          border-radius: 7px;
          font-size: 15px;
          outline: none;
        }

        .smart-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
        }

        .relative-box {
          position: relative;
        }

        .dropdown-box {
          position: absolute;
          top: calc(100% + 3px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ccc;
          border-radius: 7px;
          z-index: 3000;
          max-height: 280px;
          overflow-y: auto;
          box-shadow: 0 5px 18px rgba(0,0,0,0.18);
        }

        .dropdown-item {
          padding: 12px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #eef5ff;
        }

        .medicine-search-row {
          display: grid;
          grid-template-columns: 1fr 150px;
          gap: 10px;
        }

        .stock-info {
          margin-top: 10px;
          padding: 10px;
          background: #f7f7f7;
          border-radius: 7px;
          font-size: 14px;
        }

        .stock-ok {
          color: #166534;
          font-weight: bold;
        }

        .stock-low {
          color: #b45309;
          font-weight: bold;
        }

        .advance-box {
          padding: 13px;
          margin-bottom: 15px;
          border: 1px solid #e8c94a;
          border-radius: 8px;
          background: #fff8dc;
        }

        .advance-amount {
          font-size: 20px;
          font-weight: bold;
          margin-top: 5px;
        }

        .history-box {
          margin-top: 12px;
          border: 1px solid #d4d4d4;
          border-radius: 8px;
          overflow: hidden;
        }

        .history-title {
          padding: 10px 12px;
          background: #f5f5f5;
          font-weight: bold;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f1f1f1;
          border: 1px solid #ccc;
          padding: 9px;
          white-space: nowrap;
        }

        td {
          border: 1px solid #ddd;
          padding: 9px;
        }

        .quantity-row {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 10px;
          margin-top: 12px;
        }

        .smart-button {
          border: 0;
          border-radius: 7px;
          padding: 11px 17px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        }

        .smart-button:hover {
          opacity: 0.88;
        }

        .button-primary {
          background: #2563eb;
          color: white;
        }

        .button-success {
          background: #16a34a;
          color: white;
        }

        .button-warning {
          background: #f59e0b;
          color: white;
        }

        .button-danger {
          background: #dc2626;
          color: white;
        }

        .button-dark {
          background: #374151;
          color: white;
        }

        .button-light {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .smart-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          background: #fafafa;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .stat-value {
          font-size: 21px;
          font-weight: bold;
          margin-top: 4px;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .payment-input-box {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }

        .summary-box {
          margin-top: 15px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 9px;
        }

        .summary-total {
          font-size: 22px;
        }

        .status-paid {
          color: #15803d;
          font-weight: bold;
        }

        .status-udhari {
          color: #dc2626;
          font-weight: bold;
        }

        .status-advance {
          color: #b45309;
          font-weight: bold;
        }

        .action-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .keyboard-help {
          margin-top: 12px;
          padding: 9px 12px;
          border-radius: 7px;
          background: #f4f7fb;
          color: #555;
          font-size: 12px;
        }

        .saved-box {
          margin-bottom: 15px;
          padding: 13px;
          border-radius: 8px;
          background: #ecfdf5;
          border: 1px solid #86efac;
          color: #166534;
        }

        @media (max-width: 800px) {
          .smart-billing-root {
            padding: 10px;
          }

          .customer-grid,
          .payment-grid {
            grid-template-columns: 1fr;
          }

          .medicine-search-row {
            grid-template-columns: 1fr;
          }

          .quantity-row {
            grid-template-columns: 1fr;
          }

          .smart-stats {
            grid-template-columns: 1fr 1fr;
          }

          .billing-title {
            font-size: 23px;
          }
        }

        @media (max-width: 480px) {
          .smart-stats {
            grid-template-columns: 1fr;
          }

          .smart-button {
            width: 100%;
          }

          .action-row {
            flex-direction: column;
          }

          .summary-row {
            font-size: 14px;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="billing-header">
        <div>
          <h2 className="billing-title">
            🧾 Smart Billing
          </h2>

          <div className="billing-date">
            📅 {today()}
          </div>
        </div>

        <div className="smart-badge">
          🟢 Smart Billing Active
        </div>
      </div>

      {/* LAST SAVED */}

      {lastSavedBillNo && (
        <div className="saved-box">
          <b>✅ Last Bill Saved</b>
          <br />
          Bill No: {lastSavedBillNo}
          <br />
          Amount: ₹
          {lastSavedAmount.toFixed(2)}
        </div>
      )}

      {/* CUSTOMER */}

      <div className="customer-panel">
        <h3 className="panel-title">
          👤 Customer Details
        </h3>

        <div className="customer-grid">
          <div className="relative-box">
            <input
              type="text"
              placeholder="👤 Customer Name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(
                  e.target.value
                );

                setShowCustomerSuggestions(
                  true
                );
              }}
              onFocus={() => {
                if (
                  customerSuggestions.length >
                  0
                ) {
                  setShowCustomerSuggestions(
                    true
                  );
                }
              }}
              onKeyDown={
                handleCustomerNameKeyDown
              }
              autoComplete="off"
              className="smart-input"
            />

            {showCustomerSuggestions &&
              customerSuggestions.length >
                0 && (
                <div className="dropdown-box">
                  {customerSuggestions.map(
                    (
                      customer,
                      index
                    ) => (
                      <div
                        key={
                          customer.customerMobile ||
                          customer.customerName +
                            "_" +
                            index
                        }
                        className="dropdown-item"
                        onMouseDown={() =>
                          selectCustomer(
                            customer
                          )
                        }
                      >
                        <b>
                          👤{" "}
                          {customer.customerName ||
                            "No Name"}
                        </b>

                        {customer.customerMobile && (
                          <>
                            <br />

                            <small>
                              📱{" "}
                              {
                                customer.customerMobile
                              }
                            </small>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
          </div>

          <div className="relative-box">
            <input
              type="text"
              placeholder="📱 Customer Mobile"
              value={customerMobile}
              onChange={(e) => {
                setCustomerMobile(
                  mobileClean(
                    e.target.value
                  )
                );

                setShowCustomerSuggestions(
                  true
                );
              }}
              onFocus={() => {
                if (
                  customerSuggestions.length >
                  0
                ) {
                  setShowCustomerSuggestions(
                    true
                  );
                }
              }}
              onKeyDown={
                handleCustomerMobileKeyDown
              }
              maxLength={10}
              autoComplete="off"
              className="smart-input"
            />
          </div>
        </div>

        <div className="keyboard-help">
          💡 Customer Name/Mobile डालकर
          <b> Enter</b> दबाएँ।
        </div>
      </div>

      {/* ADVANCE FOUND */}

      {advanceMatched &&
        customerAdvance > 0 && (
          <div className="advance-box">
            <b>
              ⭐ Previous Advance Found
            </b>

            <div className="advance-amount">
              Available Advance: ₹
              {customerAdvance.toFixed(
                2
              )}
            </div>

            {billTotal > 0 && (
              <div style={{ marginTop: 6 }}>
                Advance Adjusted: ₹
                {advanceAdjusted.toFixed(
                  2
                )}
              </div>
            )}

            {remainingOldAdvance > 0 && (
              <div style={{ marginTop: 6 }}>
                Remaining Old Advance: ₹
                {remainingOldAdvance.toFixed(
                  2
                )}
              </div>
            )}
          </div>
        )}

      {/* MEDICINE */}

      <div className="medicine-panel">
        <h3 className="panel-title">
          💊 Medicine
        </h3>

        <div className="medicine-search-row">
          <div className="relative-box">
            <input
              ref={searchRef}
              type="text"
              placeholder="🔍 Medicine / Company / Barcode"
              value={medicineSearch}
              onChange={(e) => {
                setMedicineSearch(
                  e.target.value
                );

                setSelectedMedicine(
                  null
                );
              }}
              onKeyDown={
                handleMedicineKeyDown
              }
              className="smart-input"
            />

            {medicineSuggestions.length >
              0 &&
              !selectedMedicine && (
                <div className="dropdown-box">
                  {medicineSuggestions.map(
                    (
                      item,
                      index
                    ) => (
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
                        className="dropdown-item"
                        style={{
                          background:
                            index ===
                            highlightIndex
                              ? "#e8f0ff"
                              : "white",
                        }}
                      >
                        <b>
                          {
                            item.medicine ||
                            item.name
                          }
                        </b>

                        <br />

                        <small>
                          Company:{" "}
                          {
                            item.company ||
                            "-"
                          }

                          {" • Stock: "}

                          {number(
                            item.quantity
                          )}

                          {" • Sale Rate: ₹"}

                          {number(
                            item.saleRate ||
                              item.mrp ||
                              item.rate
                          ).toFixed(
                            2
                          )}
                        </small>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>

          <button
            type="button"
            className="smart-button button-primary"
            onClick={() =>
              searchRef.current?.focus()
            }
          >
            🔍 Search
          </button>
        </div>

        {selectedMedicine && (
          <div className="stock-info">
            <b>
              💊{" "}
              {
                selectedMedicine.medicine ||
                selectedMedicine.name
              }
            </b>

            <br />

            Company:{" "}
            {
              selectedMedicine.company ||
              "-"
            }

            <br />

            Batch:{" "}
            {
              selectedMedicine.batch ||
              selectedMedicine.batchNo ||
              "-"
            }

            <br />

            Stock:{" "}
            <span
              className={
                selectedStockQuantity <= 10
                  ? "stock-low"
                  : "stock-ok"
              }
            >
              {selectedStockQuantity}
            </span>

            {" | "}

            Sale Rate: ₹
            {selectedSaleRate.toFixed(2)}

            {" | "}

            MRP: ₹
            {selectedMRP.toFixed(2)}
          </div>
        )}

        <div className="quantity-row">
          <input
            ref={quantityRef}
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            onKeyDown={
              handleQuantityKeyDown
            }
            className="smart-input"
          />

          <button
            type="button"
            onClick={addItem}
            className="smart-button button-success"
          >
            ➕ Add Item
          </button>
        </div>

        <div className="keyboard-help">
          ⌨️ <b>Arrow Up/Down</b> = Medicine
          Select &nbsp; | &nbsp;
          <b>Enter</b> = Select/Add
        </div>
      </div>

      {/* PREVIOUS PURCHASE HISTORY */}

      {selectedMedicine &&
        (customerName.trim() ||
          mobileClean(customerMobile)) && (
          <div className="history-box">
            <div className="history-title">
              🕘 Previous Purchase History
            </div>

            <div
              style={{
                padding: "10px 12px",
              }}
            >
              <b>Customer:</b>{" "}
              {customerName.trim() ||
                customerMobile}

              {" | "}

              <b>Medicine:</b>{" "}
              {selectedMedicine.medicine ||
                selectedMedicine.name}
            </div>

            {previousMedicinePurchases.length ===
            0 ? (
              <div
                style={{
                  padding: 15,
                  textAlign: "center",
                  color: "#666",
                }}
              >
                इस Customer ने यह Medicine
                पहले नहीं ली है।
              </div>
            ) : (
              <div className="table-wrap">
                <table
                  style={{
                    minWidth: 550,
                  }}
                >
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Rate</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Bill No.</th>
                    </tr>
                  </thead>

                  <tbody>
                    {previousMedicinePurchases.map(
                      (
                        history,
                        index
                      ) => (
                        <tr
                          key={
                            history.id +
                            "_" +
                            index
                          }
                        >
                          <td
                            style={{
                              textAlign:
                                "center",
                            }}
                          >
                            {index + 1}
                          </td>

                          <td>
                            {
                              history.date
                            }
                          </td>

                          <td
                            style={{
                              textAlign:
                                "right",
                              fontWeight:
                                "bold",
                            }}
                          >
                            ₹
                            {history.rate.toFixed(
                              2
                            )}
                          </td>

                          <td
                            style={{
                              textAlign:
                                "center",
                            }}
                          >
                            {
                              history.quantity
                            }
                          </td>

                          <td
                            style={{
                              textAlign:
                                "right",
                            }}
                          >
                            ₹
                            {history.amount.toFixed(
                              2
                            )}
                          </td>

                          <td>
                            {
                              history.billNo
                            }
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

      {/* BILL TABLE */}

      <div className="bill-panel">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h3 className="panel-title">
            📋 Bill Items
          </h3>

          <div
            style={{
              fontSize: 13,
              color: "#555",
            }}
          >
            Items: <b>{totalItems}</b>
            {" | "}
            Qty: <b>{totalQuantity}</b>
          </div>
        </div>

        <div className="table-wrap">
          <table
            style={{
              minWidth: 750,
            }}
          >
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Company</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {billItems.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: 25,
                      textAlign:
                        "center",
                      color: "#777",
                    }}
                  >
                    🛒 अभी Bill खाली है
                  </td>
                </tr>
              ) : (
                billItems.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <b>
                          {
                            item.medicine
                          }
                        </b>
                      </td>

                      <td>
                        {item.company ||
                          "-"}
                      </td>

                      <td>
                        {item.batch ||
                          "-"}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "center",
                        }}
                      >
                        {
                          item.quantity
                        }
                      </td>

                      <td
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        ₹
                        {number(
                          item.saleRate
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "right",
                          fontWeight:
                            "bold",
                        }}
                      >
                        ₹
                        {number(
                          item.total
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td
                        style={{
                          textAlign:
                            "center",
                        }}
                      >
                        <button
                          type="button"
                          className="smart-button button-danger"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                          style={{
                            padding:
                              "6px 10px",
                          }}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMART STATS */}

      <div className="smart-stats">
        <div className="stat-card">
          <div className="stat-label">
            🧾 Total Items
          </div>

          <div className="stat-value">
            {totalItems}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            📦 Total Quantity
          </div>

          <div className="stat-value">
            {totalQuantity}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            💰 Bill Total
          </div>

          <div className="stat-value">
            ₹{billTotal.toFixed(2)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            🏷️ Discount
          </div>

          <div className="stat-value">
            ₹{discountAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* PAYMENT */}

      <div className="payment-panel">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h3 className="panel-title">
            💰 Payment & Final Bill
          </h3>

          <button
            type="button"
            className="smart-button button-light"
            onClick={() =>
              setShowBillSummary(
                (prev) => !prev
              )
            }
            style={{
              padding:
                "7px 11px",
            }}
          >
            {showBillSummary
              ? "🔽 Hide"
              : "▶️ Show"}
          </button>
        </div>

        {/* DISCOUNT */}

        <div
          style={{
            marginBottom: 15,
            padding: 12,
            border:
              "1px solid #e8d59b",
            borderRadius: 8,
            background:
              "#fff8e1",
          }}
        >
          <label>
            <b>
              🏷️ Discount (%)
            </b>
          </label>

          <input
            ref={discountRef}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discountPercent}
            onChange={(e) => {
              setDiscountPercent(
                e.target.value
              );
            }}
            placeholder="0"
            className="smart-input"
            style={{
              marginTop: 6,
            }}
          />

          <small>
            कोई भी Discount % डाल सकते हैं।
            जैसे 2, 5, 7.5, 10, 15 आदि।
          </small>

          {discountAmount > 0 && (
            <div
              style={{
                marginTop: 8,
                fontWeight: "bold",
              }}
            >
              Discount Amount: -₹
              {discountAmount.toFixed(
                2
              )}
            </div>
          )}
        </div>

        <div className="payment-grid">
          <div className="payment-input-box">
            <b>
              💰 Final Bill
            </b>

            <div
              style={{
                fontSize: 28,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              ₹
              {finalBillTotal.toFixed(
                2
              )}
            </div>

            {discountAmount > 0 && (
              <small>
                Original: ₹
                {billTotal.toFixed(
                  2
                )}
                <br />
                Discount: -₹
                {discountAmount.toFixed(
                  2
                )}
              </small>
            )}
          </div>

          <div className="payment-input-box">
            <label>
              <b>
                💵 Bill Paid / जमा
              </b>
            </label>

            <input
              ref={paymentRef}
              type="number"
              min="0"
              step="0.01"
              value={billPayment}
              onChange={(e) =>
                setBillPayment(
                  e.target.value
                )
              }
              onKeyDown={
                handlePaymentKeyDown
              }
              placeholder="जितना पैसा मिला"
              className="smart-input"
              style={{
                marginTop: 6,
              }}
            />

            {paidEntered >
              finalBillTotal && (
              <small
                style={{
                  color:
                    "#b45309",
                  fontWeight:
                    "bold",
                }}
              >
                ⭐ Extra ₹
                {newAdvanceFromBill.toFixed(
                  2
                )} Advance में जाएगा
              </small>
            )}
          </div>
        </div>

        {/* FINAL SUMMARY */}

        {showBillSummary && (
          <div className="summary-box">
            <div className="summary-row">
              <b>
                Total Bill
              </b>

              <b>
                ₹
                {billTotal.toFixed(
                  2
                )}
              </b>
            </div>

            {discountAmount > 0 && (
              <>
                <div className="summary-row">
                  <b>
                    🏷️ Discount (
                    {
                      discountPercentValue
                    }
                    %)
                  </b>

                  <b>
                    - ₹
                    {discountAmount.toFixed(
                      2
                    )}
                  </b>
                </div>

                <div
                  className="summary-row summary-total"
                >
                  <b>
                    💰 Final Bill
                  </b>

                  <b>
                    ₹
                    {finalBillTotal.toFixed(
                      2
                    )}
                  </b>
                </div>
              </>
            )}

            {advanceAdjusted >
              0 && (
              <div className="summary-row">
                <b>
                  ⭐ Previous Advance
                  Adjusted
                </b>

                <b>
                  ₹
                  {advanceAdjusted.toFixed(
                    2
                  )}
                </b>
              </div>
            )}

            <div className="summary-row">
              <b>
                Bill After Advance
              </b>

              <b>
                ₹
                {billAfterAdvance.toFixed(
                  2
                )}
              </b>
            </div>

            <div className="summary-row">
              <b>
                💵 Bill Paid
              </b>

              <b>
                ₹
                {billPaid.toFixed(
                  2
                )}
              </b>
            </div>

            <hr />

            <div className="summary-row">
              <b>
                📒 बाकी उधारी
              </b>

              <b
                className={
                  bakiUdhari > 0
                    ? "status-udhari"
                    : "status-paid"
                }
              >
                ₹
                {bakiUdhari.toFixed(
                  2
                )}
              </b>
            </div>

            {finalAdvanceBalance >
              0 && (
              <div className="summary-row">
                <b>
                  ⭐ Advance Balance
                </b>

                <b className="status-advance">
                  ₹
                  {finalAdvanceBalance.toFixed(
                    2
                  )}
                </b>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 7,
                background:
                  paymentStatus ===
                  "PAID"
                    ? "#ecfdf5"
                    : paymentStatus ===
                      "UDHARI"
                    ? "#fef2f2"
                    : "#fff8e1",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {paymentStatus ===
                "PAID" &&
                "✅ BILL FULLY PAID"}

              {paymentStatus ===
                "UDHARI" &&
                "📒 BILL ON UDHARI"}

              {paymentStatus ===
                "ADVANCE" &&
                "⭐ PAID + ADVANCE BALANCE"}
            </div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}

      <div className="action-row">
        <button
          type="button"
          onClick={saveBill}
          className="smart-button button-success"
          disabled={
            savingBillRef.current
          }
        >
          💾 Save Bill
        </button>

        <button
          type="button"
          onClick={shareWhatsApp}
          className="smart-button button-primary"
        >
          📲 WhatsApp Share
        </button>

        <button
          type="button"
          onClick={newBill}
          className="smart-button button-warning"
        >
          🆕 New Bill
        </button>

        <button
          type="button"
          onClick={goBack}
          className="smart-button button-dark"
        >
          ⬅️ Back
        </button>
      </div>

      {/* KEYBOARD HELP */}

      <div className="keyboard-help">
        <b>⌨️ Smart Shortcuts:</b>
        {" "}
        F2 = Medicine Search
        {" | "}
        F4 = Payment
        {" | "}
        F6 = Discount
        {" | "}
        Ctrl + Enter = Save Bill
        {" | "}
        Ctrl + N = New Bill
      </div>
    </div>
  );
}

export default Billing;