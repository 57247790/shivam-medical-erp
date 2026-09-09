import React, { useMemo, useState } from "react";

function BarcodeScanner({ stock, setStock, goBack }) {
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const currentStock = useMemo(
    () => (Array.isArray(stock) ? stock : []),
    [stock]
  );

  /* =====================================================
     FIND MEDICINE BY BARCODE
  ===================================================== */

  const findMedicine = () => {
    const code = barcode.trim();

    if (!code) {
      setMessage("⚠️ Barcode डालें");
      setSelectedMedicine(null);
      return;
    }

    const found = currentStock.find(
      (item) =>
        String(item.barcode || "").trim() === code
    );

    if (!found) {
      setSelectedMedicine(null);
      setMessage(
        "❌ यह Barcode Stock में नहीं मिला"
      );
      return;
    }

    setSelectedMedicine(found);

    setMessage(
      `✅ Medicine मिल गई: ${
        found.medicine || "Medicine"
      }`
    );
  };

  /* =====================================================
     ADD TO BILLING / SALE
  ===================================================== */

  const addToBilling = () => {
    if (!selectedMedicine) {
      setMessage("⚠️ पहले Barcode Search करें");
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      setMessage("⚠️ Quantity सही डालें");
      return;
    }

    const available = Number(
      selectedMedicine.quantity || 0
    );

    if (qty > available) {
      setMessage(
        `❌ Stock कम है। उपलब्ध Quantity: ${available}`
      );
      return;
    }

    /*
      Barcode से selected medicine को
      Billing के लिए localStorage में save किया जा रहा है
    */

    const billingItem = {
      ...selectedMedicine,
      quantity: qty,
      barcode: String(
        selectedMedicine.barcode || ""
      ),
      addedAt: Date.now(),
    };

    localStorage.setItem(
      "barcodeBillingItem",
      JSON.stringify(billingItem)
    );

    localStorage.setItem(
      "barcodeBillingUpdatedAt",
      String(Date.now())
    );

    window.dispatchEvent(
      new Event("barcodeBillingUpdated")
    );

    setMessage(
      `✅ ${selectedMedicine.medicine} Billing में जोड़ दी गई`
    );

    /*
      Billing page खोलने के लिए
      थोड़ी देर बाद goBack की जगह parent navigation
      उपलब्ध हो तो billing पर भेजेंगे
    */

    if (window.confirm(
      `${selectedMedicine.medicine}\n\nQuantity: ${qty}\n\nBilling में जाएँ?`
    )) {
      localStorage.setItem(
        "openBillingFromBarcode",
        "true"
      );

      if (goBack) {
        goBack("billing");
      }
    }
  };

  /* =====================================================
     RESET
  ===================================================== */

  const clearSearch = () => {
    setBarcode("");
    setQuantity("1");
    setSelectedMedicine(null);
    setMessage("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 15,
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#6a1b9a,#ab47bc)",
          color: "white",
          padding: 16,
          borderRadius: 12,
          marginBottom: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            📷 Barcode Scanner
          </h2>

          <div
            style={{
              fontSize: 13,
              marginTop: 4,
              opacity: 0.9,
            }}
          >
            Shivam Medical ERP
          </div>
        </div>

        <button
          onClick={goBack}
          style={{
            background: "white",
            color: "#6a1b9a",
            border: "none",
            padding: "9px 14px",
            borderRadius: 7,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⬅️ Back
        </button>
      </div>

      {/* SCANNER BOX */}

      <div
        style={{
          background: "white",
          padding: 18,
          borderRadius: 12,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: 15,
        }}
      >

        <h3
          style={{
            marginTop: 0,
          }}
        >
          📷 Scan / Enter Barcode
        </h3>

        <input
          autoFocus
          type="text"
          placeholder="Barcode Scan करें या Number डालें"
          value={barcode}
          onChange={(e) =>
            setBarcode(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              findMedicine();
            }
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 13,
            border:
              "2px solid #6a1b9a",
            borderRadius: 8,
            fontSize: 16,
            marginBottom: 10,
          }}
        />

        <button
          onClick={findMedicine}
          style={{
            width: "100%",
            padding: 13,
            border: "none",
            borderRadius: 8,
            background: "#6a1b9a",
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔍 Search Barcode
        </button>

        <button
          onClick={clearSearch}
          style={{
            width: "100%",
            padding: 11,
            marginTop: 8,
            border: "1px solid #ccc",
            borderRadius: 8,
            background: "#f5f5f5",
            color: "#333",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔄 Clear
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div
          style={{
            background:
              message.startsWith("✅")
                ? "#e8f5e9"
                : "#ffebee",
            border:
              message.startsWith("✅")
                ? "1px solid #81c784"
                : "1px solid #ef9a9a",
            color:
              message.startsWith("✅")
                ? "#2e7d32"
                : "#c62828",
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}

      {/* MEDICINE RESULT */}

      {selectedMedicine && (
        <div
          style={{
            background: "white",
            padding: 18,
            borderRadius: 12,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

          <h3
            style={{
              marginTop: 0,
              color: "#2e7d32",
            }}
          >
            💊 Medicine Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 10,
              marginBottom: 15,
            }}
          >

            <Detail
              title="Medicine"
              value={
                selectedMedicine.medicine ||
                "-"
              }
            />

            <Detail
              title="Company"
              value={
                selectedMedicine.company ||
                "-"
              }
            />

            <Detail
              title="Barcode"
              value={
                selectedMedicine.barcode ||
                "-"
              }
            />

            <Detail
              title="Stock"
              value={
                selectedMedicine.quantity ||
                0
              }
            />

            <Detail
              title="Sale Rate"
              value={`₹${Number(
                selectedMedicine.saleRate ||
                  selectedMedicine.sellingRate ||
                  selectedMedicine.mrp ||
                  0
              ).toFixed(2)}`}
            />

            <Detail
              title="Expiry"
              value={
                selectedMedicine.expiry ||
                "-"
              }
            />

          </div>

          {/* QUANTITY */}

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 5,
            }}
          >
            Quantity
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              border:
                "1px solid #ccc",
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 10,
            }}
          />

          <button
            onClick={addToBilling}
            style={{
              width: "100%",
              padding: 14,
              background: "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 17,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🧾 Billing में भेजें
          </button>

        </div>
      )}

      {/* STOCK BARCODE LIST */}

      <div
        style={{
          background: "white",
          padding: 15,
          borderRadius: 12,
          marginTop: 15,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >

        <h3
          style={{
            marginTop: 0,
          }}
        >
          📦 Barcode वाले Stock Items
        </h3>

        {currentStock.filter(
          (item) => item.barcode
        ).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: "#777",
            }}
          >
            अभी किसी medicine में Barcode save नहीं है।
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
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
                    Stock
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentStock
                  .filter(
                    (item) =>
                      item.barcode
                  )
                  .map(
                    (item, index) => (
                      <tr key={index}>

                        <td style={tdStyle}>
                          {item.medicine ||
                            "-"}
                        </td>

                        <td style={tdStyle}>
                          {item.barcode}
                        </td>

                        <td style={tdStyle}>
                          {item.quantity ||
                            0}
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
  );
}

/* =====================================================
   DETAIL
===================================================== */

function Detail({ title, value }) {
  return (
    <div
      style={{
        background: "#f7f9fc",
        padding: 12,
        borderRadius: 8,
        borderLeft:
          "4px solid #6a1b9a",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#777",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontWeight: "bold",
          color: "#333",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f1f5f9",
  whiteSpace: "nowrap",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: 8,
  whiteSpace: "nowrap",
};

export default BarcodeScanner;