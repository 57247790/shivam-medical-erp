import React, { useState } from "react";

function Barcode({ stock = [], setPage, goBack }) {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState(null);

  const searchBarcode = () => {
    const code = barcode.trim();

    if (!code) {
      alert("⚠️ पहले Barcode डालें");
      return;
    }

    const found = stock.find(
      (item) =>
        String(item.barcode || "").trim() === code
    );

    if (!found) {
      setResult(null);
      alert("❌ यह Barcode Stock में नहीं मिला");
      return;
    }

    setResult(found);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg,#1565c0,#42a5f5)",
          color: "white",
          padding: "18px",
          borderRadius: "10px",
          marginBottom: "15px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          🔎 Barcode Scanner
        </h1>

        <p style={{ marginBottom: 0 }}>
          Medicine Barcode Search
        </p>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "650px",
          margin: "auto",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>📦 Barcode Search</h2>

        <input
          autoFocus
          type="text"
          placeholder="Barcode Scan / Enter Barcode"
          value={barcode}
          onChange={(e) =>
            setBarcode(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchBarcode();
            }
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px",
            fontSize: "17px",
            border: "2px solid #1976d2",
            borderRadius: "7px",
          }}
        />

        <button
          type="button"
          onClick={searchBarcode}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "13px",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "7px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🔎 Search Barcode
        </button>

        {result && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#e8f5e9",
              border: "1px solid #66bb6a",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              ✅ Medicine Found
            </h3>

            <p>
              <b>Medicine:</b>{" "}
              {result.medicine || "-"}
            </p>

            <p>
              <b>Company:</b>{" "}
              {result.company || "-"}
            </p>

            <p>
              <b>Batch:</b>{" "}
              {result.batch || "-"}
            </p>

            <p>
              <b>Barcode:</b>{" "}
              {result.barcode || "-"}
            </p>

            <p>
              <b>Stock:</b>{" "}
              {result.quantity || 0}
            </p>

            <p>
              <b>Sale Rate:</b> ₹
              {Number(
                result.saleRate ||
                  result.mrp ||
                  0
              ).toFixed(2)}
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("billing")
              }
              style={{
                width: "100%",
                padding: "11px",
                background: "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "7px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💰 Billing में जाएँ
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={goBack}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "11px",
            background: "#555",
            color: "white",
            border: "none",
            borderRadius: "7px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⬅️ Dashboard
        </button>
      </div>
    </div>
  );
}

export default Barcode;