import React, { useRef, useState } from "react";

function Backup({ goBack }) {
  const fileInputRef = useRef(null);

  const [backupInfo, setBackupInfo] = useState(null);
  const [message, setMessage] = useState("");

  // =====================================================
  // ALL IMPORTANT ERP DATA
  // =====================================================

  const ERP_KEYS = [
    "stock",
    "bills",
    "sales",
    "purchaseHistory",
    "customerPayments",
    "supplierPayments",
    "customerLedger",
    "supplierLedger",
    "suppliers",
    "customers",
    "medicineStock",
    "purchases",
    "payments",
  ];

  // =====================================================
  // SAFE LOAD
  // =====================================================

  const loadLocalStorage = () => {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key) continue;

      data[key] = localStorage.getItem(key);
    }

    return data;
  };

  // =====================================================
  // CREATE BACKUP
  // =====================================================

  const createBackup = () => {
    try {
      const localStorageData = loadLocalStorage();

      const backup = {
        app: "Shivam Medical ERP",

        version: "1.0",

        backupDate: new Date().toISOString(),

        data: localStorageData,
      };

      const json = JSON.stringify(
        backup,
        null,
        2
      );

      const blob = new Blob(
        [json],
        {
          type:
            "application/json;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const date = new Date();

      const fileDate =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}_${String(
          date.getHours()
        ).padStart(2, "0")}-${String(
          date.getMinutes()
        ).padStart(2, "0")}`;

      link.download =
        `Shivam-Medical-ERP-Backup-${fileDate}.json`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      const keyCount =
        Object.keys(localStorageData).length;

      setMessage(
        `✅ Backup Successfully Created\n${keyCount} data records/keys सुरक्षित किए गए।`
      );

      alert(
        "✅ Backup Successfully Created\n\n" +
          "ERP का पूरा data JSON file में save हो गया है।"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Backup बनाने में समस्या हुई।"
      );

      alert(
        "❌ Backup नहीं बन पाया।"
      );
    }
  };

  // =====================================================
  // OPEN FILE
  // =====================================================

  const openRestoreFile = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // RESTORE FILE
  // =====================================================

  const handleRestoreFile = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.name
        .toLowerCase()
        .endsWith(".json")
    ) {
      alert(
        "⚠️ केवल JSON Backup File select करें।"
      );

      event.target.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text =
          e.target.result;

        const backup =
          JSON.parse(text);

        // =============================================
        // VALIDATE BACKUP
        // =============================================

        if (
          !backup ||
          typeof backup !== "object"
        ) {
          throw new Error(
            "Invalid backup"
          );
        }

        let backupData = null;

        // New backup format
        if (
          backup.data &&
          typeof backup.data === "object"
        ) {
          backupData = backup.data;
        }

        // Old/simple backup format
        if (
          !backupData &&
          typeof backup === "object"
        ) {
          backupData = backup;
        }

        if (
          !backupData ||
          typeof backupData !== "object"
        ) {
          throw new Error(
            "Backup data missing"
          );
        }

        const keys =
          Object.keys(backupData);

        if (keys.length === 0) {
          throw new Error(
            "Backup empty"
          );
        }

        // =============================================
        // CONFIRM
        // =============================================

        const confirmRestore =
          window.confirm(
            "⚠️ WARNING\n\n" +
              "Restore करने पर current ERP data replace/update होगा।\n\n" +
              "क्या आप Restore करना चाहते हैं?"
          );

        if (!confirmRestore) {
          event.target.value = "";

          return;
        }

        // =============================================
        // RESTORE
        // =============================================

        let restoredCount = 0;

        keys.forEach((key) => {
          const value =
            backupData[key];

          if (
            typeof value === "string"
          ) {
            localStorage.setItem(
              key,
              value
            );

            restoredCount++;

            return;
          }

          // If backup somehow contains
          // already parsed objects
          try {
            localStorage.setItem(
              key,
              JSON.stringify(value)
            );

            restoredCount++;
          } catch {
            // ignore invalid value
          }
        });

        // =============================================
        // IMPORTANT STOCK SYNC
        // =============================================

        try {
          const restoredStock =
            JSON.parse(
              localStorage.getItem(
                "stock"
              ) || "[]"
            );

          if (
            Array.isArray(
              restoredStock
            )
          ) {
            localStorage.setItem(
              "stock",
              JSON.stringify(
                restoredStock
              )
            );
          }
        } catch {
          // ignore
        }

        // =============================================
        // SUCCESS
        // =============================================

        setBackupInfo({
          fileName: file.name,

          backupDate:
            backup.backupDate ||
            "Unknown",

          keys: restoredCount,
        });

        setMessage(
          `✅ Restore Successfully\n${restoredCount} data keys restore हुईं।`
        );

        alert(
          "✅ Restore Successfully\n\n" +
            `${restoredCount} data keys restore हुईं।\n\n` +
            "ERP अब refresh होगा।"
        );

        // =============================================
        // REFRESH APP
        // =============================================

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } catch (error) {
        console.error(error);

        setMessage(
          "❌ यह valid Shivam Medical ERP backup नहीं है।"
        );

        alert(
          "❌ Invalid Backup File\n\n" +
            "कृपया Shivam Medical ERP की JSON backup file select करें।"
        );
      }

      event.target.value = "";
    };

    reader.onerror = () => {
      alert(
        "❌ File पढ़ने में समस्या हुई।"
      );

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  // =====================================================
  // SHOW DATA
  // =====================================================

  const getDataCount = (key) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      if (Array.isArray(data)) {
        return data.length;
      }

      if (
        data &&
        typeof data === "object"
      ) {
        return Object.keys(data).length;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={pageStyle}>

      {/* HEADER */}

      <div style={headerStyle}>

        <div>
          <h1 style={headerTitle}>
            💾 Backup & Restore
          </h1>

          <div style={subtitleStyle}>
            Shivam Medical ERP
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

      {/* MAIN ACTIONS */}

      <div style={actionGrid}>

        {/* BACKUP */}

        <div style={actionCard}>

          <div style={bigIcon}>
            💾
          </div>

          <h2 style={cardTitle}>
            Create Backup
          </h2>

          <p style={description}>
            ERP का पूरा data एक सुरक्षित
            JSON file में download करें।
          </p>

          <button
            type="button"
            onClick={createBackup}
            style={backupButton}
          >
            📥 Download Backup
          </button>

        </div>

        {/* RESTORE */}

        <div style={actionCard}>

          <div style={bigIcon}>
            📤
          </div>

          <h2 style={cardTitle}>
            Restore Backup
          </h2>

          <p style={description}>
            पहले बनाई गई JSON backup file
            से ERP data वापस लाएँ।
          </p>

          <button
            type="button"
            onClick={openRestoreFile}
            style={restoreButton}
          >
            📤 Select Backup File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreFile}
            style={{
              display: "none",
            }}
          />

        </div>

      </div>

      {/* MESSAGE */}

      {message && (
        <div style={messageBox}>
          {message}
        </div>
      )}

      {/* RESTORE INFO */}

      {backupInfo && (
        <div style={sectionStyle}>

          <h2 style={sectionTitle}>
            📋 Last Restore
          </h2>

          <div style={infoRow}>
            <span>
              File
            </span>

            <b>
              {backupInfo.fileName}
            </b>
          </div>

          <div style={infoRow}>
            <span>
              Backup Date
            </span>

            <b>
              {backupInfo.backupDate}
            </b>
          </div>

          <div style={infoRow}>
            <span>
              Restored Keys
            </span>

            <b>
              {backupInfo.keys}
            </b>
          </div>

        </div>
      )}

      {/* DATA STATUS */}

      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          📊 Current ERP Data
        </h2>

        <div style={dataGrid}>

          <DataCard
            title="Stock"
            value={getDataCount("stock")}
            icon="📦"
          />

          <DataCard
            title="Bills"
            value={getDataCount("bills")}
            icon="🧾"
          />

          <DataCard
            title="Sales"
            value={getDataCount("sales")}
            icon="💰"
          />

          <DataCard
            title="Purchases"
            value={getDataCount(
              "purchaseHistory"
            )}
            icon="🛒"
          />

          <DataCard
            title="Customer Payments"
            value={getDataCount(
              "customerPayments"
            )}
            icon="👤"
          />

          <DataCard
            title="Supplier Payments"
            value={getDataCount(
              "supplierPayments"
            )}
            icon="🏢"
          />

        </div>

      </div>

      {/* IMPORTANT NOTE */}

      <div style={warningBox}>

        <h3 style={{ marginTop: 0 }}>
          ⚠️ Important
        </h3>

        <ul style={listStyle}>

          <li>
            Backup file को सुरक्षित जगह पर रखें।
          </li>

          <li>
            Computer खराब होने पर backup file
            से data वापस restore किया जा सकता है।
          </li>

          <li>
            Restore करने से पहले current data
            का नया backup रखना बेहतर है।
          </li>

          <li>
            Backup file किसी अनजान व्यक्ति के साथ
            share न करें।
          </li>

        </ul>

      </div>

    </div>
  );
}

// =====================================================
// DATA CARD
// =====================================================

function DataCard({
  title,
  value,
  icon,
}) {
  return (
    <div style={dataCardStyle}>

      <div style={dataIcon}>
        {icon}
      </div>

      <div style={dataTitle}>
        {title}
      </div>

      <div style={dataValue}>
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
  padding: "12px",
  background: "#f2f5f9",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#0d47a1,#1976d2,#42a5f5)",
  color: "white",
  padding: "16px",
  borderRadius: "11px",
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.12)",
};

const headerTitle = {
  margin: 0,
  fontSize: "23px",
};

const subtitleStyle = {
  marginTop: "4px",
  fontSize: "13px",
};

const backButton = {
  padding: "9px 14px",
  background: "rgba(255,255,255,0.2)",
  color: "white",
  border:
    "1px solid rgba(255,255,255,0.5)",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold",
};

const actionGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(280px,1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const actionCard = {
  background: "white",
  padding: "20px",
  borderRadius: "11px",
  textAlign: "center",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.07)",
};

const bigIcon = {
  fontSize: "45px",
};

const cardTitle = {
  margin: "8px 0",
  fontSize: "20px",
};

const description = {
  color: "#666",
  fontSize: "13px",
  lineHeight: "1.5",
  minHeight: "40px",
};

const backupButton = {
  width: "100%",
  padding: "11px",
  background: "#1565c0",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold",
};

const restoreButton = {
  width: "100%",
  padding: "11px",
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold",
};

const messageBox = {
  background: "#e8f5e9",
  color: "#2e7d32",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "12px",
  whiteSpace: "pre-line",
  fontWeight: "bold",
  fontSize: "13px",
};

const sectionStyle = {
  background: "white",
  padding: "14px",
  borderRadius: "11px",
  marginBottom: "12px",
  boxShadow:
    "0 2px 7px rgba(0,0,0,0.06)",
};

const sectionTitle = {
  margin: "0 0 12px",
  fontSize: "18px",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  padding: "9px",
  marginBottom: "6px",
  background: "#f8fafc",
  borderRadius: "6px",
  fontSize: "13px",
  flexWrap: "wrap",
};

const dataGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(150px,1fr))",
  gap: "8px",
};

const dataCardStyle = {
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "center",
  border:
    "1px solid #e5e7eb",
};

const dataIcon = {
  fontSize: "25px",
};

const dataTitle = {
  marginTop: "4px",
  color: "#666",
  fontSize: "12px",
};

const dataValue = {
  marginTop: "3px",
  color: "#1565c0",
  fontSize: "20px",
  fontWeight: "bold",
};

const warningBox = {
  background: "#fff8e1",
  color: "#6d4c41",
  padding: "14px",
  borderRadius: "9px",
  marginBottom: "15px",
  fontSize: "13px",
};

const listStyle = {
  marginBottom: 0,
  paddingLeft: "20px",
  lineHeight: "1.8",
};

export default Backup;