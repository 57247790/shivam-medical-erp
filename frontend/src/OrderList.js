  import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";

  function OrderList({ stock = [], setStock, goBack }) {
    // =====================================================
    // SAFE HELPERS
    // =====================================================

    const readStorage = (key, fallback = []) => {
      try {
        const data = localStorage.getItem(key);

        if (!data) return fallback;

        const parsed = JSON.parse(data);

        return parsed ?? fallback;
      } catch (error) {
        console.error("LocalStorage read error:", key, error);
        return fallback;
      }
    };

    const writeStorage = (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("LocalStorage write error:", key, error);
      }
    };

    const makeId = (prefix = "ID") => {
      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    };

    const toNumber = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    };

    // =====================================================
    // NORMALIZE BARCODE
    // =====================================================

    const normalizeBarcode = (value) => {
      return String(value || "")
        .trim()
        .toLowerCase();
    };

    // =====================================================
    // NORMALIZE MEDICINE
    // =====================================================

    const normalizeMedicine = (value) => {
      return String(value || "")
        .trim()
        .toLowerCase();
    };

    // =====================================================
    // GST OPTIONS
    // =====================================================

    const GST_OPTIONS = [
      {
        value: 0,
        label: "0%",
      },
      {
        value: -3,
        label: "3% (-)",
      },
      {
        value: 5,
        label: "5%",
      },
      {
        value: 18,
        label: "18%",
      },
      {
        value: 2,
        label: "+5% -3%",
      },
    ];

    // =====================================================
    // GST CALCULATION
    // =====================================================

    const calculateGstRate = (rate, gst) => {
      const base = toNumber(rate);
      const gstValue = toNumber(gst);

      if (gstValue === -3) {
        return base - (base * 3) / 100;
      }

      if (gstValue === 2) {
        const afterFive = base + (base * 5) / 100;

        return afterFive - (afterFive * 3) / 100;
      }

      return base + (base * gstValue) / 100;
    };

    // =====================================================
    // REFS
    // =====================================================

    const medicineRef = useRef(null);
    const barcodeRef = useRef(null);
    const supplierRef = useRef(null);

    // =====================================================
    // STATES
    // =====================================================

    const [medicine, setMedicine] = useState("");
    const [barcode, setBarcode] = useState("");
    const [company, setCompany] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("PCS");

    const [supplier, setSupplier] = useState("");
    const [supplierMobile, setSupplierMobile] = useState("");

    const [orderItems, setOrderItems] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [supplierSearchOpen, setSupplierSearchOpen] =
      useState(false);

    const [supplierSearchIndex, setSupplierSearchIndex] =
      useState(-1);

    const [receiveOrder, setReceiveOrder] = useState(null);
    const [receiveItems, setReceiveItems] = useState([]);
  const [previousRateHistory, setPreviousRateHistory] = useState([]);
  const [showPreviousRateHistory, setShowPreviousRateHistory] = useState(false);
  const [previousRateMedicine, setPreviousRateMedicine] = useState("");
    const [selectedHistoryOrder, setSelectedHistoryOrder] =
      useState(null);

    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {
      const savedOrder = readStorage("currentOrder", []);

      const savedPendingOrders = readStorage(
        "pendingOrders",
        []
      );

      const savedSuppliers = readStorage(
        "suppliers",
        []
      );

      setOrderItems(
        Array.isArray(savedOrder)
          ? savedOrder
          : []
      );

      setPendingOrders(
        Array.isArray(savedPendingOrders)
          ? savedPendingOrders
          : []
      );

      setSuppliers(
        Array.isArray(savedSuppliers)
          ? savedSuppliers
          : []
      );
    }, []);

    // =====================================================
    // AUTO SAVE CURRENT ORDER
    // =====================================================

    useEffect(() => {
      writeStorage(
        "currentOrder",
        orderItems
      );
    }, [orderItems]);

    // =====================================================
    // CURRENT STOCK
    // =====================================================

    const currentStock = useMemo(() => {
      const storedStock = readStorage(
        "stock",
        []
      );

      if (
        Array.isArray(stock) &&
        stock.length > 0
      ) {
        return stock;
      }

      return Array.isArray(storedStock)
        ? storedStock
        : [];
    }, [stock]);

    // =====================================================
    // FIND STOCK MEDICINE
    // =====================================================

    const findStockMedicine = (name) => {
      const cleanName = normalizeMedicine(name);

      if (!cleanName) return null;

      return currentStock.find((item) => {
        const stockName = normalizeMedicine(
          item.medicine ||
            item.name ||
            item.itemName ||
            ""
        );

        return stockName === cleanName;
      });
    };

    // =====================================================
    // FIND MEDICINE BY BARCODE
    // =====================================================

    const findMedicineByBarcode = (code) => {
      const cleanCode = normalizeBarcode(code);

      if (!cleanCode) return null;

      return currentStock.find((item) => {
        const values = [
          item.barcode,
          item.barCode,
          item.Barcode,
          item.barcodeNo,
          item.barcodeNumber,
          item.code,
          item.itemBarcode,
        ];

        return values.some(
          (value) =>
            normalizeBarcode(value) ===
            cleanCode
        );
      });
    };

    // =====================================================
    // GET LAST PURCHASE RATE
    // =====================================================

    const getPreviousPurchaseRate = (
      medicineName,
      companyName = ""
    ) => {
      const med = normalizeMedicine(
        medicineName
      );

      const company = normalizeMedicine(
        companyName
      );

      if (!med) return 0;

      // ===================================================
      // 1. PURCHASE HISTORY
      // ===================================================

      const purchaseHistory =
        readStorage(
          "purchaseHistory",
          []
        );

      if (
        Array.isArray(purchaseHistory)
      ) {
        for (
          const purchase of purchaseHistory
        ) {
          const items =
            Array.isArray(
              purchase.items
            )
              ? purchase.items
              : [];

          for (
            const item of items
          ) {
            const itemMedicine =
              normalizeMedicine(
                item.medicine ||
                  item.name ||
                  item.itemName ||
                  ""
              );

            const itemCompany =
              normalizeMedicine(
                item.company ||
                  ""
              );

            if (
              itemMedicine === med &&
              (
                !company ||
                !itemCompany ||
                itemCompany === company
              )
            ) {
              const rate =
                toNumber(
                  item.purchaseRate ??
                    item.purchase_rate ??
                    item.previousPurchaseRate ??
                    item.previousRate ??
                    0
                );

              if (rate > 0) {
                return rate;
              }
            }
          }
        }
      }

      // ===================================================
      // 2. STOCK
      // ===================================================

      const stockData =
        readStorage(
          "stock",
          []
        );

      if (
        Array.isArray(stockData)
      ) {
        const matchingItems =
          stockData.filter(
            (item) => {
              const itemMedicine =
                normalizeMedicine(
                  item.medicine ||
                    item.name ||
                    item.itemName ||
                    ""
                );

              const itemCompany =
                normalizeMedicine(
                  item.company ||
                    ""
                );

              return (
                itemMedicine === med &&
                (
                  !company ||
                  !itemCompany ||
                  itemCompany === company
                )
              );
            }
          );

        matchingItems.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.updatedAt ||
                  a.createdAt ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b.updatedAt ||
                  b.createdAt ||
                  0
              ).getTime();

            return dateB - dateA;
          }
        );

        for (
          const item of matchingItems
        ) {
          const rate =
            toNumber(
              item.purchaseRate ??
                item.purchase_rate ??
                item.purchasePrice ??
                item.purchase_price ??
                0
            );

          if (rate > 0) {
            return rate;
          }
        }
      }

      return 0;
    };

    // =====================================================
    // BARCODE SEARCH
    // =====================================================

    const searchBarcode = (value) => {
      const code = String(
        value || ""
      ).trim();

      if (!code) return;

      const found =
        findMedicineByBarcode(
          code
        );

      if (!found) return;

      const foundMedicine =
        found.medicine ||
        found.name ||
        found.itemName ||
        "";

      const foundCompany =
        found.company ||
        found.companyName ||
        "";

      const foundSupplier =
        found.supplier ||
        found.supplierName ||
        "";

      const foundMobile =
        found.supplierMobile ||
        found.mobile ||
        found.whatsapp ||
        "";

      setMedicine(
        foundMedicine
      );

      setCompany(
        foundCompany
      );

      if (foundSupplier) {
        setSupplier(
          foundSupplier
        );

        setSupplierMobile(
          foundMobile
        );

        saveSupplierData(
          foundSupplier,
          foundMobile
        );
      }

      setBarcode(
        found.barcode ||
          found.barCode ||
          code
      );

      setTimeout(() => {
        medicineRef.current?.focus();
      }, 50);
    };

    // =====================================================
    // MEDICINE CHANGE
    // =====================================================

    const handleMedicineChange = (
      value
    ) => {
      setMedicine(value);

      const found =
        findStockMedicine(
          value
        );

      if (found) {
        setCompany(
          found.company ||
            found.companyName ||
            ""
        );

        setBarcode(
          found.barcode ||
            found.barCode ||
            ""
        );

        const foundSupplier =
          found.supplier ||
          found.supplierName ||
          "";

        const foundMobile =
          found.supplierMobile ||
          found.mobile ||
          found.whatsapp ||
          "";

        if (foundSupplier) {
          setSupplier(
            foundSupplier
          );

          setSupplierMobile(
            foundMobile
          );
        }
      }
    };

    // =====================================================
    // BARCODE ENTER
    // =====================================================

    const handleBarcodeKeyDown = (
      e
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();

        searchBarcode(
          barcode
        );

        setTimeout(() => {
          medicineRef.current?.focus();
        }, 100);
      }
    };

    // =====================================================
    // SAVE SUPPLIER DATA
    // =====================================================

    const saveSupplierData = (
      name,
      mobile = ""
    ) => {
      const supplierName =
        String(
          name || ""
        ).trim();

      const supplierPhone =
        String(
          mobile || ""
        ).trim();

      if (!supplierName) return;

      const oldSuppliers =
        readStorage(
          "suppliers",
          []
        );

      const list =
        Array.isArray(
          oldSuppliers
        )
          ? oldSuppliers
          : [];

      const existingIndex =
        list.findIndex(
          (item) =>
            String(
              item.name || ""
            )
              .trim()
              .toLowerCase() ===
            supplierName.toLowerCase()
        );

      const supplierData = {
        id:
          existingIndex >= 0
            ? list[
                existingIndex
              ].id ||
              makeId("SUP")
            : makeId("SUP"),

        name:
          supplierName,

        mobile:
          supplierPhone ||
          (
            existingIndex >= 0
              ? list[
                  existingIndex
                ].mobile || ""
              : ""
          ),

        whatsapp:
          supplierPhone ||
          (
            existingIndex >= 0
              ? list[
                  existingIndex
                ].whatsapp || ""
              : ""
          ),

        updatedAt:
          new Date().toISOString(),
      };

      let updated;

      if (
        existingIndex >= 0
      ) {
        updated = [
          ...list,
        ];

        updated[
          existingIndex
        ] = {
          ...updated[
            existingIndex
          ],
          ...supplierData,
        };
      } else {
        updated = [
          supplierData,
          ...list,
        ];
      }

      setSuppliers(
        updated
      );

      writeStorage(
        "suppliers",
        updated
      );
    };

    // =====================================================
    // SAVE SUPPLIER
    // =====================================================

    const saveSupplier = () => {
      const name =
        String(
          supplier || ""
        ).trim();

      const mobile =
        String(
          supplierMobile || ""
        ).trim();

      if (!name) {
        alert(
          "⚠️ पहले Supplier Name डालें"
        );
        return;
      }

      saveSupplierData(
        name,
        mobile
      );

      alert(
        "✅ Supplier Save हो गया"
      );
    };

    // =====================================================
    // SUPPLIER SEARCH
    // =====================================================

    const filteredSuppliers =
      useMemo(() => {
        const search =
          String(
            supplier || ""
          )
            .trim()
            .toLowerCase();

        if (!search) {
          return suppliers.slice(
            0,
            20
          );
        }

        return suppliers
          .filter(
            (item) => {
              const name =
                String(
                  item.name ||
                    ""
                ).toLowerCase();

              const mobile =
                String(
                  item.mobile ||
                    item.whatsapp ||
                    ""
                ).toLowerCase();

              return (
                name.includes(
                  search
                ) ||
                mobile.includes(
                  search
                )
              );
            }
          )
          .slice(0, 20);
      }, [
        suppliers,
        supplier,
      ]);

    // =====================================================
    // SELECT SUPPLIER
    // =====================================================

    const selectSavedSupplier = (
      item
    ) => {
      if (!item) return;

      setSupplier(
        item.name || ""
      );

      setSupplierMobile(
        item.mobile ||
          item.whatsapp ||
          ""
      );

      setSupplierSearchOpen(
        false
      );

      setSupplierSearchIndex(
        -1
      );

      setTimeout(() => {
        medicineRef.current?.focus();
      }, 100);
    };

    // =====================================================
    // SUPPLIER KEYBOARD
    // =====================================================

    const handleSupplierKeyDown = (
      e
    ) => {
      const list =
        filteredSuppliers;

      if (
        !supplierSearchOpen &&
        list.length > 0
      ) {
        if (
          e.key ===
            "ArrowDown" ||
          e.key ===
            "ArrowUp"
        ) {
          e.preventDefault();

          setSupplierSearchOpen(
            true
          );
        }
      }

      if (
        e.key === "ArrowDown"
      ) {
        e.preventDefault();

        setSupplierSearchOpen(
          true
        );

        setSupplierSearchIndex(
          (prev) => {
            if (
              list.length === 0
            )
              return -1;

            if (
              prev >=
              list.length - 1
            ) {
              return 0;
            }

            return prev + 1;
          }
        );

        return;
      }

      if (
        e.key === "ArrowUp"
      ) {
        e.preventDefault();

        setSupplierSearchOpen(
          true
        );

        setSupplierSearchIndex(
          (prev) => {
            if (
              list.length === 0
            )
              return -1;

            if (prev <= 0) {
              return (
                list.length - 1
              );
            }

            return prev - 1;
          }
        );

        return;
      }

      if (
        e.key === "Enter"
      ) {
        if (
          supplierSearchOpen &&
          supplierSearchIndex >=
            0 &&
          list[
            supplierSearchIndex
          ]
        ) {
          e.preventDefault();

          selectSavedSupplier(
            list[
              supplierSearchIndex
            ]
          );

          return;
        }

        const exact =
          suppliers.find(
            (item) => {
              const name =
                String(
                  item.name ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              const mobile =
                String(
                  item.mobile ||
                    item.whatsapp ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              const search =
                String(
                  supplier || ""
                )
                  .trim()
                  .toLowerCase();

              return (
                name ===
                  search ||
                mobile ===
                  search
              );
            }
          );

        if (exact) {
          e.preventDefault();

          selectSavedSupplier(
            exact
          );
        }
      }

      if (
        e.key === "Escape"
      ) {
        setSupplierSearchOpen(
          false
        );

        setSupplierSearchIndex(
          -1
        );
      }
    };

    // =====================================================
    // ADD ORDER ITEM
    // =====================================================

    const addOrderItem = () => {
      const med =
        String(
          medicine || ""
        ).trim();

      const qty =
        toNumber(
          quantity
        );

      const sup =
        String(
          supplier || ""
        ).trim();

      const mobile =
        String(
          supplierMobile || ""
        ).trim();

      const cleanBarcode =
        normalizeBarcode(
          barcode
        );

      if (!sup) {
        alert(
          "⚠️ पहले Supplier Name select करें"
        );

        supplierRef.current?.focus();

        return;
      }

      if (!med) {
        alert(
          "⚠️ पहले Medicine Name डालें"
        );

        medicineRef.current?.focus();

        return;
      }

      if (qty <= 0) {
        alert(
          "⚠️ Quantity सही डालें"
        );

        return;
      }

      saveSupplierData(
        sup,
        mobile
      );
// =====================================================
// GET PREVIOUS PURCHASE RATE + SUPPLIER
// =====================================================

const oldPurchases =
  readStorage(
    "purchaseHistory",
    []
  );

const purchaseHistory =
  Array.isArray(oldPurchases)
    ? oldPurchases
    : [];

const medicineKey = String(
  med
).trim().toLowerCase();

const previousPurchases =
  purchaseHistory
    .flatMap((purchase) =>
      (purchase.items || []).map(
        (purchaseItem) => ({
          ...purchaseItem,

          historySupplier:
            purchase.supplier || "",

          historyDate:
            purchase.date || "",
        })
      )
    )
    .filter((purchaseItem) => {
      const purchaseMedicine =
        String(
          purchaseItem.medicine ||
            purchaseItem.name ||
            ""
        )
          .trim()
          .toLowerCase();

      return (
        purchaseMedicine ===
        medicineKey
      );
    })
    .sort(
      (a, b) =>
        new Date(
          b.historyDate || 0
        ) -
        new Date(
          a.historyDate || 0
        )
    );

const latestPreviousPurchase =
  previousPurchases.length > 0
    ? previousPurchases[0]
    : null;

const previousPurchaseRate =
  toNumber(
    latestPreviousPurchase?.purchaseRate ??
      latestPreviousPurchase?.purchase_rate ??
      0
  );

const previousSupplier =
  latestPreviousPurchase?.historySupplier ||
  "";
      // ===================================================
      // DUPLICATE BARCODE CHECK IN CURRENT ORDER
      // ===================================================

      if (cleanBarcode) {
        const duplicateBarcode =
          orderItems.find(
            (item) =>
              normalizeBarcode(
                item.barcode
              ) ===
              cleanBarcode
          );

        if (duplicateBarcode) {
          const sameMedicine =
            normalizeMedicine(
              duplicateBarcode.medicine
            ) ===
            normalizeMedicine(
              med
            );

          if (sameMedicine) {
            const updated =
              orderItems.map(
                (item) => {
                  if (
                    item.id !==
                    duplicateBarcode.id
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    quantity:
                      toNumber(
                        item.quantity
                      ) + qty,

                    mobile:
                      mobile ||
                      item.mobile ||
                      "",

                    company:
                      company ||
                      item.company ||
                      "",
                  };
                }
              );

            setOrderItems(
              updated
            );

            setMedicine("");
            setBarcode("");
            setCompany("");
            setQuantity("");

            setTimeout(() => {
              medicineRef.current?.focus();
            }, 100);

            return;
          }

          alert(
            `⚠️ यह Barcode पहले से "${duplicateBarcode.medicine}" के नाम से Order में मौजूद है।\n\nएक ही Barcode को दूसरी Medicine के साथ नहीं जोड़ा जा सकता।`
          );

          return;
        }
      }

      // ===================================================
      // SAME MEDICINE + SAME SUPPLIER
      // ===================================================

      const existingItemIndex =
        orderItems.findIndex(
          (item) =>
            String(
              item.supplier ||
                ""
            )
              .trim()
              .toLowerCase() ===
              sup.toLowerCase() &&
            normalizeMedicine(
              item.medicine
            ) ===
              normalizeMedicine(
                med
              )
        );

      if (
        existingItemIndex >=
        0
      ) {
        const updated = [
          ...orderItems,
        ];

        updated[
          existingItemIndex
        ] = {
          ...updated[
            existingItemIndex
          ],

          quantity:
            toNumber(
              updated[
                existingItemIndex
              ].quantity
            ) + qty,

          mobile:
            mobile ||
            updated[
              existingItemIndex
            ].mobile ||
            "",

          barcode:
            cleanBarcode ||
            normalizeBarcode(
              updated[
                existingItemIndex
              ].barcode
            ) ||
            "",
        };

        setOrderItems(
          updated
        );
      } else {
        // =================================================
        // FIND STOCK
        // =================================================

        const foundStock =
          findStockMedicine(
            med
          );

        // =================================================
        // AUTO SAVE NEW MEDICINE / DUPLICATE BARCODE FIX
        // =================================================

        const oldStock =
          readStorage(
            "stock",
            []
          );

        const stockArray =
          Array.isArray(
            oldStock
          )
            ? oldStock
            : [];

        let updatedStock =
          [...stockArray];

        // =================================================
        // BARCODE ALREADY EXISTS?
        // =================================================

        let barcodeExistingIndex =
          -1;

        if (
          cleanBarcode
        ) {
          barcodeExistingIndex =
            updatedStock.findIndex(
              (item) => {
                const itemBarcode =
                  normalizeBarcode(
                    item.barcode ||
                      item.barCode ||
                      item.Barcode ||
                      item.barcodeNo ||
                      item.barcodeNumber ||
                      item.code ||
                      item.itemBarcode ||
                      ""
                  );

                return (
                  itemBarcode &&
                  itemBarcode ===
                    cleanBarcode
                );
              }
            );
        }

        // =================================================
        // BARCODE EXISTS
        // =================================================

        if (
          barcodeExistingIndex >=
          0
        ) {
          const oldItem =
            updatedStock[
              barcodeExistingIndex
            ];

          updatedStock[
            barcodeExistingIndex
          ] = {
            ...oldItem,

            barcode:
              oldItem.barcode ||
              cleanBarcode,

            medicine:
              oldItem.medicine ||
              oldItem.name ||
              oldItem.itemName ||
              med,

            name:
              oldItem.name ||
              oldItem.medicine ||
              med,

            company:
              oldItem.company ||
              oldItem.companyName ||
              company,

            supplier:
              oldItem.supplier ||
              oldItem.supplierName ||
              sup,

            supplierMobile:
              oldItem.supplierMobile ||
              oldItem.mobile ||
              mobile,

            unit:
              oldItem.unit ||
              unit ||
              "PCS",

            updatedAt:
              new Date().toISOString(),
          };

          writeStorage(
            "stock",
            updatedStock
          );

          if (
            typeof setStock ===
            "function"
          ) {
            setStock(
              updatedStock
            );
          }
        }

        // =================================================
        // BARCODE NOT FOUND
        // =================================================

        else {
          // ===============================================
          // MEDICINE NAME DUPLICATE CHECK
          // ===============================================

          const medicineExistingIndex =
            updatedStock.findIndex(
              (item) => {
                const itemBarcode =
                  normalizeBarcode(
                    item.barcode ||
                      item.barCode ||
                      item.Barcode ||
                      ""
                  );

                const itemMedicine =
                  normalizeMedicine(
                    item.medicine ||
                      item.name ||
                      item.itemName ||
                      ""
                  );

                return (
                  !cleanBarcode &&
                  !itemBarcode &&
                  itemMedicine ===
                    normalizeMedicine(
                      med
                    )
                );
              }
            );

          // ===============================================
          // MEDICINE ALREADY EXISTS
          // ===============================================

          if (
            medicineExistingIndex >=
            0
          ) {
            const oldItem =
              updatedStock[
                medicineExistingIndex
              ];

            updatedStock[
              medicineExistingIndex
            ] = {
              ...oldItem,

              company:
                oldItem.company ||
                company,

              supplier:
                oldItem.supplier ||
                sup,

              supplierMobile:
                oldItem.supplierMobile ||
                mobile,

              unit:
                oldItem.unit ||
                unit ||
                "PCS",

              updatedAt:
                new Date().toISOString(),
            };

            writeStorage(
              "stock",
              updatedStock
            );

            if (
              typeof setStock ===
              "function"
            ) {
              setStock(
                updatedStock
              );
            }
          }

          // ===============================================
          // COMPLETELY NEW MEDICINE
          // ===============================================

          else {
            const newStockMedicine = {
              id: makeId(
                "STOCK"
              ),

              medicine: med,

              name: med,

              barcode:
                String(
                  barcode || ""
                ).trim(),

              company:
                String(
                  company || ""
                ).trim(),

              quantity: 0,

              unit:
                String(
                  unit || "PCS"
                ).trim() ||
                "PCS",

              supplier: sup,

              supplierMobile:
                mobile,

              purchaseRate: 0,

              purchase_rate: 0,

              saleRate: 0,

              sale_rate: 0,

              mrp: 0,

              gst: 0,

              gstRate: 0,

              batch: "",

              batchNo: "",

              expiry: "",

              createdAt:
                new Date().toISOString(),

              updatedAt:
                new Date().toISOString(),
            };

            updatedStock = [
              newStockMedicine,
              ...updatedStock,
            ];

            writeStorage(
              "stock",
              updatedStock
            );

            if (
              typeof setStock ===
              "function"
            ) {
              setStock(
                updatedStock
              );
            }
          }
        }

        // =================================================
        // CREATE ORDER ITEM
        // =================================================

        const newItem = {
          id: makeId(
            "ORDERITEM"
          ),

          supplier: sup,

          mobile,

          medicine: med,

          barcode:
            String(
              barcode || ""
            ).trim(),

          company:
            String(
              company || ""
            ).trim(),

          quantity: qty,

          unit:
            String(
              unit || "PCS"
            ).trim() ||
            "PCS",

          newMedicine:
            !foundStock,

          createdAt:
            new Date().toISOString(),
        };

        setOrderItems([
          ...orderItems,
          newItem,
        ]);
      }

      setMedicine("");
      setBarcode("");
      setCompany("");
      setQuantity("");

      setTimeout(() => {
        medicineRef.current?.focus();
      }, 100);
    };

    // =====================================================
    // REMOVE ORDER
    // =====================================================

    const removeOrderItem = (
      id
    ) => {
      setOrderItems(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !== id
          )
      );
    };

    // =====================================================
    // CLEAR ORDER
    // =====================================================

    const clearOrder = () => {
      if (
        orderItems.length ===
        0
      ) {
        return;
      }

      const yes =
        window.confirm(
          "क्या आप पूरा Current Order Clear करना चाहते हैं?"
        );

      if (!yes) return;

      setOrderItems([]);

      writeStorage(
        "currentOrder",
        []
      );

      setTimeout(() => {
        medicineRef.current?.focus();
      }, 100);
    };

    // =====================================================
    // GROUP BY SUPPLIER
    // =====================================================

    const groupedOrders =
      useMemo(() => {
        const groups = {};

        orderItems.forEach(
          (item) => {
            const name =
              String(
                item.supplier ||
                  "Unknown Supplier"
              ).trim() ||
              "Unknown Supplier";

            if (!groups[name]) {
              groups[name] = {
                supplier:
                  name,
                mobile:
                  item.mobile ||
                  "",
                items: [],
              };
            }

            if (
              item.mobile &&
              !groups[name]
                .mobile
            ) {
              groups[
                name
              ].mobile =
                item.mobile;
            }

            groups[
              name
            ].items.push(
              item
            );
          }
        );

        return Object.values(
          groups
        );
      }, [orderItems]);

    // =====================================================
    // WHATSAPP NUMBER
    // =====================================================

    const cleanWhatsAppNumber = (
      number
    ) => {
      let value =
        String(
          number || ""
        ).replace(
          /\D/g,
          ""
        );

      if (
        value.length ===
        10
      ) {
        value = `91${value}`;
      }

      return value;
    };

    // =====================================================
    // WHATSAPP MESSAGE
    // =====================================================

    // =====================================================
// WHATSAPP MESSAGE - TABLE FORMAT
// =====================================================

const createWhatsAppMessage = (group) => {
  const lines = [];

  lines.push("🧾 *SHIVAM MEDICAL STORE*");
  lines.push("📦 *PURCHASE ORDER*");
  lines.push(`🏭 Supplier: *${group.supplier}*`);
  lines.push("");

  // TABLE HEADER
  lines.push(
    "Medicine              | Qty | Company"
  );
  lines.push(
    "----------------------|-----|----------------"
  );

  // TABLE ROWS
  group.items.forEach((item) => {
    const medicine = String(
      item.medicine || "-"
    ).trim();

    const quantity = `${item.quantity || 0} ${
      item.unit || "PCS"
    }`;

    const company = String(
      item.company || "-"
    ).trim();

    lines.push(
      `${medicine} | ${quantity} | ${company}`
    );
  });

  lines.push("");

  // FINAL MESSAGE
  lines.push("📦 *कृपया माल भेज दीजिए।*");
  lines.push("");
  lines.push("धन्यवाद 🙏");

  return lines.join("\n");
};
    // =====================================================
    // SHARE WHATSAPP
    // =====================================================

    const shareWhatsApp = (
      group
    ) => {
      if (
        !group ||
        !group.items ||
        group.items.length ===
          0
      ) {
        alert(
          "⚠️ इस Supplier का Order खाली है"
        );

        return;
      }

      const message =
        createWhatsAppMessage(
          group
        );

      const number =
        cleanWhatsAppNumber(
          group.mobile
        );

      const url = number
        ? `https://wa.me/${number}?text=${encodeURIComponent(
            message
          )}`
        : `https://wa.me/?text=${encodeURIComponent(
            message
          )}`;

      const pending =
        readStorage(
          "pendingOrders",
          []
        );

      const pendingArray =
        Array.isArray(
          pending
        )
          ? pending
          : [];

      const pendingOrder = {
        id: makeId(
          "PENDING"
        ),

        supplier:
          group.supplier,

        mobile:
          group.mobile ||
          "",

        items:
          group.items.map(
            (item) => ({
              ...item,
            })
          ),

        date:
          new Date().toISOString(),

        status:
          "PENDING",

        whatsappSent:
          true,
      };

      const updatedPending =
        [
          pendingOrder,
          ...pendingArray,
        ];

      setPendingOrders(
        updatedPending
      );

      writeStorage(
        "pendingOrders",
        updatedPending
      );

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    };

   // =====================================================
// OPEN RECEIVE
// =====================================================

const openReceiveOrder = (
  order
) => {
  if (!order) return;

  // ===================================================
  // OLD PURCHASE HISTORY
  // ===================================================

  const oldPurchases = readStorage(
    "purchaseHistory",
    []
  );

  const purchaseHistory =
    Array.isArray(oldPurchases)
      ? oldPurchases
      : [];

  const items = (
    Array.isArray(order.items)
      ? order.items
      : []
  ).map((item) => {
    // =================================================
    // PREVIOUS PURCHASE RATE
    // =================================================

    const oldRate =
      getPreviousPurchaseRate(
        item.medicine,
        item.company
      );

    // =================================================
    // FIND PREVIOUS SUPPLIER
    // =================================================

    const medicineName = String(
      item.medicine ||
        item.name ||
        ""
    )
      .trim()
      .toLowerCase();

    const companyName = String(
      item.company || ""
    )
      .trim()
      .toLowerCase();

    const previousPurchases =
      purchaseHistory
        .flatMap((purchase) =>
          Array.isArray(
            purchase.items
          )
            ? purchase.items.map(
                (purchaseItem) => ({
                  ...purchaseItem,

                  purchaseSupplier:
                    purchase.supplier ||
                    "",

                  purchaseSupplierMobile:
                    purchase.supplierMobile ||
                    "",

                  purchaseDate:
                    purchase.date ||
                    "",
                })
              )
            : []
        )
        .filter((purchaseItem) => {
          const purchaseMedicine =
            String(
              purchaseItem.medicine ||
                purchaseItem.name ||
                ""
            )
              .trim()
              .toLowerCase();

          const purchaseCompany =
            String(
              purchaseItem.company ||
                ""
            )
              .trim()
              .toLowerCase();

          const medicineMatch =
            purchaseMedicine ===
            medicineName;

          // Company available हो तो
          // company भी match करें
          const companyMatch =
            !companyName ||
            !purchaseCompany ||
            purchaseCompany ===
              companyName;

          return (
            medicineMatch &&
            companyMatch
          );
        })
        .sort(
          (a, b) =>
            new Date(
              b.purchaseDate || 0
            ) -
            new Date(
              a.purchaseDate || 0
            )
        );

    const previousSupplier =
      previousPurchases.length > 0
        ? previousPurchases[0]
            .purchaseSupplier || ""
        : "";

    const previousSupplierMobile =
      previousPurchases.length > 0
        ? previousPurchases[0]
            .purchaseSupplierMobile ||
          ""
        : "";

    // =================================================
    // STOCK
    // =================================================

    const stockItem =
      findStockMedicine(
        item.medicine
      );

    const barcodeValue =
      item.barcode ||
      stockItem?.barcode ||
      stockItem?.barCode ||
      "";

    // =================================================
    // RECEIVE ITEM
    // =================================================

    return {
      ...item,

      receivedQty:
        item.receivedQty ??
        item.quantity ??
        0,

      unit:
        item.unit ||
        "PCS",

      batch:
        item.batch ||
        "",

      expiry:
        item.expiry ||
        "",

      // ===============================================
      // PREVIOUS RATE
      // ===============================================

      previousRate:
        oldRate,

      previousPurchaseRate:
        oldRate,

      // ===============================================
      // PREVIOUS SUPPLIER
      // ===============================================

      previousSupplier:
        previousSupplier,

      previousSupplierMobile:
        previousSupplierMobile,

      // ===============================================
      // NEW RECEIVE VALUES
      // ===============================================

      gst: 0,

      purchaseRate:
        "",

      saleRate:
        "",

      mrp:
        "",

      barcode:
        barcodeValue,
    };
  });

  // ===================================================
  // OPEN RECEIVE MODAL
  // ===================================================

  setReceiveOrder(
    order
  );

  setReceiveItems(
    items
  );
};
    // =====================================================
    // UPDATE RECEIVE
    // =====================================================

    const updateReceiveItem = (
      index,
      field,
      value
    ) => {
      setReceiveItems(
        (prev) =>
          prev.map(
            (item, i) =>
              i === index
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          )
      );
    };

    // =====================================================
    // CONFIRM RECEIVE
    // =====================================================

    const confirmReceiveOrder =
      () => {
        if (!receiveOrder)
          return;

        if (
          receiveItems.length ===
          0
        ) {
          alert(
            "⚠️ Receive करने के लिए कोई item नहीं है"
          );

          return;
        }

        const validItems =
          receiveItems.filter(
            (item) =>
              toNumber(
                item.receivedQty
              ) > 0
          );

        if (
          validItems.length ===
          0
        ) {
          alert(
            "⚠️ कम से कम एक Medicine की Received Quantity डालें"
          );

          return;
        }

        let updatedStock = [
          ...currentStock,
        ];

        validItems.forEach(
          (item) => {
            const receivedQty =
              toNumber(
                item.receivedQty
              );

            const medicineName =
              String(
                item.medicine ||
                  item.name ||
                  ""
              ).trim();

            const companyName =
              String(
                item.company ||
                  ""
              ).trim();

            const batch =
              String(
                item.batch ||
                  ""
              ).trim();

            const expiry =
              String(
                item.expiry ||
                  ""
              ).trim();

            const basePurchaseRate =
  toNumber(
    item.purchaseRate
  );

const itemGst =
  toNumber(
    item.gst
  );

// ===========================================
// PURCHASE RATE + GST
// Example:
// Purchase Rate ₹100
// GST 18%
// Final Purchase Rate ₹118
// ===========================================

const gstAmount =
  (basePurchaseRate * itemGst) / 100;

const purchaseRate =
  basePurchaseRate + gstAmount;

const saleRate =
  toNumber(
    item.saleRate
  );

const mrp =
  toNumber(
    item.mrp
  );

            const itemUnit =
              String(
                item.unit ||
                  "PCS"
              ).trim() ||
              "PCS";

            const barcodeValue =
              String(
                item.barcode ||
                  ""
              ).trim();

            const incomingBarcode =
              normalizeBarcode(
                barcodeValue
              );

            // ===========================================
            // DUPLICATE BARCODE PROTECTION
            // BARCODE IS ALWAYS FIRST PRIORITY
            // ===========================================

            const existingIndex =
              updatedStock.findIndex(
                (stockItem) => {
                  const stockBarcode =
                    normalizeBarcode(
                      stockItem.barcode ||
                        stockItem.barCode ||
                        stockItem.Barcode ||
                        stockItem.barcodeNo ||
                        stockItem.barcodeNumber ||
                        stockItem.code ||
                        stockItem.itemBarcode ||
                        ""
                    );

                  // ======================================
                  // SAME BARCODE = SAME STOCK
                  // ======================================

                  if (
                    incomingBarcode &&
                    stockBarcode
                  ) {
                    return (
                      incomingBarcode ===
                      stockBarcode
                    );
                  }

                  // ======================================
                  // NO BARCODE
                  // Medicine + Company + Batch + Expiry
                  // ======================================

                  const stockMedicine =
                    normalizeMedicine(
                      stockItem.medicine ||
                        stockItem.name ||
                        stockItem.itemName ||
                        ""
                    );

                  const stockCompany =
                    normalizeMedicine(
                      stockItem.company ||
                        ""
                    );

                  const stockBatch =
                    normalizeMedicine(
                      stockItem.batch ||
                        stockItem.batchNo ||
                        ""
                    );

                  const stockExpiry =
                    String(
                      stockItem.expiry ||
                        ""
                    ).trim();

                  return (
                    !incomingBarcode &&
                    stockMedicine ===
                      normalizeMedicine(
                        medicineName
                      ) &&
                    stockCompany ===
                      normalizeMedicine(
                        companyName
                      ) &&
                    stockBatch ===
                      normalizeMedicine(
                        batch
                      ) &&
                    stockExpiry ===
                      expiry
                  );
                }
              );

            // ===========================================
            // UPDATE EXISTING STOCK
            // ===========================================

            if (
              existingIndex >=
              0
            ) {
              const old =
                updatedStock[
                  existingIndex
                ];

              updatedStock[
                existingIndex
              ] = {
                ...old,

                quantity:
                  toNumber(
                    old.quantity
                  ) +
                  receivedQty,

                barcode:
                  barcodeValue ||
                  old.barcode ||
                  old.barCode ||
                  "",

                medicine:
                  old.medicine ||
                  medicineName,

                name:
                  old.name ||
                  old.medicine ||
                  medicineName,

                company:
                  old.company ||
                  companyName,

                unit:
                  itemUnit,

                batch:
                  batch ||
                  old.batch ||
                  "",

                batchNo:
                  batch ||
                  old.batchNo ||
                  "",

                expiry:
                  expiry ||
                  old.expiry ||
                  "",

                

                saleRate:
                  saleRate ||
                  toNumber(
                    old.saleRate
                  ),

                sale_rate:
                  saleRate ||
                  toNumber(
                    old.sale_rate
                  ),

                mrp:
                  mrp ||
                  toNumber(
                    old.mrp
                  ),

                gst:
                  itemGst,

                gstRate:
                  itemGst,

                supplier:
                  receiveOrder.supplier,

                supplierMobile:
                  receiveOrder.mobile ||
                  "",

                updatedAt:
                  new Date().toISOString(),
              };
            }

            // ===========================================
            // NEW STOCK
            // ===========================================

            else {
              updatedStock.push({
                id: makeId(
                  "STOCK"
                ),

                medicine:
                  medicineName,

                name:
                  medicineName,

                barcode:
                  barcodeValue,

                company:
                  companyName,

                quantity:
                  receivedQty,

                unit:
                  itemUnit,

                batch:
                  batch,

                batchNo:
                  batch,

                expiry:
                  expiry,

                purchaseRate:
                  purchaseRate,

                purchase_rate:
                  purchaseRate,

                saleRate:
                  saleRate,

                sale_rate:
                  saleRate,

                mrp:
                  mrp,

                gst:
                  itemGst,

                gstRate:
                  itemGst,

                supplier:
                  receiveOrder.supplier,

                supplierMobile:
                  receiveOrder.mobile ||
                  "",

                createdAt:
                  new Date().toISOString(),

                updatedAt:
                  new Date().toISOString(),
              });
            }
          }
        );

        // =================================================
        // SAVE STOCK
        // =================================================

        writeStorage(
          "stock",
          updatedStock
        );

        if (
          typeof setStock ===
          "function"
        ) {
          setStock(
            updatedStock
          );
        }

        // =================================================
        // PURCHASE HISTORY
        // =================================================

        const oldPurchases =
          readStorage(
            "purchaseHistory",
            []
          );

        const purchaseHistory =
          Array.isArray(
            oldPurchases
          )
            ? oldPurchases
            : [];

        const purchaseEntry = {
          id: makeId(
            "PURCHASE"
          ),

          supplier:
            receiveOrder.supplier,

          supplierMobile:
            receiveOrder.mobile ||
            "",

          date:
            new Date().toISOString(),

          orderId:
            receiveOrder.id,

          items:
  validItems.map(
    (item) => ({
      ...item,

      id:
        item.id ||
        makeId("PURCHASEITEM"),

      medicine:
        item.medicine ||
        item.name ||
        "",

      name:
        item.name ||
        item.medicine ||
        "",

      supplier:
        item.supplier ||
        receiveOrder.supplier ||
        "",

      supplierName:
        item.supplierName ||
        item.supplier ||
        receiveOrder.supplier ||
        "",

      supplierMobile:
        item.supplierMobile ||
        receiveOrder.mobile ||
        "",

      receivedQty:
        toNumber(
          item.receivedQty
        ),

      quantity:
        toNumber(
          item.quantity
        ),

      previousRate:
        toNumber(
          item.previousRate ??
          item.previousPurchaseRate ??
          0
        ),

      previousPurchaseRate:
        toNumber(
          item.previousPurchaseRate ??
          item.previousRate ??
          0
        ),

      previousSupplier:
        item.previousSupplier ||
        "",

      previousSupplierMobile:
        item.previousSupplierMobile ||
        "",

      purchaseRate:
        toNumber(
          item.purchaseRate
        ),

      purchase_rate:
        toNumber(
          item.purchaseRate
        ),

      saleRate:
        toNumber(
          item.saleRate
        ),

      sale_rate:
        toNumber(
          item.saleRate
        ),

      mrp:
        toNumber(
          item.mrp
        ),

      gst:
        toNumber(
          item.gst
        ),

      gstRate:
        toNumber(
          item.gst
        ),

      barcode:
        item.barcode ||
        "",

      company:
        item.company ||
        "",

      unit:
        item.unit ||
        "PCS",

      batch:
        item.batch ||
        "",

      batchNo:
        item.batchNo ||
        item.batch ||
        "",

      expiry:
        item.expiry ||
        "",

      purchaseDate:
        new Date().toISOString(),

      createdAt:
        new Date().toISOString(),
          })
    ),
  };

  writeStorage(
    "purchaseHistory",
    [
      purchaseEntry,
      ...purchaseHistory,
    ]
  );

        // =================================================
        // REMOVE PENDING ORDER
        // =================================================

        const pending =
          readStorage(
            "pendingOrders",
            []
          );

        const pendingArray =
          Array.isArray(
            pending
          )
            ? pending
            : [];

        const remaining =
          pendingArray.filter(
            (item) =>
              item.id !==
              receiveOrder.id
          );

        setPendingOrders(
          remaining
        );

        writeStorage(
          "pendingOrders",
          remaining
        );

        // =================================================
        // RECEIVE HISTORY
        // =================================================

        const oldReceiveHistory =
          readStorage(
            "receiveHistory",
            []
          );

        const receiveHistory =
          Array.isArray(
            oldReceiveHistory
          )
            ? oldReceiveHistory
            : [];

        writeStorage(
          "receiveHistory",
          [
            {
              ...receiveOrder,

              receivedDate:
                new Date().toISOString(),

              receivedItems:
                validItems.map(
                  (item) => ({
                    ...item,

                    receivedQty:
                      toNumber(
                        item.receivedQty
                      ),

                    previousRate:
                      toNumber(
                        item.previousRate
                      ),

                    previousPurchaseRate:
                      toNumber(
                        item.previousPurchaseRate
                      ),

                    purchaseRate:
                      toNumber(
                        item.purchaseRate
                      ),

                    saleRate:
                      toNumber(
                        item.saleRate
                      ),

                    mrp:
                      toNumber(
                        item.mrp
                      ),

                    gst:
                      toNumber(
                        item.gst
                      ),
                  })
                ),

              status:
                "RECEIVED",
            },

            ...receiveHistory,
          ]
        );

        setReceiveOrder(
          null
        );

        setReceiveItems(
          []
        );

        alert(
          "✅ माल Receive हो गया और Stock में जोड़ दिया गया"
        );
      };
// =====================================================
// OPEN PREVIOUS PURCHASE RATE HISTORY
// STOCK SE PREVIOUS PURCHASE RATE
// =====================================================

const openPreviousRateHistory = (item) => {
  if (!item) return;

  const medicineName = String(
    item.medicine ||
      item.name ||
      item.medicineName ||
      ""
  )
    .trim()
    .toLowerCase();

  const companyName = String(
    item.company ||
      ""
  )
    .trim()
    .toLowerCase();

  const currentStock = Array.isArray(stock)
    ? stock
    : [];

  console.log(
    "🔍 CLICKED MEDICINE:",
    JSON.stringify(item, null, 2)
  );

  console.log(
    "🔍 FULL STOCK:",
    currentStock
  );

  // =====================================================
  // FIND SAME MEDICINE STOCK ITEMS
  // =====================================================

  const matchingStock = currentStock.filter(
    (stockItem) => {
      if (!stockItem) return false;

      const stockMedicine = String(
        stockItem.medicine ||
          stockItem.name ||
          stockItem.medicineName ||
          ""
      )
        .trim()
        .toLowerCase();

      const stockCompany = String(
        stockItem.company ||
          ""
      )
        .trim()
        .toLowerCase();

      return (
        stockMedicine === medicineName &&
        (
          !companyName ||
          !stockCompany ||
          stockCompany === companyName
        )
      );
    }
  );

  console.log(
    "📦 MATCHING STOCK:",
    matchingStock
  );

  // =====================================================
  // CREATE PREVIOUS RATE HISTORY
  // =====================================================

  const history = [];

  matchingStock.forEach(
    (stockItem) => {
      const purchaseRate = toNumber(
        stockItem.purchaseRate ??
          stockItem.purchase_rate ??
          stockItem.rate ??
          0
      );

      if (purchaseRate <= 0) {
        return;
      }

      history.push({
        ...stockItem,

        purchaseRate:
          purchaseRate,

        purchase_rate:
          purchaseRate,

        supplier:
          stockItem.supplier ||
          stockItem.supplierName ||
          "",

        supplierMobile:
          stockItem.supplierMobile ||
          stockItem.mobile ||
          "",

        purchaseDate:
          stockItem.purchaseDate ||
          stockItem.date ||
          stockItem.createdAt ||
          stockItem.updatedAt ||
          "",

        purchaseTime:
          stockItem.purchaseTime ||
          stockItem.time ||
          "",

        quantity:
          toNumber(
            stockItem.quantity
          ),

        batch:
          stockItem.batch ||
          stockItem.batchNo ||
          "",

        expiry:
          stockItem.expiry ||
          stockItem.expiryDate ||
          "",

        gst:
          toNumber(
            stockItem.gst ??
              stockItem.gstRate ??
              0
          ),
      });
    }
  );

  // =====================================================
  // SORT NEWEST FIRST
  // =====================================================

  history.sort(
    (a, b) =>
      new Date(
        b.purchaseDate || 0
      ) -
      new Date(
        a.purchaseDate || 0
      )
  );

  console.log(
    "📊 Previous Purchase History:",
    medicineName,
    history
  );

  // =====================================================
  // OPEN HISTORY
  // =====================================================

  setPreviousRateHistory(
    history
  );

  setPreviousRateMedicine(
    item.medicine ||
      item.name ||
      ""
  );

  setShowPreviousRateHistory(
    true
  );
};
    // =====================================================
    // CLOSE HISTORY
    // =====================================================

    const closeHistoryOrder = () => {
      setSelectedHistoryOrder(
        null
      );
    };
// =====================================================
// CANCEL PENDING ORDER
// =====================================================

const cancelPendingOrder = (order) => {
  if (!order) return;

  const confirmCancel = window.confirm(
    `क्या आप यह Order Cancel करना चाहते हैं?\n\nSupplier: ${
      order.supplier || "-"
    }`
  );

  if (!confirmCancel) return;

  const pending =
    readStorage(
      "pendingOrders",
      []
    );

  const pendingArray =
    Array.isArray(pending)
      ? pending
      : [];

  const remaining =
    pendingArray.filter(
      (item) =>
        item.id !== order.id
    );

  setPendingOrders(
    remaining
  );

  writeStorage(
    "pendingOrders",
    remaining
  );

  const oldCancelled =
    readStorage(
      "cancelledOrders",
      []
    );

  const cancelledOrders =
    Array.isArray(oldCancelled)
      ? oldCancelled
      : [];

  writeStorage(
    "cancelledOrders",
    [
      {
        ...order,

        cancelledAt:
          new Date().toISOString(),

        status:
          "CANCELLED",
      },

      ...cancelledOrders,
    ]
  );

  alert(
    "❌ Order Cancel हो गया"
  );
};
    // =====================================================
    // MAIN UI
    // =====================================================

    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "15px",
          boxSizing: "border-box",
          background: "#f4f6f8",
          minHeight: "100vh",
        }}
      >
        {/* HEADER */}

        <div style={cardStyle}>
          <h1
            style={{
              margin: "0 0 6px",
            }}
          >
            🧾 Purchase Order
          </h1>

          <div
            style={{
              color: "#666",
              fontSize: "14px",
            }}
          >
            Order बनाते समय केवल माल की
            Quantity और Supplier रखें।
            GST और Purchase Rate माल Receive
            करते समय भरें।
          </div>
        </div>

        {/* CREATE ORDER */}

        <div style={cardStyle}>
          <h2>
            ➕ Add Medicine To Order
          </h2>

          {/* SUPPLIER */}

          <div
            style={{
              position: "relative",
              marginBottom: "15px",
            }}
          >
            <label style={labelStyle}>
              Supplier Name / Mobile Search
            </label>

            <input
              ref={supplierRef}
              value={supplier}
              onChange={(e) => {
                setSupplier(
                  e.target.value
                );

                setSupplierSearchOpen(
                  true
                );

                setSupplierSearchIndex(
                  -1
                );
              }}
              onFocus={() => {
                setSupplierSearchOpen(
                  true
                );
              }}
              onKeyDown={
                handleSupplierKeyDown
              }
              placeholder="Supplier Name या Mobile लिखें"
              autoComplete="off"
              style={inputStyle}
            />

            {supplierSearchOpen &&
              filteredSuppliers.length >
                0 && (
                <div
                  style={{
                    position:
                      "absolute",
                    top: "82px",
                    left: 0,
                    right: 0,
                    zIndex: 5000,
                    background:
                      "white",
                    border:
                      "1px solid #ccc",
                    borderRadius:
                      "8px",
                    boxShadow:
                      "0 5px 15px rgba(0,0,0,0.15)",
                    maxHeight:
                      "300px",
                    overflowY:
                      "auto",
                  }}
                >
                  {filteredSuppliers.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.id ||
                          index
                        }
                        onMouseDown={(
                          e
                        ) => {
                          e.preventDefault();

                          selectSavedSupplier(
                            item
                          );
                        }}
                        style={{
                          padding:
                            "12px",
                          cursor:
                            "pointer",
                          background:
                            index ===
                            supplierSearchIndex
                              ? "#e3f2fd"
                              : "white",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        <strong>
                          🏭{" "}
                          {
                            item.name
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
                          📱{" "}
                          {item.mobile ||
                            item.whatsapp ||
                            "Mobile नहीं है"}
                        </div>
                      </div>
                    )
                  )}

                  <div
                    style={{
                      padding:
                        "8px",
                      fontSize:
                        "11px",
                      color:
                        "#777",
                      background:
                        "#fafafa",
                    }}
                  >
                    ↑ ↓ Supplier चुनें
                    &nbsp; | &nbsp;
                    Enter Select
                    &nbsp; | &nbsp;
                    Esc Close
                  </div>
                </div>
              )}
          </div>

          {/* MOBILE */}

          <div>
            <label style={labelStyle}>
              Supplier Mobile / WhatsApp
            </label>

            <input
              value={supplierMobile}
              onChange={(e) =>
                setSupplierMobile(
                  e.target.value
                )
              }
              placeholder="10 Digit Mobile"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={saveSupplier}
            style={{
              background:
                "#6a1b9a",
              color: "white",
              border: "none",
              padding:
                "10px 15px",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              marginBottom:
                "15px",
            }}
          >
            💾 Save Supplier
          </button>

          {/* BARCODE */}

          <div
            style={{
              marginBottom: "12px",
            }}
          >
            <label style={labelStyle}>
              📷 Barcode
            </label>

            <input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => {
                const value =
                  e.target.value;

                setBarcode(value);

                if (
                  value.trim()
                ) {
                  searchBarcode(
                    value
                  );
                }
              }}
              onKeyDown={
                handleBarcodeKeyDown
              }
              placeholder="Barcode Scan / Enter करें"
              autoComplete="off"
              style={{
                ...inputStyle,
                border:
                  "2px solid #1565c0",
                background:
                  "#f5faff",
              }}
            />

            <div
              style={{
                fontSize:
                  "11px",
                color:
                  "#1565c0",
                marginTop:
                  "-8px",
                marginBottom:
                  "12px",
              }}
            >
              Barcode scan करते ही Stock से
              Medicine + Company + Supplier
              auto आएगा।
            </div>
          </div>

          {/* MEDICINE */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>
                Medicine
              </label>

              <input
                ref={medicineRef}
                value={medicine}
                onChange={(e) =>
                  handleMedicineChange(
                    e.target.value
                  )
                }
                placeholder="Medicine Name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
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
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                placeholder="Qty"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Unit
              </label>

              <input
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value
                  )
                }
                placeholder="PCS"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "10px",
              padding: "12px",
              background:
                "#fff8e1",
              border:
                "1px solid #ffcc80",
              borderRadius:
                "8px",
              color:
                "#795548",
              fontWeight:
                "bold",
            }}
          >
            ℹ️ Order बनाते समय Previous Purchase
            Rate और GST नहीं लिया जाएगा।
            माल आने पर "📦 माल आ गया" में
            Previous Rate अपने आप आएगा और
            GST वहीं चुना जाएगा।
          </div>

          <button
            type="button"
            onClick={addOrderItem}
            style={{
              width: "100%",
              padding: "13px",
              background:
                "#1565c0",
              color: "white",
              border: "none",
              borderRadius:
                "8px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              fontSize:
                "16px",
              marginTop:
                "12px",
            }}
          >
            ➕ Add To Current Order
          </button>
        </div>

        {/* CURRENT ORDER */}

        <div style={cardStyle}>
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "10px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  marginBottom:
                    "4px",
                }}
              >
                🧾 Current Order
              </h2>

              {orderItems.length >
                0 && (
                <div
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#2e7d32",
                    fontWeight:
                      "bold",
                  }}
                >
                  💾 Order Auto Saved
                </div>
              )}
            </div>

            {orderItems.length >
              0 && (
              <button
                type="button"
                onClick={
                  clearOrder
                }
                style={{
                  background:
                    "#d32f2f",
                  color:
                    "white",
                  border:
                    "none",
                  padding:
                    "9px 14px",
                  borderRadius:
                    "7px",
                  cursor:
                    "pointer",
                  fontWeight:
                    "bold",
                }}
              >
                🗑️ Clear
              </button>
            )}
          </div>

          {orderItems.length ===
          0 ? (
            <div
              style={{
                padding:
                  "30px 10px",
                textAlign:
                  "center",
                color:
                  "#777",
              }}
            >
              📦 अभी Order List खाली है
            </div>
          ) : (
            groupedOrders.map(
              (
                group,
                groupIndex
              ) => (
                <div
                  key={
                    group.supplier +
                    groupIndex
                  }
                  style={{
                    border:
                      "1px solid #e0e0e0",
                    borderRadius:
                      "10px",
                    marginTop:
                      "15px",
                    overflow:
                      "hidden",
                  }}
                >
                  <div
                    style={{
                      background:
                        "#f5f7fa",
                      padding:
                        "13px",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap:
                        "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        🏭{" "}
                        {
                          group.supplier
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
                        📱{" "}
                        {group.mobile ||
                          "Number not saved"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        shareWhatsApp(
                          group
                        )
                      }
                      style={{
                        background:
                          "#25D366",
                        color:
                          "white",
                        border:
                          "none",
                        padding:
                          "10px 14px",
                        borderRadius:
                          "8px",
                        cursor:
                          "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      💬 WhatsApp Order
                    </button>
                  </div>

                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >
                    <table
                      style={{
                        width:
                          "100%",
                        borderCollapse:
                          "collapse",
                        minWidth:
                          "700px",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={
                              thStyle
                            }
                          >
                            #
                          </th>
                          <th
                            style={
                              thStyle
                            }
                          >
                            Item
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
                            Company
                          </th>
                          <th
                            style={
                              thStyle
                            }
                          >
                            Barcode
                          </th>
                          <th
                            style={
                              thStyle
                            }
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {group.items.map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <td
                                style={
                                  tdStyle
                                }
                              >
                                {index +
                                  1}
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                <strong>
                                  {
                                    item.medicine
                                  }
                                </strong>

                                {item.newMedicine && (
                                  <div
                                    style={{
                                      color:
                                        "#2e7d32",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    🆕 New Medicine
                                  </div>
                                )}
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                <strong>
                                  {
                                    item.quantity
                                  }
                                </strong>{" "}
                                {
                                  item.unit ||
                                  "PCS"
                                }
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                {
                                  item.company ||
                                  "-"
                                }
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                {
                                  item.barcode ||
                                  "-"
                                }
                              </td>

                              <td
                                style={
                                  tdStyle
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeOrderItem(
                                      item.id
                                    )
                                  }
                                  style={{
                                    background:
                                      "#ffebee",
                                    color:
                                      "#d32f2f",
                                    border:
                                      "none",
                                    padding:
                                      "7px 10px",
                                    borderRadius:
                                      "6px",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* PENDING ORDERS */}

        <div style={cardStyle}>
          <h2>
            📥 Pending Orders / माल आया?
          </h2>

          {pendingOrders.length ===
          0 ? (
            <div
              style={{
                padding:
                  "20px",
                textAlign:
                  "center",
                color:
                  "#777",
              }}
            >
              📦 कोई Pending Order नहीं है
            </div>
          ) : (
            pendingOrders.map(
              (order) => (
                <div
                  key={
                    order.id
                  }
                  style={{
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "10px",
                    padding:
                      "15px",
                    marginBottom:
                      "12px",
                    background:
                      "#fffde7",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap:
                        "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        🏭{" "}
                        {
                          order.supplier
                        }
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          fontSize:
                            "13px",
                          color:
                            "#666",
                        }}
                      >
                        📦{" "}
                        {
                          order.items
                            ?.length ||
                          0
                        }{" "}
                        Medicines
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#777",
                          marginTop:
                            "3px",
                        }}
                      >
                        📅{" "}
                        {order.date
                          ? new Date(
                              order.date
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          "8px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedHistoryOrder(
                            order
                          )
                        }
                        style={
                          blueButtonStyle
                        }
                      >
                        👁️ View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openReceiveOrder(
                            order
                          )
                        }
                        style={
                          greenButtonStyle
                        }
                      >
                        📦 माल आ गया
                      </button><button
  type="button"
  onClick={() =>
    cancelPendingOrder(
      order
    )
  }
  style={{
    background: "#d32f2f",
    color: "white",
    border: "none",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  ❌ Cancel Order
</button>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* VIEW ORDER MODAL */}

        {selectedHistoryOrder && (
          <div
            style={
              modalOverlayStyle
            }
          >
            <div
              style={
                modalStyle
              }
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >
                <div>
                  <h2>
                    👁️ Order Details
                  </h2>

                  <strong>
                    🏭{" "}
                    {
                      selectedHistoryOrder.supplier
                    }
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={
                    closeHistoryOrder
                  }
                  style={
                    redButtonStyle
                  }
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  overflowX:
                    "auto",
                  marginTop:
                    "15px",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "750px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        #
                      </th>
                      <th style={thStyle}>
                        Item
                      </th>
                      <th style={thStyle}>
                        Qty
                      </th>
                      <th style={thStyle}>
                        Company
                      </th>
                      <th style={thStyle}>
                        Barcode
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(
                      selectedHistoryOrder.items ||
                      []
                    ).map(
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
                            style={
                              tdStyle
                            }
                          >
                            {index +
                              1}
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              item.medicine
                            }
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              item.quantity
                            }{" "}
                            {
                              item.unit ||
                              "PCS"
                            }
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              item.company ||
                              "-"
                            }
                          </td>

                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              item.barcode ||
                              "-"
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
  {/* =====================================================
      PREVIOUS PURCHASE RATE HISTORY MODAL
  ===================================================== */}

  {showPreviousRateHistory && (
  <div
    style={{
      ...modalOverlayStyle,
      zIndex: 20000,
    }}
      onClick={() =>
        setShowPreviousRateHistory(false)
      }
    >
      <div
        style={{
          ...modalStyle,
          maxWidth: "800px",
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              📊 Previous Purchase Rates
            </h2>

            <div
              style={{
                marginTop: "5px",
                color: "#555",
                fontWeight: "bold",
              }}
            >
              💊 {previousRateMedicine}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowPreviousRateHistory(false)
            }
            style={redButtonStyle}
          >
            ✕
          </button>
        </div>

        {previousRateHistory.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#777",
            }}
          >
            इस Medicine की Previous Purchase
            History नहीं मिली।
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              

             <tbody>
  {previousRateHistory.map(
    (historyItem, index) => (
      <tr
        key={
          historyItem.id ||
          index
        }
      >
        <td style={tdStyle}>
          {historyItem.purchaseDate
            ? new Date(
                historyItem.purchaseDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "-"}
        </td>

        <td
          style={{
            ...tdStyle,
            fontWeight: "bold",
            color: "#e65100",
          }}
        >
          ₹
          {toNumber(
            historyItem.purchaseRate ??
              historyItem.purchase_rate ??
              0
          ).toFixed(2)}
        </td>

        <td
          style={{
            ...tdStyle,
            fontWeight: "bold",
          }}
        >
          🏭{" "}
          {historyItem.supplier ||
            "-"}
        </td>
      </tr>
    )
  )}
</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}
        {/* RECEIVE MODAL */}

        {receiveOrder && (
          <div
            style={
              modalOverlayStyle
            }
          >
            <div
              style={{
                ...modalStyle,
                maxWidth:
                  "1800px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                }}
              >
                <div>
                  <h2>
                    📦 माल Receive करें
                  </h2>

                  <div>
                    🏭 Supplier:{" "}
                    <strong>
                      {
                        receiveOrder.supplier
                      }
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiveOrder(
                      null
                    );

                    setReceiveItems(
                      []
                    );
                  }}
                  style={
                    redButtonStyle
                  }
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "12px",
                  background:
                    "#e3f2fd",
                  borderRadius:
                    "8px",
                  color:
                    "#1565c0",
                }}
              >
                ℹ️ Previous Purchase Rate अपने
                आप पिछले Purchase History से आएगा।
                GST और नया Purchase Rate यहीं
                माल Receive करते समय भरें।
              </div>

              <div
                style={{
                  overflowX:
                    "auto",
                  marginTop:
                    "15px",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "1800px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        Medicine
                      </th>

                      <th style={thStyle}>
                        Barcode
                      </th>

                      <th style={thStyle}>
                        Ordered
                      </th>

                      <th style={thStyle}>
                        Previous Purchase Rate
                      </th>

                      <th style={thStyle}>
                        GST
                      </th>

                      <th style={thStyle}>
                        Rate After GST
                      </th>

                      <th style={thStyle}>
                        Received Qty
                      </th>

                      <th style={thStyle}>
                        Unit
                      </th>

                      <th style={thStyle}>
                        Batch
                      </th>

                      <th style={thStyle}>
                        Expiry
                      </th>

                      <th style={thStyle}>
                        New Purchase Rate
                      </th>

                      <th style={thStyle}>
                        Sale Rate
                      </th>

                      <th style={thStyle}>
                        MRP
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {receiveItems.map(
                      (
                        item,
                        index
                      ) => {
                        const oldRate =
                          toNumber(
                            item.previousRate ??
                              item.previousPurchaseRate ??
                              0
                          );
  const previousSupplier =
    item.previousSupplier || "";
                        const itemGst =
                          toNumber(
                            item.gst
                          );

                        const gstRate =
                          calculateGstRate(
                            oldRate,
                            itemGst
                          );

                        return (
                          <tr
                            key={
                              item.id ||
                              index
                            }
                          >
                            <td
                              style={
                                tdStyle
                              }
                            >
                              <strong>
                                {
                                  item.medicine
                                }
                              </strong>

                              <div
                                style={{
                                  fontSize:
                                    "11px",
                                  color:
                                    "#777",
                                }}
                              >
                                {
                                  item.company ||
                                  "-"
                                }
                              </div>
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                value={
                                  item.barcode ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "barcode",
                                    e.target.value
                                  )
                                }
                                placeholder="Barcode"
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {
                                item.quantity
                              }
                            </td>

                          <td
    style={{
      ...tdStyle,
      background: "#fff8e1",
    }}
  >
    <button
      type="button"
      onClick={() => {
        if (oldRate > 0) {
          openPreviousRateHistory(item);
        }
      }}
      disabled={oldRate <= 0}
      style={{
        border: "none",
        background: "transparent",
        padding: "4px",
        margin: 0,
        cursor:
          oldRate > 0
            ? "pointer"
            : "not-allowed",
        textAlign: "left",
        width: "100%",
      }}
      title={
        oldRate > 0
          ? "पुराने सभी Purchase Rates देखने के लिए Click करें"
          : "Previous Rate उपलब्ध नहीं है"
      }
    >
      <strong
        style={{
          color:
            oldRate > 0
              ? "#e65100"
              : "#d32f2f",
          fontSize: "16px",
          textDecoration:
            oldRate > 0
              ? "underline"
              : "none",
        }}
      >
        ₹{oldRate.toFixed(2)}
      </strong>

      {oldRate > 0 && (
        <>
          <div
            style={{
              fontSize: "10px",
              color: "#555",
              marginTop: "3px",
            }}
          >
            Supplier:{" "}
            {item.previousSupplier ||
              "-"}
          </div>

          <div
            style={{
              fontSize: "9px",
              color: "#1565c0",
              marginTop: "3px",
              fontWeight: "bold",
            }}
          >
            👆 Click — Previous Rates
          </div>
        </>
      )}

      {oldRate <= 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#d32f2f",
            marginTop: "4px",
          }}
        >
          Previous rate नहीं मिला
        </div>
      )}
    </button>
  </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <select
                                value={
                                  itemGst
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "gst",
                                    Number(
                                      e.target
                                        .value
                                    )
                                  )
                                }
                                style={{
                                  ...smallInputStyle,
                                  minWidth:
                                    "120px",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                {GST_OPTIONS.map(
                                  (
                                    option
                                  ) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td
                              style={{
                                ...tdStyle,
                                background:
                                  "#f3e5f5",
                              }}
                            >
                              <strong>
                                ₹
                                {gstRate.toFixed(
                                  2
                                )}
                              </strong>
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                value={
                                  item.receivedQty
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "receivedQty",
                                    e.target.value
                                  )
                                }
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                value={
                                  item.unit
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                value={
                                  item.batch
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "batch",
                                    e.target.value
                                  )
                                }
                                placeholder="Batch"
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                type="date"
                                value={
                                  item.expiry
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "expiry",
                                    e.target.value
                                  )
                                }
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.purchaseRate
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "purchaseRate",
                                    e.target.value
                                  )
                                }
                                placeholder="New Purchase"
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.saleRate
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "saleRate",
                                    e.target.value
                                  )
                                }
                                placeholder="Sale"
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.mrp
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateReceiveItem(
                                    index,
                                    "mrp",
                                    e.target.value
                                  )
                                }
                                placeholder="MRP"
                                style={
                                  smallInputStyle
                                }
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "10px",
                  marginTop:
                    "20px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    confirmReceiveOrder
                  }
                  style={{
                    flex: 1,
                    minWidth:
                      "220px",
                    padding:
                      "14px",
                    background:
                      "#2e7d32",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius:
                      "8px",
                    cursor:
                      "pointer",
                    fontSize:
                      "16px",
                    fontWeight:
                      "bold",
                  }}
                >
                  ✅ Confirm — माल आ गया
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiveOrder(
                      null
                    );

                    setReceiveItems(
                      []
                    );
                  }}
                  style={{
                    flex: 1,
                    minWidth:
                      "220px",
                    padding:
                      "14px",
                    background:
                      "#757575",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius:
                      "8px",
                    cursor:
                      "pointer",
                    fontSize:
                      "16px",
                    fontWeight:
                      "bold",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BACK */}

        <button
          type="button"
          onClick={goBack}
          style={{
            width: "100%",
            padding: "13px",
            background:
              "#555",
            color: "white",
            border: "none",
            borderRadius:
              "8px",
            fontSize:
              "16px",
            cursor:
              "pointer",
            fontWeight:
              "bold",
          }}
        >
          ⬅️ Back To Dashboard
        </button>
      </div>
    );
  }

  // =====================================================
  // STYLES
  // =====================================================

  const cardStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "18px",
    boxShadow:
      "0 3px 12px rgba(0,0,0,0.07)",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#333",
  };

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

  const smallInputStyle = {
    width: "100%",
    minWidth: "100px",
    boxSizing: "border-box",
    padding: "9px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "white",
  };

  const thStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    background: "#f5f5f5",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    verticalAlign: "middle",
  };

  const blueButtonStyle = {
    background: "#1565c0",
    color: "white",
    border: "none",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const greenButtonStyle = {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const redButtonStyle = {
    background: "#d32f2f",
    color: "white",
    border: "none",
    padding: "9px 13px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  };

  const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(0,0,0,0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "15px",
  boxSizing: "border-box",
};

  const modalStyle = {
    background: "white",
    width: "100%",
    maxWidth: "1200px",
    maxHeight: "95vh",
    overflowY: "auto",
    borderRadius: "12px",
    padding: "20px",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 40px rgba(0,0,0,0.3)",
  };

  export default OrderList;