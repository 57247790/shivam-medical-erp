import React, { useEffect, useMemo, useState } from "react";

function OrderHistory({ goBack }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refresh, setRefresh] = useState(0);

  // =====================================================
  // SAFE LOCAL STORAGE
  // =====================================================

  const getArray = (key) => {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        return [];
      }

      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Order History Storage Error:", error);
      return [];
    }
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  useEffect(() => {
    setOrders(getArray("orderHistory"));
  }, [refresh]);

  // =====================================================
  // REFRESH
  // =====================================================

  useEffect(() => {
    const refreshOrders = () => {
      setRefresh((prev) => prev + 1);
    };

    window.addEventListener(
      "orderHistoryUpdated",
      refreshOrders
    );

    window.addEventListener(
      "storage",
      refreshOrders
    );

    return () => {
      window.removeEventListener(
        "orderHistoryUpdated",
        refreshOrders
      );

      window.removeEventListener(
        "storage",
        refreshOrders
      );
    };
  }, []);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatus = (order) => {
    return String(
      order?.status || "pending"
    )
      .trim()
      .toLowerCase();
  };

  const getStatusText = (status) => {
    if (status === "sent") {
      return "Sent";
    }

    if (status === "completed") {
      return "Completed";
    }

    if (status === "cancelled") {
      return "Cancelled";
    }

    return "Pending";
  };

  const getStatusColor = (status) => {
    if (status === "sent") {
      return "#1565c0";
    }

    if (status === "completed") {
      return "#2e7d32";
    }

    if (status === "cancelled") {
      return "#d32f2f";
    }

    return "#ef6c00";
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const supplier = String(
        order?.supplier || ""
      ).toLowerCase();

      const mobile = String(
        order?.supplierMobile || ""
      ).toLowerCase();

      const status = getStatus(order);

      const itemsText = Array.isArray(order?.items)
        ? order.items
            .map((item) =>
              String(
                item?.medicine || ""
              ).toLowerCase()
            )
            .join(" ")
        : "";

      const searchMatch =
        !query ||
        supplier.includes(query) ||
        mobile.includes(query) ||
        itemsText.includes(query);

      const statusMatch =
        statusFilter === "all" ||
        status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  // =====================================================
  // DELETE ONE ORDER
  // =====================================================

  const deleteOrder = (id) => {
    if (!window.confirm("क्या यह Order History से delete करना है?")) {
      return;
    }

    const updatedOrders = orders.filter(
      (order) => order.id !== id
    );

    localStorage.setItem(
      "orderHistory",
      JSON.stringify(updatedOrders)
    );

    setOrders(updatedOrders);

    window.dispatchEvent(
      new Event("orderHistoryUpdated")
    );
  };

  // =====================================================
  // CLEAR ALL HISTORY
  // =====================================================

  const clearAllHistory = () => {
    if (orders.length === 0) {
      alert("Order History पहले से खाली है।");
      return;
    }

    if (
      !window.confirm(
        "⚠️ पूरी Order History delete करनी है?"
      )
    ) {
      return;
    }

    localStorage.removeItem("orderHistory");

    setOrders([]);

    window.dispatchEvent(
      new Event("orderHistoryUpdated")
    );
  };

  // =====================================================
  // CHANGE STATUS
  // =====================================================

  const changeStatus = (id, newStatus) => {
    const updatedOrders = orders.map((order) => {
      if (order.id !== id) {
        return order;
      }

      return {
        ...order,
        status: newStatus,
      };
    });

    localStorage.setItem(
      "orderHistory",
      JSON.stringify(updatedOrders)
    );

    setOrders(updatedOrders);

    window.dispatchEvent(
      new Event("orderHistoryUpdated")
    );
  };

  // =====================================================
  // WHATSAPP AGAIN
  // =====================================================

  const sendWhatsAppAgain = (order) => {
    if (
      !order ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      alert("⚠️ इस Order में कोई medicine नहीं है।");
      return;
    }

    let mobile = String(
      order.supplierMobile || ""
    ).replace(/\D/g, "");

    if (!mobile) {
      alert(
        "⚠️ Supplier का WhatsApp/Mobile Number saved नहीं है।"
      );
      return;
    }

    if (mobile.length === 10) {
      mobile = "91" + mobile;
    }

    let message =
      "🏥 *Shivam Medical Store*\n";

    message +=
      "📦 *Medicine Order*\n\n";

    message +=
      "Supplier: " +
      (order.supplier || "-") +
      "\n\n";

    order.items.forEach((item, index) => {
      message +=
        `${index + 1}. ${item.medicine || "-"}`;

      if (item.company) {
        message +=
          ` (${item.company})`;
      }

      message +=
        ` - Qty: ${item.quantity || 0}\n`;
    });

    message +=
      "\n🙏 कृपया माल भेज दें।";

    const url =
      "https://wa.me/" +
      mobile +
      "?text=" +
      encodeURIComponent(message);

    window.open(url, "_blank");

    changeStatus(
      order.id,
      "sent"
    );
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      getStatus(order) === "pending"
  ).length;

  const sentOrders = orders.filter(
    (order) =>
      getStatus(order) === "sent"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      getStatus(order) === "completed"
  ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={pageStyle}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={headerStyle}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
            }}
          >
            📜 Order History
          </h1>

          <div
            style={{
              marginTop: 6,
              opacity: 0.9,
              fontSize: 13,
            }}
          >
            पुराने Medicine Orders
          </div>
        </div>

        <button
          type="button"
          onClick={goBack}
          style={backTopButton}
        >
          ⬅️ Dashboard
        </button>
      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div
        style={summaryGrid}
      >
        <SummaryCard
          title="Total Orders"
          value={totalOrders}
          icon="📦"
          color="#1565c0"
        />

        <SummaryCard
          title="Pending"
          value={pendingOrders}
          icon="⏳"
          color="#ef6c00"
        />

        <SummaryCard
          title="Sent"
          value={sentOrders}
          icon="💬"
          color="#25D366"
        />

        <SummaryCard
          title="Completed"
          value={completedOrders}
          icon="✅"
          color="#2e7d32"
        />
      </div>

      {/* =================================================
          SEARCH / FILTER
      ================================================= */}

      <div
        style={boxStyle}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          🔎 Search Order
        </h2>

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Supplier / Mobile / Medicine Search"
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          style={inputStyle}
        >
          <option value="all">
            सभी Orders
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="sent">
            Sent
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

        {orders.length > 0 && (
          <button
            type="button"
            onClick={clearAllHistory}
            style={clearButton}
          >
            🗑️ Clear All History
          </button>
        )}
      </div>

      {/* =================================================
          ORDER LIST
      ================================================= */}

      <div
        style={boxStyle}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            📦 Saved Orders
          </h2>

          <span
            style={{
              color: "#666",
              fontSize: 13,
            }}
          >
            {filteredOrders.length} Order
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div
            style={emptyStyle}
          >
            <div
              style={{
                fontSize: 42,
              }}
            >
              📦
            </div>

            <div
              style={{
                marginTop: 8,
                fontWeight: "bold",
              }}
            >
              कोई Order नहीं मिला
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 12,
                color: "#888",
              }}
            >
              WhatsApp से भेजे गए Orders यहाँ दिखाई देंगे।
            </div>
          </div>
        ) : (
          filteredOrders.map(
            (order, orderIndex) => {
              const status =
                getStatus(order);

              const statusColor =
                getStatusColor(
                  status
                );

              return (
                <div
                  key={
                    order.id ||
                    orderIndex
                  }
                  style={{
                    border:
                      "1px solid #e1e5e9",
                    borderRadius: 12,
                    marginBottom: 14,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* ORDER HEADER */}

                  <div
                    style={{
                      padding: 14,
                      background:
                        "#f5f7fa",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        🏭{" "}
                        {order.supplier ||
                          "Unknown Supplier"}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#666",
                          fontSize: 12,
                        }}
                      >
                        📱{" "}
                        {order.supplierMobile ||
                          "Number not saved"}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#777",
                          fontSize: 11,
                        }}
                      >
                        🕐{" "}
                        {formatDate(
                          order.date
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          statusColor,
                        color: "white",
                        borderRadius: 20,
                        padding:
                          "6px 12px",
                        fontSize: 12,
                        fontWeight:
                          "bold",
                      }}
                    >
                      {getStatusText(
                        status
                      )}
                    </span>
                  </div>

                  {/* ITEMS */}

                  <div
                    style={{
                      padding: 12,
                    }}
                  >
                    {Array.isArray(
                      order.items
                    ) &&
                      order.items.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              item.id ||
                              index
                            }
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: 10,
                              padding:
                                "10px 4px",
                              borderBottom:
                                index <
                                order
                                  .items
                                  .length -
                                  1
                                  ? "1px solid #eee"
                                  : "none",
                            }}
                          >
                            <div>
                              <strong>
                                {index +
                                  1}
                                .{" "}
                                {
                                  item.medicine
                                }
                              </strong>

                              <div
                                style={{
                                  marginTop: 3,
                                  fontSize: 12,
                                  color: "#777",
                                }}
                              >
                                Qty:{" "}
                                <strong>
                                  {
                                    item.quantity
                                  }
                                </strong>

                                {item.company
                                  ? ` | ${item.company}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                  </div>

                  {/* ACTIONS */}

                  <div
                    style={{
                      padding: 12,
                      borderTop:
                        "1px solid #eee",
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        sendWhatsAppAgain(
                          order
                        )
                      }
                      style={
                        whatsappButton
                      }
                    >
                      💬 WhatsApp Again
                    </button>

                    {status !==
                      "completed" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            order.id,
                            "completed"
                          )
                        }
                        style={
                          completedButton
                        }
                      >
                        ✅ Completed
                      </button>
                    )}

                    {status !==
                      "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            order.id,
                            "pending"
                          )
                        }
                        style={
                          pendingButton
                        }
                      >
                        ⏳ Pending
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteOrder(
                          order.id
                        )
                      }
                      style={
                        deleteButton
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>

      {/* =================================================
          BACK
      ================================================= */}

      <button
        type="button"
        onClick={goBack}
        style={backButton}
      >
        ⬅️ Back To Dashboard
      </button>
    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 11,
        padding: 15,
        borderLeft:
          `5px solid ${color}`,
        boxShadow:
          "0 3px 10px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 24,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: "#777",
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 22,
          fontWeight: 800,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const pageStyle = {
  minHeight: "100vh",
  padding: 18,
  background:
    "linear-gradient(135deg,#eef3f8,#f7f9fc)",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  background:
    "linear-gradient(135deg,#0d47a1,#1565c0,#42a5f5)",
  color: "white",
  padding: "20px",
  borderRadius: 14,
  marginBottom: 18,
  boxShadow:
    "0 6px 20px rgba(21,101,192,0.20)",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const backTopButton = {
  background: "white",
  color: "#1565c0",
  border: "none",
  padding: "10px 15px",
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(160px,1fr))",
  gap: 12,
  marginBottom: 16,
};

const boxStyle = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  boxShadow:
    "0 3px 12px rgba(0,0,0,0.07)",
};

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  marginBottom: 12,
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 7,
  background: "white",
};

const clearButton = {
  background: "#d32f2f",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const emptyStyle = {
  padding: "45px 10px",
  textAlign: "center",
  color: "#777",
};

const whatsappButton = {
  background: "#25D366",
  color: "white",
  border: "none",
  padding: "9px 13px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const completedButton = {
  background: "#2e7d32",
  color: "white",
  border: "none",
  padding: "9px 13px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const pendingButton = {
  background: "#ef6c00",
  color: "white",
  border: "none",
  padding: "9px 13px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const deleteButton = {
  background: "#ffebee",
  color: "#d32f2f",
  border: "none",
  padding: "9px 13px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
};

const backButton = {
  width: "100%",
  padding: 13,
  background: "#555",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer",
  fontWeight: "bold",
};

export default OrderHistory;