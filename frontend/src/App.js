import React, { useEffect, useState } from "react";

import Login from "./Login";
import Dashboard from "./Dashboard";
import Purchase from "./Purchase";
import PurchaseScheme from "./PurchaseScheme";
import Stock from "./Stock";
import Billing from "./Billing";
import Sale from "./Sale";
import Expiry from "./Expiry";
import Reports from "./Reports";

import SalesHistory from "./SalesHistory";
import PurchaseHistory from "./PurchaseHistory";

import CustomerLedger from "./CustomerLedger";
import CustomerPayment from "./CustomerPayment";

import SupplierLedger from "./SupplierLedger";
import SupplierPayment from "./SupplierPayment";

import Backup from "./Backup";
import Barcode from "./Barcode";
import BillScanner from "./BillScanner";

function App() {
  // =====================================================
  // LOGIN
  // =====================================================

  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("loggedIn") === "true";
  });

  // =====================================================
  // PAGE
  // =====================================================

  const [page, setPage] = useState("dashboard");

  // =====================================================
  // STOCK
  // =====================================================

  const [stock, setStock] = useState(() => {
    try {
      const savedStock = JSON.parse(
        localStorage.getItem("stock") || "[]"
      );

      return Array.isArray(savedStock)
        ? savedStock
        : [];
    } catch (error) {
      console.error("Stock load error:", error);
      return [];
    }
  });

  // =====================================================
  // SAVE STOCK
  // =====================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "stock",
        JSON.stringify(stock)
      );
    } catch (error) {
      console.error("Stock save error:", error);
    }
  }, [stock]);

  // =====================================================
  // DESKTOP FINISHING
  // =====================================================

  useEffect(() => {
    const previousBodyStyle = {
      margin: document.body.style.margin,
      padding: document.body.style.padding,
      background: document.body.style.background,
      fontFamily: document.body.style.fontFamily,
      overflowX: document.body.style.overflowX,
    };

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#f2f5f9";
    document.body.style.fontFamily =
      "Arial, Helvetica, sans-serif";
    document.body.style.overflowX = "hidden";

    document.documentElement.style.background =
      "#f2f5f9";

    return () => {
      document.body.style.margin =
        previousBodyStyle.margin;

      document.body.style.padding =
        previousBodyStyle.padding;

      document.body.style.background =
        previousBodyStyle.background;

      document.body.style.fontFamily =
        previousBodyStyle.fontFamily;

      document.body.style.overflowX =
        previousBodyStyle.overflowX;

      document.documentElement.style.background =
        "";
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = () => {
    localStorage.setItem(
      "loggedIn",
      "true"
    );

    setLoggedIn(true);
    setPage("dashboard");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem(
      "loggedIn"
    );

    setLoggedIn(false);
    setPage("dashboard");
  };

  // =====================================================
  // KEYBOARD SHORTCUTS
  // =====================================================

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    const handleKeyboard = (event) => {
      // =================================================
      // ESC = DASHBOARD
      // =================================================

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        setPage("dashboard");

        return;
      }

      // =================================================
      // CHECK TYPING
      // =================================================

      const target = event.target;

      const tag =
        target?.tagName?.toLowerCase();

      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      // =================================================
      // ALT SHORTCUT
      // =================================================

      if (
        !event.altKey ||
        isTyping
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      switch (key) {
        // =================================================
        // ALT + 1 = OLD PURCHASE
        // =================================================

        case "1":
          event.preventDefault();
          setPage("purchase");
          break;

        // =================================================
        // ALT + 2 = STOCK
        // =================================================

        case "2":
          event.preventDefault();
          setPage("stock");
          break;

        // =================================================
        // ALT + 3 = SALE
        // =================================================

        case "3":
          event.preventDefault();
          setPage("sale");
          break;

        // =================================================
        // ALT + 4 = BILLING
        // =================================================

        case "4":
          event.preventDefault();
          setPage("billing");
          break;

        // =================================================
        // ALT + 5 = BARCODE
        // =================================================

        case "5":
          event.preventDefault();
          setPage("barcode");
          break;

        // =================================================
        // ALT + 6 = REPORTS
        // =================================================

        case "6":
          event.preventDefault();
          setPage("reports");
          break;

        // =================================================
        // ALT + 7 = CUSTOMER LEDGER
        // =================================================

        case "7":
          event.preventDefault();
          setPage("customerLedger");
          break;

        // =================================================
        // ALT + 8 = SUPPLIER LEDGER
        // =================================================

        case "8":
          event.preventDefault();
          setPage("supplierLedger");
          break;

        // =================================================
        // ALT + 9 = EXPIRY
        // =================================================

        case "9":
          event.preventDefault();
          setPage("expiry");
          break;

        // =================================================
        // ALT + 0 = UNUSED
        // =================================================

        case "0":
          event.preventDefault();
          setPage("purchaseScheme");
          break;

        default:
          break;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard,
      true
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
        true
      );
    };
  }, [loggedIn]);

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!loggedIn) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  if (page === "dashboard") {
    return (
      <Dashboard
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        onLogout={logout}
      />
    );
  }

  // =====================================================
  // OLD PURCHASE
  // =====================================================

  if (page === "purchase") {
    return (
      <Purchase
        stock={stock}
        setStock={setStock}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // NEW PURCHASE SCHEME
  // =====================================================

  if (page === "purchaseScheme") {
    return (
      <PurchaseScheme
        stock={stock}
        setStock={setStock}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // BILL SCANNER
  // =====================================================

  if (page === "billScanner") {
    return (
      <BillScanner
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // STOCK
  // =====================================================

  if (page === "stock") {
    return (
      <Stock
        stock={stock}
        setStock={setStock}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // BILLING
  // =====================================================

  if (page === "billing") {
    return (
      <Billing
        stock={stock}
        setStock={setStock}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // SALE
  // =====================================================

  if (page === "sale") {
    return (
      <Sale
        stock={stock}
        setStock={setStock}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // BARCODE
  // =====================================================

  if (page === "barcode") {
    return (
      <Barcode
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // SALES HISTORY
  // =====================================================

  if (page === "salesHistory") {
    return (
      <SalesHistory
        stock={stock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // PURCHASE HISTORY
  // =====================================================

  if (page === "purchaseHistory") {
    return (
      <PurchaseHistory
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // CUSTOMER LEDGER
  // =====================================================

  if (page === "customerLedger") {
    return (
      <CustomerLedger
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // CUSTOMER PAYMENT
  // =====================================================

  if (page === "customerPayment") {
    return (
      <CustomerPayment
        setPage={setPage}
        goBack={() =>
          setPage("customerLedger")
        }
      />
    );
  }

  // =====================================================
  // SUPPLIER LEDGER
  // =====================================================

  if (page === "supplierLedger") {
    return (
      <SupplierLedger
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // SUPPLIER PAYMENT
  // =====================================================

  if (page === "supplierPayment") {
    return (
      <SupplierPayment
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        goBack={() =>
          setPage("supplierLedger")
        }
      />
    );
  }

  // =====================================================
  // EXPIRY
  // =====================================================

  if (page === "expiry") {
    return (
      <Expiry
        stock={stock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // REPORTS
  // =====================================================

  if (page === "reports") {
    return (
      <Reports
        stock={stock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // BACKUP
  // =====================================================

  if (page === "backup") {
    return (
      <Backup
        stock={stock}
        setStock={setStock}
        setPage={setPage}
        goBack={() =>
          setPage("dashboard")
        }
      />
    );
  }

  // =====================================================
  // UNKNOWN PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        background: "#f2f5f9",
      }}
    >
      <h2>
        ⚠️ Page नहीं मिली
      </h2>

      <button
        type="button"
        onClick={() =>
          setPage("dashboard")
        }
        style={{
          padding:
            "10px 18px",
          background:
            "#1565c0",
          color: "white",
          border: "none",
          borderRadius:
            "7px",
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        ⬅️ Dashboard
      </button>
    </div>
  );
}

export default App;