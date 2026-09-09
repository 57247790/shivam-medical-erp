import React, { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";

function BillScanner({ goBack, setPage }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // =====================================================
  // HELPERS
  // =====================================================

  const makeId = () =>
    `scan-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const cleanNumber = (value) => {
    if (value === undefined || value === null) {
      return "";
    }

    let v = String(value)
      .trim()
      .replace(/,/g, ".")
      .replace(/[Oo]/g, "0")
      .replace(/[IiLl]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8")
      .replace(/[^0-9.]/g, "");

    const dots = (v.match(/\./g) || []).length;

    if (dots > 1) {
      const parts = v.split(".");
      v = `${parts.shift()}.${parts.join("")}`;
    }

    return v;
  };

  const cleanMobile = (value) => {
    if (!value) return "";

    const digits = String(value).replace(/\D/g, "");

    if (digits.length >= 10) {
      return digits.slice(-10);
    }

    return digits;
  };

  const normalizeDate = (value) => {
    if (!value) return "";

    let v = String(value)
      .trim()
      .replace(/[Oo]/g, "0")
      .replace(/[IiLl]/g, "1")
      .replace(/[|]/g, "/")
      .replace(/-/g, "/")
      .replace(/\./g, "/");

    let match = v.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
    );

    if (match) {
      let day = match[1].padStart(2, "0");
      let month = match[2].padStart(2, "0");
      let year = match[3];

      if (year.length === 2) {
        year = `20${year}`;
      }

      return `${year}-${month}-${day}`;
    }

    match = v.match(
      /^(\d{1,2})\/(\d{4})$/
    );

    if (match) {
      return `${match[2]}-${match[1].padStart(
        2,
        "0"
      )}-01`;
    }

    return value;
  };

  // =====================================================
  // FIND STOCK ITEM
  // =====================================================

  const findStockItem = (medicineName) => {
    if (!medicineName) return null;

    try {
      const stock = JSON.parse(
        localStorage.getItem("stock") || "[]"
      );

      if (!Array.isArray(stock)) {
        return null;
      }

      const searchName = normalize(medicineName);

      let found = stock.find((item) => {
        const name = normalize(
          item.medicine ||
            item.medicineName ||
            item.name
        );

        return name === searchName;
      });

      if (!found) {
        found = stock.find((item) => {
          const name = normalize(
            item.medicine ||
              item.medicineName ||
              item.name
          );

          return (
            name &&
            searchName &&
            (name.includes(searchName) ||
              searchName.includes(name))
          );
        });
      }

      return found || null;
    } catch (error) {
      console.error(
        "Stock search error:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // FIND COMPANY
  // =====================================================

  const findCompanyFromStock = (medicineName) => {
    const found = findStockItem(medicineName);

    return (
      found?.company ||
      found?.companyName ||
      ""
    );
  };

  // =====================================================
  // FIND SUPPLIER
  // =====================================================

  const findSupplierFromText = (ocrText) => {
    if (!ocrText) return null;

    try {
      const suppliers = JSON.parse(
        localStorage.getItem("suppliers") || "[]"
      );

      if (!Array.isArray(suppliers)) {
        return null;
      }

      const fullText = normalize(ocrText);

      for (const supplier of suppliers) {
        const name = normalize(
          supplier.name ||
            supplier.supplier ||
            supplier.supplierName ||
            ""
        );

        if (
          name.length >= 3 &&
          fullText.includes(name)
        ) {
          return {
            name:
              supplier.name ||
              supplier.supplier ||
              supplier.supplierName ||
              "",

            mobile: cleanMobile(
              supplier.mobile ||
                supplier.supplierMobile ||
                supplier.phone ||
                ""
            ),
          };
        }
      }

      return null;
    } catch (error) {
      console.error(
        "Supplier search error:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // BAD OCR LINES
  // =====================================================

  const isBadLine = (line) => {
    const value = normalize(line);

    if (!value || value.length < 3) {
      return true;
    }

    const badWords = [
      "invoice",
      "invoice no",
      "bill no",
      "bill number",
      "invoice number",
      "date",
      "address",
      "phone",
      "mobile",
      "gstin",
      "gst no",
      "supplier",
      "customer",
      "total",
      "subtotal",
      "grand total",
      "round off",
      "discount",
      "tax",
      "taxable",
      "amount",
      "description",
      "particular",
      "batch",
      "expiry",
      "mrp",
      "rate",
      "qty",
      "quantity",
      "free",
      "scheme",
      "hsn",
      "cash",
      "credit",
      "balance",
      "thank",
      "terms",
      "bank",
      "account",
      "payment",
    ];

    for (const word of badWords) {
      if (value.includes(word)) {
        return true;
      }
    }

    return false;
  };

  // =====================================================
  // MEDICINE NAME
  // =====================================================

  const extractMedicineName = (line) => {
    if (!line) return "";

    let value = String(line)
      .replace(/[|¦]/g, " ")
      .replace(/\t+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Serial number
    value = value.replace(
      /^\s*\d+\s*[.)-]?\s*/,
      ""
    );

    // Starting garbage
    value = value.replace(
      /^[^A-Za-z\u0900-\u097F]+/,
      ""
    );

    /*
      Medicine name आमतौर पर पहले बड़े numeric
      column के पहले आता है।
    */

    const numberMatch = value.match(
      /\s+\d+(?:[.,]\d+)?/
    );

    if (
      numberMatch &&
      numberMatch.index > 2
    ) {
      const before = value
        .substring(0, numberMatch.index)
        .trim();

      if (
        before.length >= 3 &&
        /[A-Za-z\u0900-\u097F]/.test(before)
      ) {
        value = before;
      }
    }

    // Trailing numbers हटाएँ
    value = value.replace(
      /\s+\d+(?:[.,]\d+)?(?:\s+\d+(?:[.,]\d+)?)*\s*$/,
      ""
    );

    value = value
      .replace(
        /[^A-Za-z0-9\u0900-\u097F()\/&+.' -]/g,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

    return value;
  };

  // =====================================================
  // MEDICINE LINE CHECK
  // =====================================================

  const looksLikeMedicine = (line) => {
    if (isBadLine(line)) {
      return false;
    }

    const value = String(line).trim();

    const letters =
      value.match(
        /[A-Za-z\u0900-\u097F]/g
      ) || [];

    if (letters.length < 4) {
      return false;
    }

    const medicine =
      extractMedicineName(value);

    if (!medicine || medicine.length < 3) {
      return false;
    }

    if (
      /^\d+(?:[.,]\d+)?$/.test(
        medicine
      )
    ) {
      return false;
    }

    return true;
  };

  // =====================================================
  // EXTRACT NUMBERS
  // =====================================================

  const getNumbers = (line) => {
    if (!line) return [];

    const matches =
      String(line).match(
        /\d+(?:[.,]\d+)?/g
      ) || [];

    return matches
      .map(cleanNumber)
      .filter(Boolean);
  };

  // =====================================================
  // PURCHASE RATE
  // =====================================================

  const extractPurchaseRate = (line) => {
    const numbers = getNumbers(line);

    if (!numbers.length) {
      return "";
    }

    const values = numbers
      .map((n) => parseFloat(n))
      .filter(
        (n) =>
          Number.isFinite(n) &&
          n > 0 &&
          n <= 100000
      );

    if (!values.length) {
      return "";
    }

    /*
      Decimal number को purchase rate की
      priority दी जाएगी।
    */

    for (
      let i = values.length - 1;
      i >= 0;
      i--
    ) {
      const value = values[i];

      if (
        value > 0 &&
        value < 10000 &&
        String(value).includes(".")
      ) {
        return String(value);
      }
    }

    return String(
      values[values.length - 1]
    );
  };

  // =====================================================
  // EXTRACT EXPIRY
  // =====================================================

  const extractExpiry = (line) => {
    if (!line) return "";

    const value = String(line);

    const patterns = [
      /\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/,
      /\b(\d{1,2}[\/.-]\d{4})\b/,
      /\b(EXP|EXPIRY|EXP\.?)\s*[:\-]?\s*(\d{1,2}[\/.-]\d{2,4})\b/i,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match) {
        return normalizeDate(
          match[2] || match[1]
        );
      }
    }

    return "";
  };

  // =====================================================
  // EXTRACT BATCH
  // =====================================================

  const extractBatch = (line) => {
    if (!line) return "";

    const value = String(line);

    const patterns = [
      /\b(?:BATCH|B\.?NO|BATCH\s*NO)\s*[:\-]?\s*([A-Z0-9\/-]{3,20})/i,
      /\b([A-Z]{1,4}\d{2,}[A-Z0-9\/-]*)\b/i,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match) {
        return match[1];
      }
    }

    return "";
  };

  // =====================================================
  // EXTRACT BARCODE
  // =====================================================

  const extractBarcode = (line) => {
    if (!line) return "";

    const value = String(line);

    const labeled = value.match(
      /(?:BARCODE|BAR\s*CODE|EAN|UPC)\s*[:\-]?\s*(\d{8,14})/i
    );

    if (labeled) {
      return labeled[1];
    }

    const numbers =
      value.match(/\b\d{8,14}\b/g) || [];

    if (numbers.length) {
      return numbers[0];
    }

    return "";
  };

  // =====================================================
  // EXTRACT GST
  // =====================================================

  const extractGST = (line) => {
    if (!line) return "";

    const value = String(line);

    const match = value.match(
      /(?:GST|CGST|SGST|IGST)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?/i
    );

    if (match) {
      return match[1];
    }

    const percent =
      value.match(
        /\b(0|3|5|12|18|28)\s*%\b/
      );

    if (percent) {
      return percent[1];
    }

    return "";
  };

  // =====================================================
  // EXTRACT QUANTITY
  // =====================================================

  const extractQuantity = (line) => {
    if (!line) return "";

    const value = String(line);

    const labeled = value.match(
      /(?:QTY|QUANTITY|PCS|STRIP)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i
    );

    if (labeled) {
      return cleanNumber(labeled[1]);
    }

    const numbers = getNumbers(line);

    if (!numbers.length) {
      return "";
    }

    /*
      बहुत छोटी integer value को Qty माना जा सकता है।
    */

    for (const number of numbers) {
      const n = parseFloat(number);

      if (
        Number.isFinite(n) &&
        n > 0 &&
        n <= 1000 &&
        Number.isInteger(n)
      ) {
        return String(n);
      }
    }

    return "";
  };

  // =====================================================
  // EXTRACT MRP
  // =====================================================

  const extractMRP = (line) => {
    if (!line) return "";

    const value = String(line);

    const labeled = value.match(
      /(?:MRP|M\.R\.P)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i
    );

    if (labeled) {
      return cleanNumber(
        labeled[1]
      );
    }

    return "";
  };

  // =====================================================
  // EXTRACT SALE RATE
  // =====================================================

  const extractSaleRate = (line) => {
    if (!line) return "";

    const value = String(line);

    const labeled = value.match(
      /(?:SALE|SELL|S\.?R\.?|SELLING\s*RATE|SALE\s*RATE)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i
    );

    if (labeled) {
      return cleanNumber(
        labeled[1]
      );
    }

    return "";
  };

  // =====================================================
  // BUILD COMPLETE ITEM
  // =====================================================

  const buildItemFromLine = (
    line,
    supplier
  ) => {
    const medicineName =
      extractMedicineName(line);

    if (!medicineName) {
      return null;
    }

    const stockItem =
      findStockItem(medicineName);

    const purchaseRate =
      extractPurchaseRate(line);

    const quantity =
      extractQuantity(line);

    const batch =
      extractBatch(line) ||
      stockItem?.batch ||
      stockItem?.batchNo ||
      "";

    const barcode =
      extractBarcode(line) ||
      stockItem?.barcode ||
      stockItem?.barCode ||
      "";

    const mrp =
      extractMRP(line) ||
      stockItem?.mrp ||
      "";

    const saleRate =
      extractSaleRate(line) ||
      stockItem?.saleRate ||
      stockItem?.sellingRate ||
      mrp ||
      "";

    const expiry =
      extractExpiry(line) ||
      stockItem?.expiry ||
      stockItem?.expiryDate ||
      "";

    const gst =
      extractGST(line) ||
      stockItem?.gstPercent ||
      stockItem?.gst ||
      "";

    return {
      id: makeId(),

      medicineName,
      medicine: medicineName,

      company:
        stockItem?.company ||
        stockItem?.companyName ||
        findCompanyFromStock(
          medicineName
        ) ||
        "",

      supplier:
        supplier?.name || "",

      supplierName:
        supplier?.name || "",

      supplierMobile:
        supplier?.mobile || "",

      quantity,
      qty: quantity,

      unit: "STRIP",

      batch,
      batchNo: batch,

      barcode,
      barCode: barcode,

      purchaseRate:
        purchaseRate || "",

      rate:
        purchaseRate || "",

      basePurchaseRate:
        purchaseRate || "",

      mrp: mrp || "",

      saleRate:
        saleRate || "",

      expiry:
        expiry || "",

      gst:
        gst || "",

      gstPercent:
        gst || "",

      gstType:
        gst
          ? `+${gst}`
          : "",

      amount: "",

      rawLine: line,

      source: "billScanner",

      scannedAt:
        new Date().toISOString(),
    };
  };

  // =====================================================
  // EXTRACT MEDICINE ITEMS
  // =====================================================

  const extractMedicineItems = (
    ocrText
  ) => {
    if (!ocrText) {
      return [];
    }

    const lines = ocrText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const supplier =
      findSupplierFromText(
        ocrText
      );

    const result = [];
    const seen = new Set();

    lines.forEach((line) => {
      if (!looksLikeMedicine(line)) {
        return;
      }

      const medicineName =
        extractMedicineName(line);

      if (!medicineName) {
        return;
      }

      const key =
        normalize(medicineName);

      if (key.length < 3) {
        return;
      }

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      const item =
        buildItemFromLine(
          line,
          supplier
        );

      if (item) {
        result.push(item);
      }
    });

    return result;
  };

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFile = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");
    setText("");
    setItems([]);
    setProgress(0);

    const fileName =
      selectedFile.name.toLowerCase();

    const allowed =
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png");

    if (!allowed) {
      setFile(null);
      setPreview("");

      setError(
        "⚠️ केवल JPG / JPEG / PNG Bill की फोटो चुनें।"
      );

      event.target.value = "";

      return;
    }

    setFile(selectedFile);

    const imageUrl =
      URL.createObjectURL(
        selectedFile
      );

    setPreview(imageUrl);
  };

  // =====================================================
  // IMAGE PREPROCESS
  // =====================================================

  const preprocessImage = (
    imageFile
  ) => {
    return new Promise(
      (resolve, reject) => {
        const img = new Image();

        const objectUrl =
          URL.createObjectURL(
            imageFile
          );

        img.onload = () => {
          try {
            const originalWidth =
              img.naturalWidth ||
              img.width;

            const originalHeight =
              img.naturalHeight ||
              img.height;

            const targetWidth =
              Math.min(
                Math.max(
                  originalWidth,
                  2200
                ),
                4000
              );

            const scale =
              targetWidth /
              originalWidth;

            const width =
              Math.round(
                originalWidth * scale
              );

            const height =
              Math.round(
                originalHeight * scale
              );

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width = width;
            canvas.height = height;

            const ctx =
              canvas.getContext(
                "2d",
                {
                  willReadFrequently: true,
                }
              );

            if (!ctx) {
              URL.revokeObjectURL(
                objectUrl
              );

              reject(
                new Error(
                  "Canvas उपलब्ध नहीं है"
                )
              );

              return;
            }

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(
              0,
              0,
              width,
              height
            );

            ctx.drawImage(
              img,
              0,
              0,
              width,
              height
            );

            const imageData =
              ctx.getImageData(
                0,
                0,
                width,
                height
              );

            const data =
              imageData.data;

            for (
              let i = 0;
              i < data.length;
              i += 4
            ) {
              const r = data[i];
              const g =
                data[i + 1];
              const b =
                data[i + 2];

              let gray =
                0.299 * r +
                0.587 * g +
                0.114 * b;

              gray =
                (gray - 128) *
                  1.45 +
                128;

              gray =
                Math.max(
                  0,
                  Math.min(
                    255,
                    gray
                  )
                );

              data[i] = gray;
              data[i + 1] =
                gray;
              data[i + 2] =
                gray;
            }

            ctx.putImageData(
              imageData,
              0,
              0
            );

            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(
                  objectUrl
                );

                if (!blob) {
                  reject(
                    new Error(
                      "Image processing failed"
                    )
                  );

                  return;
                }

                resolve(blob);
              },
              "image/png",
              1
            );
          } catch (err) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(err);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "Bill image load नहीं हुई"
            )
          );
        };

        img.src = objectUrl;
      }
    );
  };

  // =====================================================
  // OCR CLEAN
  // =====================================================

  const cleanOCRText = (
    rawText
  ) => {
    if (!rawText) {
      return "";
    }

    return rawText
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ ]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // =====================================================
  // OCR
  // =====================================================

  const runOCR = async (
    worker,
    image,
    psm,
    passNumber
  ) => {
    console.log(
      `🔍 OCR Pass ${passNumber} शुरू...`
    );

    await worker.setParameters({
      tessedit_pageseg_mode:
        String(psm),

      preserve_interword_spaces:
        "1",
    });

    const result =
      await worker.recognize(
        image
      );

    const value =
      result?.data?.text || "";

    console.log(
      `📄 OCR PASS ${passNumber}:`,
      value
    );

    return value;
  };

  // =====================================================
  // SAVE DATA
  // =====================================================

  const saveScannerData = (
    cleanedText,
    extractedItems
  ) => {
    const now =
      new Date().toISOString();

    localStorage.setItem(
      "billScannerOCRText",
      cleanedText
    );

    localStorage.setItem(
      "billScannerItems",
      JSON.stringify(
        extractedItems
      )
    );

    localStorage.setItem(
      "billScannerPurchaseItems",
      JSON.stringify(
        extractedItems
      )
    );

    localStorage.setItem(
      "billScannerPurchaseReady",
      "true"
    );

    localStorage.setItem(
      "billScannerLoadedIntoPurchase",
      "false"
    );

    localStorage.setItem(
      "billScannerUpdatedAt",
      now
    );

    localStorage.setItem(
      "billScannerDataVersion",
      "4"
    );

    console.log(
      "================================"
    );

    console.log(
      "✅ BILL SCANNER DATA SAVED"
    );

    console.log(
      "💊 PURCHASE DATA:",
      extractedItems
    );

    console.log(
      "================================"
    );
  };

  // =====================================================
  // SCAN BILL
  // =====================================================

  const scanBill = async () => {
    if (!file) {
      alert(
        "⚠️ पहले Bill की फोटो चुनें।"
      );

      return;
    }

    setScanning(true);
    setError("");
    setText("");
    setItems([]);
    setProgress(0);

    let worker = null;

    try {
      console.log(
        "📄 Bill OCR शुरू..."
      );

      const processedImage =
        await preprocessImage(
          file
        );

      console.log(
        "✅ Enhanced image तैयार"
      );

      worker =
        await createWorker(
          "eng",
          1,
          {
            workerPath:
              "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",

            langPath:
              "https://tessdata.projectnaptha.com/4.0.0",

            corePath:
              "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js",

            workerBlobURL: true,

            logger: (message) => {
              console.log(
                "Tesseract:",
                message
              );

              if (
                message.status ===
                  "recognizing text" &&
                typeof message.progress ===
                  "number"
              ) {
                setProgress(
                  Math.round(
                    message.progress *
                      100
                  )
                );
              }
            },
          }
        );

      console.log(
        "✅ Tesseract Worker तैयार"
      );

      // =================================================
      // 3 OCR PASSES
      // =================================================

      const pass1 =
        await runOCR(
          worker,
          processedImage,
          6,
          1
        );

      const pass2 =
        await runOCR(
          worker,
          processedImage,
          4,
          2
        );

      const pass3 =
        await runOCR(
          worker,
          processedImage,
          11,
          3
        );

      const candidates = [
        pass1,
        pass2,
        pass3,
      ];

      let best = "";

      let bestCount = -1;

      candidates.forEach(
        (candidate) => {
          const count =
            extractMedicineItems(
              candidate
            ).length;

          if (count > bestCount) {
            bestCount = count;
            best = candidate;
          }
        }
      );

      const cleaned =
        cleanOCRText(best);

      console.log(
        "📄 FINAL OCR TEXT:",
        cleaned
      );

      const extractedItems =
        extractMedicineItems(
          cleaned
        );

      console.log(
        "💊 FINAL ITEMS:",
        extractedItems
      );

      setProgress(100);

      setText(cleaned);

      setItems(
        extractedItems
      );

      saveScannerData(
        cleaned,
        extractedItems
      );

      if (!cleaned) {
        setError(
          "⚠️ Bill का text नहीं पढ़ पाया।"
        );
      } else if (
        extractedItems.length === 0
      ) {
        setError(
          "⚠️ Medicine नहीं मिली। Bill की साफ फोटो लें।"
        );
      }
    } catch (err) {
      console.error(
        "❌ Bill OCR Error:",
        err
      );

      setError(
        "⚠️ Bill scan नहीं हो पाया। Internet connection और Bill photo check करें।"
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (err) {
          console.error(
            "Worker terminate error:",
            err
          );
        }
      }

      setScanning(false);
    }
  };

  // =====================================================
  // SEND TO PURCHASE
  // =====================================================

  const sendToPurchase = () => {
    if (!items.length) {
      alert(
        "⚠️ पहले Bill Scan करें।"
      );

      return;
    }

    const now =
      new Date().toISOString();

    const purchaseItems =
      items.map((item) => ({
        id:
          item.id ||
          makeId(),

        medicine:
          item.medicineName ||
          item.medicine ||
          "",

        medicineName:
          item.medicineName ||
          item.medicine ||
          "",

        company:
          item.company ||
          "",

        supplier:
          item.supplier ||
          item.supplierName ||
          "",

        supplierName:
          item.supplier ||
          item.supplierName ||
          "",

        supplierMobile:
          item.supplierMobile ||
          item.mobile ||
          "",

        quantity:
          item.quantity ??
          item.qty ??
          "",

        qty:
          item.qty ??
          item.quantity ??
          "",

        unit:
          item.unit ||
          "STRIP",

        batch:
          item.batch ||
          item.batchNo ||
          "",

        batchNo:
          item.batchNo ||
          item.batch ||
          "",

        barcode:
          item.barcode ||
          item.barCode ||
          "",

        barCode:
          item.barCode ||
          item.barcode ||
          "",

        purchaseRate:
          item.purchaseRate ||
          item.rate ||
          item.basePurchaseRate ||
          "",

        rate:
          item.rate ||
          item.purchaseRate ||
          "",

        basePurchaseRate:
          item.basePurchaseRate ||
          item.purchaseRate ||
          item.rate ||
          "",

        mrp:
          item.mrp ||
          "",

        saleRate:
          item.saleRate ||
          item.mrp ||
          "",

        expiry:
          item.expiry ||
          item.expiryDate ||
          "",

        gst:
          item.gst ||
          item.gstPercent ||
          "",

        gstPercent:
          item.gstPercent ||
          item.gst ||
          "",

        gstType:
          item.gstType ||
          "",

        amount:
          item.amount ||
          "",

        rawLine:
          item.rawLine ||
          "",

        source:
          "billScanner",

        scannedAt:
          item.scannedAt ||
          now,
      }));

    // ===================================================
    // SAVE
    // ===================================================

    localStorage.setItem(
      "billScannerItems",
      JSON.stringify(
        purchaseItems
      )
    );

    localStorage.setItem(
      "billScannerPurchaseItems",
      JSON.stringify(
        purchaseItems
      )
    );

    localStorage.setItem(
      "billScannerPurchaseReady",
      "true"
    );

    localStorage.setItem(
      "billScannerLoadedIntoPurchase",
      "false"
    );

    localStorage.setItem(
      "billScannerSentAt",
      now
    );

    localStorage.setItem(
      "billScannerUpdatedAt",
      now
    );

    // ===================================================
    // EVENT
    // ===================================================

    window.dispatchEvent(
      new CustomEvent(
        "billScannerPurchaseReady",
        {
          detail: {
            items:
              purchaseItems,

            text,

            scannedAt: now,
          },
        }
      )
    );

    window.dispatchEvent(
      new Event(
        "billScannerUpdated"
      )
    );

    console.log(
      "================================"
    );

    console.log(
      "✅ SCAN → PURCHASE"
    );

    console.table(
      purchaseItems
    );

    console.log(
      "================================"
    );

    // ===================================================
    // OPEN PURCHASE
    // ===================================================

    if (setPage) {
      setPage("purchase");
    }
  };

  // =====================================================
  // CLEAR
  // =====================================================

  const clearBill = () => {
    setFile(null);
    setPreview("");
    setText("");
    setItems([]);
    setError("");
    setProgress(0);

    localStorage.removeItem(
      "billScannerOCRText"
    );

    localStorage.removeItem(
      "billScannerItems"
    );

    localStorage.removeItem(
      "billScannerPurchaseItems"
    );

    localStorage.removeItem(
      "billScannerPurchaseReady"
    );

    localStorage.removeItem(
      "billScannerLoadedIntoPurchase"
    );

    localStorage.removeItem(
      "billScannerSentAt"
    );

    localStorage.removeItem(
      "billScannerUpdatedAt"
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* HEADER */}

        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              📄 Bill Scanner
            </h2>

            <div style={subtitleStyle}>
              Medicine, Company, Supplier,
              Mobile, Qty, Batch, Barcode,
              Purchase Rate, MRP, Sale Rate,
              Expiry और GST निकालें
            </div>
          </div>

          <button
            type="button"
            onClick={goBack}
            style={backButtonStyle}
          >
            ⬅️ वापस
          </button>
        </div>

        {/* FILE */}

        <div style={cardStyle}>
          <h3 style={headingStyle}>
            📷 Bill की फोटो चुनें
          </h3>

          <div style={formatBoxStyle}>
            <b>Supported Format:</b>
            <br />
            JPG &nbsp;&nbsp; JPEG &nbsp;&nbsp; PNG
            <br />

            <span style={smallNote}>
              साफ और सीधी Bill photo
              से OCR बेहतर होगा।
            </span>
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFile}
            style={fileInputStyle}
          />

          {file && (
            <div style={fileInfoStyle}>
              <b>Selected Bill:</b>

              <div style={{ marginTop: 5 }}>
                {file.name}
              </div>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  color: "#777",
                }}
              >
                {Math.round(
                  file.size / 1024
                )}{" "}
                KB
              </div>
            </div>
          )}

          {/* PREVIEW */}

          {preview && (
            <div style={previewBoxStyle}>
              <div style={smallHeading}>
                📄 Bill Preview
              </div>

              <img
                src={preview}
                alt="Bill Preview"
                style={previewImageStyle}
              />
            </div>
          )}

          {/* BUTTONS */}

          {file && (
            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={scanBill}
                disabled={scanning}
                style={{
                  ...scanButtonStyle,
                  opacity:
                    scanning ? 0.6 : 1,
                }}
              >
                {scanning
                  ? `🔍 Scanning ${progress}%`
                  : "🔍 Scan Bill"}
              </button>

              <button
                type="button"
                onClick={clearBill}
                disabled={scanning}
                style={clearButtonStyle}
              >
                🗑️ Clear
              </button>
            </div>
          )}

          {/* PROGRESS */}

          {scanning && (
            <div style={progressBoxStyle}>
              <b>
                Bill पढ़ा जा रहा है...
                {" "}
                {progress}%
              </b>

              <div
                style={
                  progressBackground
                }
              >
                <div
                  style={{
                    ...progressBar,
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}
        </div>

        {/* RESULTS */}

        {items.length > 0 && (
          <div style={cardStyle}>
            <h3 style={headingStyle}>
              💊 OCR Result
            </h3>

            <div style={smallInfo}>
              Scanner अब available
              information के अनुसार Medicine,
              Company, Supplier, Mobile, Qty,
              Batch, Barcode, Purchase Rate,
              MRP, Sale Rate, Expiry और GST
              भेजेगा।
            </div>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={tableStyle}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      #
                    </th>

                    <th style={thStyle}>
                      Medicine
                    </th>

                    <th style={thStyle}>
                      Company
                    </th>

                    <th style={thStyle}>
                      Supplier
                    </th>

                    <th style={thStyle}>
                      Mobile
                    </th>

                    <th style={thStyle}>
                      Qty
                    </th>

                    <th style={thStyle}>
                      Batch
                    </th>

                    <th style={thStyle}>
                      Barcode
                    </th>

                    <th style={thStyle}>
                      Purchase Rate
                    </th>

                    <th style={thStyle}>
                      MRP
                    </th>

                    <th style={thStyle}>
                      Sale Rate
                    </th>

                    <th style={thStyle}>
                      Expiry
                    </th>

                    <th style={thStyle}>
                      GST
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (item, index) => (
                      <tr
                        key={
                          item.id ||
                          index
                        }
                      >
                        <td style={tdStyle}>
                          {index + 1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              "bold",
                            minWidth: 180,
                          }}
                        >
                          {item.medicineName ||
                            item.medicine ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.company ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.supplier ||
                            item.supplierName ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.supplierMobile ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.quantity ||
                            item.qty ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.batch ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.barcode ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.purchaseRate ||
                            item.rate ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.mrp ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.saleRate ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.expiry ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.gstPercent ||
                            item.gst ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div style={infoBoxStyle}>
              ℹ️ Existing Stock से matching
              medicine मिलने पर Company, Batch,
              Barcode, MRP, Sale Rate और Expiry
              की missing information भी लेने की
              कोशिश की जाएगी।
            </div>

            <button
              type="button"
              onClick={sendToPurchase}
              style={
                purchaseButtonStyle
              }
            >
              📦 Purchase Entry में भेजें
            </button>
          </div>
        )}

        {/* OCR TEXT */}

        {text && (
          <div style={cardStyle}>
            <h3 style={headingStyle}>
              📝 Scanned Bill Text
            </h3>

            <textarea
              value={text}
              onChange={(e) =>
                setText(
                  e.target.value
                )
              }
              style={textAreaStyle}
              rows={12}
            />
          </div>
        )}

        <div style={footerStyle}>
          Shivam Medical ERP • Bill Scanner
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#eaf0f6,#f7f9fc)",
  padding: 20,
  fontFamily:
    "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const containerStyle = {
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#6a1b9a,#8e24aa)",
  color: "white",
  padding: "18px 20px",
  borderRadius: 14,
  marginBottom: 18,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 15,
  flexWrap: "wrap",
};

const titleStyle = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
};

const subtitleStyle = {
  marginTop: 5,
  fontSize: 12,
  opacity: 0.9,
};

const backButtonStyle = {
  background: "white",
  color: "#6a1b9a",
  border: "none",
  padding: "10px 17px",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const cardStyle = {
  background: "white",
  borderRadius: 14,
  padding: 20,
  marginBottom: 18,
  border:
    "1px solid #e5e7eb",
  boxShadow:
    "0 4px 14px rgba(0,0,0,0.06)",
};

const headingStyle = {
  margin: "0 0 14px",
  color: "#263238",
  fontSize: 18,
};

const formatBoxStyle = {
  padding: 12,
  marginBottom: 12,
  borderRadius: 9,
  background: "#f3e5f5",
  color: "#6a1b9a",
  fontSize: 13,
  lineHeight: 1.6,
};

const smallNote = {
  fontSize: 11,
  color: "#555",
};

const fileInputStyle = {
  width: "100%",
  padding: 12,
  border:
    "1px dashed #b0bec5",
  borderRadius: 9,
  background: "#fafafa",
  boxSizing: "border-box",
};

const fileInfoStyle = {
  marginTop: 15,
  padding: 13,
  borderRadius: 9,
  background: "#f8fafc",
  border:
    "1px solid #e5e7eb",
  color: "#37474f",
  fontSize: 13,
};

const previewBoxStyle = {
  marginTop: 18,
  padding: 14,
  background: "#f8fafc",
  borderRadius: 10,
  border:
    "1px solid #e5e7eb",
};

const previewImageStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: 550,
  margin: "0 auto",
  borderRadius: 8,
  objectFit: "contain",
  background: "#fff",
};

const smallHeading = {
  fontSize: 12,
  color: "#757575",
  marginBottom: 8,
  fontWeight: "bold",
};

const buttonRowStyle = {
  display: "flex",
  gap: 10,
  marginTop: 15,
  flexWrap: "wrap",
};

const scanButtonStyle = {
  background: "#6a1b9a",
  color: "white",
  border: "none",
  padding: "11px 18px",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const clearButtonStyle = {
  background: "#eceff1",
  color: "#37474f",
  border: "none",
  padding: "11px 18px",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const progressBoxStyle = {
  marginTop: 18,
};

const progressBackground = {
  width: "100%",
  height: 10,
  background: "#e0e0e0",
  borderRadius: 10,
  overflow: "hidden",
  marginTop: 8,
};

const progressBar = {
  height: "100%",
  background: "#6a1b9a",
  borderRadius: 10,
  transition:
    "width 0.2s ease",
};

const errorStyle = {
  marginTop: 15,
  padding: 12,
  background: "#ffebee",
  color: "#c62828",
  border:
    "1px solid #ef9a9a",
  borderRadius: 8,
  fontSize: 13,
};

const smallInfo = {
  fontSize: 11,
  color: "#757575",
  marginBottom: 10,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
  minWidth: 1200,
};

const thStyle = {
  background: "#f3e5f5",
  color: "#6a1b9a",
  border:
    "1px solid #ddd",
  padding: "9px 7px",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle = {
  border:
    "1px solid #e0e0e0",
  padding: "8px 7px",
  color: "#37474f",
  whiteSpace: "nowrap",
};

const textAreaStyle = {
  width: "100%",
  minHeight: 220,
  padding: 13,
  border:
    "1px solid #cfd8dc",
  borderRadius: 9,
  resize: "vertical",
  fontFamily:
    "Consolas, 'Courier New', monospace",
  fontSize: 13,
  lineHeight: 1.5,
  boxSizing: "border-box",
};

const purchaseButtonStyle = {
  marginTop: 15,
  background: "#2e7d32",
  color: "white",
  border: "none",
  padding: "13px 20px",
  borderRadius: 9,
  fontWeight: "bold",
  fontSize: 14,
  cursor: "pointer",
};

const infoBoxStyle = {
  marginTop: 12,
  padding: 12,
  background: "#f3e5f5",
  color: "#6a1b9a",
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.5,
};

const footerStyle = {
  textAlign: "center",
  color: "#9aa3ad",
  fontSize: 11,
  padding: "10px",
};

export default BillScanner;