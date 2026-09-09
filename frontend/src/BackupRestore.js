import React, { useRef } from "react";

function BackupRestore({ goBack }) {
  const fileInputRef = useRef(null);

  const createBackup = () => {
    const backup = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key) {
        backup[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "Shivam-Medical-ERP-Backup.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    alert("✅ Backup successfully download ho gaya.");
  };

  const restoreBackup = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);

        if (
          typeof backup !== "object" ||
          backup === null ||
          Array.isArray(backup)
        ) {
          alert("❌ Invalid backup file.");
          return;
        }

        const confirmRestore = window.confirm(
          "⚠️ Restore karne par current ERP data replace ho sakta hai.\n\nKya aap continue karna chahte hain?"
        );

        if (!confirmRestore) {
          return;
        }

        Object.keys(backup).forEach((key) => {
          localStorage.setItem(
            key,
            backup[key]
          );
        });

        alert(
          "✅ Backup restore ho gaya.\n\nERP ko refresh kiya ja raha hai."
        );

        window.location.reload();
      } catch (error) {
        console.error(error);
        alert(
          "❌ Backup file read nahi ho payi."
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg,#0d47a1,#1976d2)",
          color: "white",
          padding: "25px",
          borderRadius: "15px",
          marginBottom: "25px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          💾 Backup & Restore
        </h1>

        <p>
          Shivam Medical ERP
        </p>
      </div>

      <button
        type="button"
        onClick={goBack}
        style={{
          padding: "11px 20px",
          marginBottom: "20px",
          border: "none",
          borderRadius: "7px",
          background: "#555",
          color: "white",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        ⬅️ Dashboard
      </button>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          maxWidth: "700px",
          margin: "0 auto",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2>📥 Create Backup</h2>

        <p>
          ERP का पूरा data एक JSON file में
          सुरक्षित करें।
        </p>

        <button
          type="button"
          onClick={createBackup}
          style={{
            padding: "14px 25px",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "17px",
            fontWeight: "bold",
          }}
        >
          📥 Download Backup
        </button>

        <hr
          style={{
            margin: "30px 0",
          }}
        />

        <h2>📤 Restore Backup</h2>

        <p>
          पहले से बनाई गई JSON backup file
          को वापस ERP में डालें।
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={restoreBackup}
          style={{
            display: "none",
          }}
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          style={{
            padding: "14px 25px",
            background: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "17px",
            fontWeight: "bold",
          }}
        >
          📤 Select Backup & Restore
        </button>
      </div>
    </div>
  );
}

export default BackupRestore;